import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {PERMISSIONS, RESULTS, check, request} from 'react-native-permissions';
import {formatAmount} from './utils';

// ---------------------------------------------------------------------------------
// No PDF library is installed in this app (only react-native-fs / rn-fetch-blob /
// react-native-share, none of which generate a PDF from data). Rather than pull in a
// new native dependency just for this, a booking invoice is assembled by hand as a
// minimal valid PDF (Helvetica text on A4 pages) — just enough PDF structure
// (catalog/pages/content streams/xref/trailer) for any PDF viewer to render it.
// ---------------------------------------------------------------------------------

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_TOP = 800;
const LINE_HEIGHT = 16;
const LINES_PER_PAGE = Math.floor((MARGIN_TOP - 40) / LINE_HEIGHT);

type InvoiceLine = {text: string; size?: number; bold?: boolean; gap?: number};

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// RN's JS engine doesn't polyfill btoa/Buffer, and the PDF we build here is plain
// ASCII (Helvetica/WinAnsi text only), so a small manual base64 encoder is enough.
const base64EncodeAscii = (str: string): string => {
  let out = '';
  for (let i = 0; i < str.length; i += 3) {
    const b1 = str.charCodeAt(i);
    const b2 = str.charCodeAt(i + 1);
    const b3 = str.charCodeAt(i + 2);
    const hasB2 = !Number.isNaN(b2);
    const hasB3 = !Number.isNaN(b3);
    const triplet = (b1 << 16) | ((hasB2 ? b2 : 0) << 8) | (hasB3 ? b3 : 0);
    out += BASE64_CHARS[(triplet >> 18) & 63];
    out += BASE64_CHARS[(triplet >> 12) & 63];
    out += hasB2 ? BASE64_CHARS[(triplet >> 6) & 63] : '=';
    out += hasB3 ? BASE64_CHARS[triplet & 63] : '=';
  }
  return out;
};

const escapePdfText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildContentStream = (lines: InvoiceLine[]): string => {
  let y = MARGIN_TOP;
  let currentFont = '';
  let currentSize = 0;
  const ops: string[] = ['BT'];
  lines.forEach(line => {
    const size = line.size ?? 10;
    const font = line.bold ? 'F2' : 'F1';
    if (font !== currentFont || size !== currentSize) {
      ops.push(`/${font} ${size} Tf`);
      currentFont = font;
      currentSize = size;
    }
    ops.push(`1 0 0 1 ${MARGIN_LEFT} ${y} Tm`);
    ops.push(`(${escapePdfText(line.text)}) Tj`);
    y -= line.gap ?? LINE_HEIGHT;
  });
  ops.push('ET');
  return ops.join('\n');
};

const paginate = (lines: InvoiceLine[]): InvoiceLine[][] => {
  const pages: InvoiceLine[][] = [];
  let page: InvoiceLine[] = [];
  let used = 0;
  lines.forEach(line => {
    const rows = 1 + (line.gap ? Math.max(0, Math.round((line.gap - LINE_HEIGHT) / LINE_HEIGHT)) : 0);
    if (used + rows > LINES_PER_PAGE && page.length) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(line);
    used += rows;
  });
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
};

/** Assembles a valid single/multi-page PDF (base64-encoded) from plain text lines. */
const assemblePdf = (lines: InvoiceLine[]): string => {
  const pages = paginate(lines);
  const n = pages.length;

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font F1 (regular), 4: Font F2 (bold)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = Array.from({length: n}, (_, i) => `${5 + i} 0 R`).join(' ');
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  pages.forEach((pageLines, i) => {
    const pageObjNum = 5 + i;
    const contentObjNum = 5 + n + i;
    objects[pageObjNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>`;
    const stream = buildContentStream(pageLines);
    objects[contentObjNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  const total = 5 + n * 2 - 1; // highest object number in use
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 1; i <= total; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${total + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= total; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return base64EncodeAscii(pdf);
};

// The Helvetica standard font (WinAnsiEncoding) has no Rupee glyph, so the PDF text
// spells out "Rs." rather than "₹" — the on-screen UI is unaffected.
const money = (n: any) => `Rs. ${formatAmount(n)}`;

const pad = (label: string, width = 30) => (label.length >= width ? `${label} ` : label.padEnd(width, ' '));

const two = (n: number) => String(n).padStart(2, '0');
const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

const buildInvoiceLines = (booking: any): InvoiceLine[] => {
  const bookingCode =
    booking.bookingCode ?? String(booking._id ?? booking.id ?? '').slice(-8).toUpperCase();
  const services: any[] = Array.isArray(booking.services)
    ? booking.services.filter((s: any) => !s.removed)
    : [];
  const subtotal =
    booking.baseAmount ?? services.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty || 1), 0);
  const offerDiscount = Number(booking.discountAmount) || 0;
  const couponDiscount = Number(booking.couponDiscountAmount) || 0;
  const taxAmount = Number(booking.taxAmount) || 0;
  const total = booking.totalAmount ?? subtotal;
  const address = [
    booking.addressLine1,
    booking.addressLine2,
    booking.addressCity,
    booking.addressState,
    booking.addressPincode,
  ].filter(Boolean).join(', ');

  const lines: InvoiceLine[] = [];
  lines.push({text: 'BEYOMO', size: 18, bold: true, gap: 24});
  lines.push({text: 'Tax Invoice', size: 12, bold: true, gap: 22});
  lines.push({text: `Booking ID: ${bookingCode}`, size: 10});
  lines.push({text: `Invoice Date: ${formatDate(booking.createdAt ?? new Date().toISOString())}`, size: 10});
  if (booking.scheduledAt) {
    lines.push({text: `Service Date: ${formatDate(booking.scheduledAt)}`, size: 10});
  }
  lines.push({text: address ? `Address: ${address}` : '', size: 10, gap: 22});

  lines.push({text: 'Services', size: 12, bold: true, gap: 20});
  if (services.length) {
    services.forEach((s: any) => {
      const qty = Number(s.qty) || 1;
      const lineTotal = (Number(s.price) || 0) * qty;
      const label = qty > 1 ? `${s.name} (x${qty})` : s.name;
      lines.push({text: pad(label, 46) + money(lineTotal), size: 10});
    });
  } else {
    lines.push({text: 'No services listed', size: 10});
  }
  lines.push({text: '', size: 10, gap: 10});

  lines.push({text: 'Bill Summary', size: 12, bold: true, gap: 20});
  lines.push({text: pad('Subtotal') + money(subtotal), size: 10});
  if (offerDiscount > 0) {
    lines.push({text: pad('Offer Discount') + `- ${money(offerDiscount)}`, size: 10});
  }
  if (couponDiscount > 0) {
    lines.push({
      text: pad(`Coupon Discount${booking.couponCode ? ` (${booking.couponCode})` : ''}`) + `- ${money(couponDiscount)}`,
      size: 10,
    });
  }
  // Platform Fee / Disposable / Travelling Charges are shown as ₹0 to match the
  // checkout Bill Summary (AddressPaymentScreen.tsx) — not implemented as real
  // charges anywhere yet, but listed here for the same full breakdown the customer
  // saw before paying.
  lines.push({text: pad('Platform Fee') + money(0), size: 10});
  lines.push({text: pad('Disposable Charges') + money(0), size: 10});
  lines.push({text: pad('Travelling Charges') + money(0), size: 10});
  lines.push({text: pad('Taxes & GST') + money(taxAmount), size: 10});
  lines.push({text: pad('Total Paid') + money(total), size: 11, bold: true, gap: 22});

  lines.push({
    text: `Payment Method: ${booking.paymentMode === 'cod' ? 'Pay after Service' : 'Paid Online'}`,
    size: 10,
  });
  lines.push({
    text: `Payment Status: ${
      booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMode === 'cod' ? 'Due on completion' : 'Unpaid'
    }`,
    size: 10,
    gap: 26,
  });

  lines.push({text: 'Thank you for choosing Beyomo!', size: 10, bold: true});
  return lines;
};

const sanitizeFileName = (s: string) => s.replace(/[^a-zA-Z0-9-_]/g, '_');

export interface InvoiceDownloadResult {
  success: boolean;
  path?: string;
  message?: string;
}

/** Builds the invoice PDF from existing booking data and saves it to the device. */
export const downloadBookingInvoice = async (booking: any): Promise<InvoiceDownloadResult> => {
  try {
    const bookingCode =
      booking.bookingCode ?? String(booking._id ?? booking.id ?? 'invoice').slice(-8).toUpperCase();
    const fileName = `Beyomo_Invoice_${sanitizeFileName(bookingCode)}.pdf`;
    const base64Pdf = assemblePdf(buildInvoiceLines(booking));

    // Only pre-scoped-storage Android (<10) needs this permission to write to the
    // public Downloads folder; newer versions ignore it either way.
    if (Platform.OS === 'android' && Platform.Version < 29) {
      const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      const status = await check(permission);
      if (status !== RESULTS.GRANTED) {
        const requested = await request(permission);
        if (requested !== RESULTS.GRANTED) {
          return {success: false, message: 'Storage permission is required to download the invoice.'};
        }
      }
    }

    const primaryDir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
    const primaryPath = `${primaryDir}/${fileName}`;
    try {
      await RNFS.writeFile(primaryPath, base64Pdf, 'base64');
      return {success: true, path: primaryPath};
    } catch {
      // The public Downloads folder isn't writable on this device (Android 10+
      // scoped storage) — fall back to the app's own storage, which always works.
      const fallbackDir = Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath;
      const fallbackPath = `${fallbackDir}/${fileName}`;
      await RNFS.writeFile(fallbackPath, base64Pdf, 'base64');
      return {success: true, path: fallbackPath};
    }
  } catch (error: any) {
    return {success: false, message: error?.message ?? 'Failed to generate the invoice. Please try again.'};
  }
};
