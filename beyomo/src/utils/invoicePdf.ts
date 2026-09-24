import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import {PERMISSIONS, RESULTS, check, request} from 'react-native-permissions';
import {formatAmount} from './utils';

// ---------------------------------------------------------------------------------
// No PDF library is installed in this app (only react-native-fs / rn-fetch-blob /
// react-native-share, none of which generate a PDF from data). Rather than pull in a
// new native dependency just for this, a booking invoice is assembled by hand as a
// minimal valid PDF (Helvetica text + filled rectangles on A4 pages) — just enough
// PDF structure (catalog/pages/content streams/xref/trailer) for any PDF viewer to
// render it, styled with the app's own brand colors.
// ---------------------------------------------------------------------------------

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 16;

// Brand colors (matches the app's primary green + gold accent used across
// OTP/Login/buttons) rather than the black/gray of a generic invoice template.
const BRAND_DARK: RGB = [0.063, 0.337, 0.255]; // #105641
const BRAND_GOLD: RGB = [0.894, 0.729, 0.404]; // #E4BA69
const BRAND_LIGHT: RGB = [0.918, 0.961, 0.941]; // #EAF5F0
const TEXT_DARK: RGB = [0.09, 0.09, 0.08]; // #171816
const TEXT_MUTED: RGB = [0.42, 0.42, 0.4];
const WHITE: RGB = [1, 1, 1];

const HEADER_BAND_H = 92;
const FOOTER_BAND_H = 26;
const CONTENT_TOP = PAGE_HEIGHT - HEADER_BAND_H - 34;
const CONTENT_BOTTOM = FOOTER_BAND_H + 36;
const LINES_PER_PAGE = Math.floor((CONTENT_TOP - CONTENT_BOTTOM) / LINE_HEIGHT);

type RGB = [number, number, number];

type InvoiceLine = {
  text: string;
  size?: number;
  bold?: boolean;
  gap?: number; // vertical cursor advance after this line — 0 for a non-last column in a row
  x?: number; // absolute x override — used for table columns
  color?: RGB;
  rowBg?: RGB; // if set, paints a full-width band behind this row (table header/total rows)
  rowH?: number; // background band height — needed when this line's own `gap` is 0 (a
  // multi-column row's non-last column), since `gap` alone can't describe the row's
  // visual height in that case
  borderBottom?: RGB; // thin horizontal rule drawn at this row's bottom edge — put on
  // the row's last column (the one carrying the real `gap`), so the rule lands exactly
  // at the row boundary rather than mid-row
  borderBottomWidth?: number; // rule thickness in points — defaults to a hairline
};

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

const rgOp = (c: RGB) => `${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} rg`;

// Fixed header (logo + "TAX INVOICE" + booking code) and footer (thin brand-color
// strip) drawn identically on every page, independent of the auto-flowing body below.
const buildHeaderFooterOps = (bookingCode: string): string => {
  const bandBottom = PAGE_HEIGHT - HEADER_BAND_H;
  const ops: string[] = [];

  ops.push(rgOp(BRAND_DARK));
  ops.push(`0 ${bandBottom} ${PAGE_WIDTH} ${HEADER_BAND_H} re`);
  ops.push('f');
  ops.push(rgOp(BRAND_GOLD));
  ops.push(`0 ${bandBottom - 3} ${PAGE_WIDTH} 3 re`);
  ops.push('f');

  ops.push('BT');
  ops.push('/F2 24 Tf');
  ops.push(rgOp(WHITE));
  ops.push(`1 0 0 1 ${MARGIN_LEFT} ${bandBottom + 52} Tm`);
  ops.push('(BEYOMO) Tj');
  ops.push('ET');

  ops.push('BT');
  ops.push('/F1 9 Tf');
  ops.push(rgOp(BRAND_LIGHT));
  ops.push(`1 0 0 1 ${MARGIN_LEFT} ${bandBottom + 34} Tm`);
  ops.push('(Salon Comes Home) Tj');
  ops.push('ET');

  const rightX = PAGE_WIDTH - MARGIN_RIGHT - 160;
  ops.push('BT');
  ops.push('/F2 14 Tf');
  ops.push(rgOp(WHITE));
  ops.push(`1 0 0 1 ${rightX} ${bandBottom + 52} Tm`);
  ops.push('(TAX INVOICE) Tj');
  ops.push('ET');
  ops.push('BT');
  ops.push('/F1 9 Tf');
  ops.push(rgOp(BRAND_LIGHT));
  ops.push(`1 0 0 1 ${rightX} ${bandBottom + 34} Tm`);
  ops.push(`(Booking ID: ${escapePdfText(bookingCode)}) Tj`);
  ops.push('ET');

  ops.push(rgOp(BRAND_DARK));
  ops.push(`0 0 ${PAGE_WIDTH} ${FOOTER_BAND_H} re`);
  ops.push('f');
  ops.push('BT');
  ops.push('/F1 8 Tf');
  ops.push(rgOp(BRAND_LIGHT));
  ops.push(`1 0 0 1 ${MARGIN_LEFT} 10 Tm`);
  ops.push('(Thank you for choosing Beyomo - Salon Comes Home) Tj');
  ops.push('ET');

  return ops.join('\n');
};

const buildBodyOps = (lines: InvoiceLine[]): string => {
  let y = CONTENT_TOP;
  const ops: string[] = [];
  lines.forEach(line => {
    const size = line.size ?? 10;
    const rowH = line.gap ?? LINE_HEIGHT;
    if (line.rowBg) {
      // rowH alone can't be used here: a multi-column row's first (non-last) column
      // carries gap:0 so the cursor doesn't advance until the row's last column, which
      // would otherwise collapse the background band to zero height.
      const bgH = line.rowH ?? rowH;
      // Center the band on the text's visual vertical center, not its baseline (`y`).
      // Helvetica's ink sits mostly above the baseline, so the visual middle of a line
      // of text is roughly 0.3×size above it, not at it — using `y` directly as the
      // center made every colored row band sit visibly too low under its text.
      const textCenter = y + size * 0.3;
      ops.push(rgOp(line.rowBg));
      ops.push(`${MARGIN_LEFT - 6} ${textCenter - bgH / 2} ${CONTENT_WIDTH + 12} ${bgH} re`);
      ops.push('f');
    }
    if (line.text) {
      ops.push('BT');
      ops.push(`/${line.bold ? 'F2' : 'F1'} ${size} Tf`);
      ops.push(rgOp(line.color ?? TEXT_DARK));
      ops.push(`1 0 0 1 ${line.x ?? MARGIN_LEFT} ${y} Tm`);
      ops.push(`(${escapePdfText(line.text)}) Tj`);
      ops.push('ET');
    }
    if (line.borderBottom) {
      // Drawn at this row's bottom edge (y - rowH, before the cursor advances below),
      // so it reads as a divider between this row and the next rather than mid-text.
      // `y - rowH` is the *next* row's baseline, not the gap between the two — text
      // sits mostly above its baseline (see the rowBg centering note above), so a rule
      // drawn right at that y cut straight through the next row's text. Centering it
      // in the gap between this row's visual bottom and the next row's visual top
      // keeps it clear of both.
      const ruleH = line.borderBottomWidth ?? 0.75;
      const ruleY = y - rowH / 2 + size * 0.3;
      ops.push(rgOp(line.borderBottom));
      ops.push(`${MARGIN_LEFT - 6} ${ruleY} ${CONTENT_WIDTH + 12} ${ruleH} re`);
      ops.push('f');
    }
    y -= rowH;
  });
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
const assemblePdf = (lines: InvoiceLine[], bookingCode: string): string => {
  const pages = paginate(lines);
  const n = pages.length;

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font F1 (regular), 4: Font F2 (bold)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = Array.from({length: n}, (_, i) => `${5 + i} 0 R`).join(' ');
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const headerFooter = buildHeaderFooterOps(bookingCode);

  pages.forEach((pageLines, i) => {
    const pageObjNum = 5 + i;
    const contentObjNum = 5 + n + i;
    objects[pageObjNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>`;
    const stream = `${headerFooter}\n${buildBodyOps(pageLines)}`;
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

const two = (n: number) => String(n).padStart(2, '0');
const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

// Table column x-positions, left-aligned within each column (no font-metrics table
// available to right-align precisely without a new dependency).
const COL_ITEM = MARGIN_LEFT;
const COL_QTY = MARGIN_LEFT + 300;
const COL_PRICE = MARGIN_LEFT + 350;
const COL_AMOUNT = MARGIN_LEFT + 430;

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const buildInvoiceLines = (booking: any): InvoiceLine[] => {
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

  // Meta row: invoice date (left) / service date (right-ish, fixed column)
  lines.push({text: `Invoice Date: ${formatDate(booking.createdAt ?? new Date().toISOString())}`, size: 9, color: TEXT_MUTED});
  if (booking.scheduledAt) {
    lines.push({text: `Service Date: ${formatDate(booking.scheduledAt)}`, size: 9, color: TEXT_MUTED, gap: 22});
  } else {
    lines.push({text: '', size: 9, gap: 6});
  }

  // Billed To
  lines.push({text: 'Billed To', size: 10, bold: true, color: BRAND_DARK});
  lines.push({text: booking.userName ?? booking.user?.name ?? 'Customer', size: 10});
  if (address) {
    // Wrap long addresses onto a couple of lines rather than running off the page.
    const words = address.split(' ');
    let row = '';
    const rows: string[] = [];
    words.forEach(w => {
      if ((row + ' ' + w).trim().length > 70) {
        rows.push(row.trim());
        row = w;
      } else {
        row = `${row} ${w}`.trim();
      }
    });
    if (row) rows.push(row);
    rows.slice(0, 2).forEach(r => lines.push({text: r, size: 9, color: TEXT_MUTED}));
  }
  lines.push({text: '', size: 9, gap: 20});

  // Table header — 4 columns sharing one row. Each of the first 3 columns carries
  // gap:0 so the cursor doesn't advance until the last (Amount) column; the
  // background band's height is given explicitly via rowH since it can't be read
  // off those zero-gap columns.
  const HEADER_ROW_H = 24;
  lines.push({text: 'Item', x: COL_ITEM, size: 10, bold: true, color: BRAND_DARK, rowBg: BRAND_LIGHT, rowH: HEADER_ROW_H, gap: 0});
  lines.push({text: 'Qty', x: COL_QTY, size: 10, bold: true, color: BRAND_DARK, gap: 0});
  lines.push({text: 'Price', x: COL_PRICE, size: 10, bold: true, color: BRAND_DARK, gap: 0});
  lines.push({text: 'Amount', x: COL_AMOUNT, size: 10, bold: true, color: BRAND_DARK, gap: HEADER_ROW_H});

  // A light hairline under each row (separate from the alternating shading) makes
  // individual services easy to tell apart at a glance, especially once there are
  // more than two or three of them.
  const ROW_DIVIDER: RGB = [0.87, 0.87, 0.85];
  if (services.length) {
    const ROW_H = 20;
    services.forEach((s: any, idx: number) => {
      const qty = Number(s.qty) || 1;
      const price = Number(s.price) || 0;
      const rowBg: RGB | undefined = idx % 2 === 1 ? [0.976, 0.976, 0.973] : undefined;
      // Skip the hairline on the last row — the bold green rule right after it
      // (closing off the table before the bill summary) already marks that edge, so
      // a hairline there too was just a second, redundant line sitting on top of it.
      const isLast = idx === services.length - 1;
      lines.push({text: truncate(String(s.name ?? 'Service'), 42), x: COL_ITEM, size: 9.5, rowBg, rowH: ROW_H, gap: 0});
      lines.push({text: String(qty), x: COL_QTY, size: 9.5, gap: 0});
      lines.push({text: money(price), x: COL_PRICE, size: 9.5, gap: 0});
      lines.push({text: money(price * qty), x: COL_AMOUNT, size: 9.5, borderBottom: isLast ? undefined : ROW_DIVIDER, gap: ROW_H});
    });
  } else {
    lines.push({text: 'No services listed', size: 9.5, gap: 20});
  }

  // A stronger rule (brand color, thicker than the per-row hairlines above) closes
  // off the itemized table before the bill summary starts, so the two sections read
  // as visually distinct blocks rather than running into each other.
  lines.push({
    text: '', size: 4, borderBottom: BRAND_DARK, borderBottomWidth: 1.25, gap: 14,
  });

  // Bill summary — right-hand block, label/value as two columns
  const summaryRow = (label: string, value: string, opts?: Partial<InvoiceLine>) => {
    lines.push({text: label, x: COL_PRICE - 40, size: 9.5, ...opts, gap: 0});
    lines.push({text: value, x: COL_AMOUNT, size: 9.5, ...opts, gap: 17});
  };
  summaryRow('Subtotal', money(subtotal));
  if (offerDiscount > 0) summaryRow('Offer Discount', `- ${money(offerDiscount)}`);
  if (couponDiscount > 0) {
    summaryRow(`Coupon${booking.couponCode ? ` (${booking.couponCode})` : ''}`, `- ${money(couponDiscount)}`);
  }
  summaryRow('Taxes & GST', money(taxAmount));

  lines.push({text: '', size: 9, gap: 6});
  lines.push({
    text: 'Total Paid', x: COL_PRICE - 40, size: 12, bold: true, color: BRAND_DARK,
    rowBg: BRAND_LIGHT, rowH: 26, gap: 0,
  });
  lines.push({text: money(total), x: COL_AMOUNT, size: 12, bold: true, color: BRAND_DARK, gap: 30});

  lines.push({
    text: `Payment Method: ${booking.paymentMode === 'cod' ? 'Pay after Service' : 'Paid Online'}`,
    size: 9.5,
  });
  lines.push({
    text: `Payment Status: ${
      booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMode === 'cod' ? 'Due on completion' : 'Unpaid'
    }`,
    size: 9.5,
    gap: 22,
  });
  lines.push({text: 'Note: This is a system-generated invoice.', size: 8.5, color: TEXT_MUTED});

  return lines;
};

const sanitizeFileName = (s: string) => s.replace(/[^a-zA-Z0-9-_]/g, '_');

export interface InvoiceDownloadResult {
  success: boolean;
  path?: string;
  message?: string;
}

/**
 * Builds the invoice PDF from existing booking data and saves it straight to the
 * public Downloads folder, then registers it with Android's DownloadManager
 * (`addCompleteDownload`) so it actually shows up in the Files/Downloads app and
 * gets a normal "download complete" system notification — a plain `RNFS.writeFile`
 * into that folder used to silently "succeed" on some Android versions/OEMs without
 * the file ever being visible anywhere, because the write itself doesn't index it
 * into MediaStore; `addCompleteDownload` is what actually does that.
 *
 * If that direct write fails for any reason (a handful of locked-down OEM ROMs),
 * falls back to the app's own always-writable cache + the native share sheet, so the
 * customer can still get the file out one way or another rather than a hard failure.
 */
export const downloadBookingInvoice = async (booking: any): Promise<InvoiceDownloadResult> => {
  const bookingCode =
    booking.bookingCode ?? String(booking._id ?? booking.id ?? 'invoice').slice(-8).toUpperCase();
  const fileName = `Beyomo_Invoice_${sanitizeFileName(bookingCode)}.pdf`;
  let base64Pdf: string;
  try {
    base64Pdf = assemblePdf(buildInvoiceLines(booking), bookingCode);
  } catch (error: any) {
    return {success: false, message: error?.message ?? 'Failed to generate the invoice. Please try again.'};
  }

  if (Platform.OS === 'android') {
    try {
      // Only pre-scoped-storage Android (<10) needs this permission to write to the
      // public Downloads folder; newer versions ignore it either way.
      if (Platform.Version < 29) {
        const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
        const status = await check(permission);
        if (status !== RESULTS.GRANTED) {
          const requested = await request(permission);
          if (requested !== RESULTS.GRANTED) {
            throw new Error('Storage permission is required to download the invoice.');
          }
        }
      }

      const path = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
      await RNFetchBlob.fs.writeFile(path, base64Pdf, 'base64');
      await RNFetchBlob.android.addCompleteDownload({
        title: fileName,
        description: 'Beyomo invoice',
        mime: 'application/pdf',
        path,
        showNotification: true,
      });
      return {success: true, path};
    } catch {
      // Fall through to the cache + share-sheet fallback below.
    }
  }

  try {
    const dir = Platform.OS === 'android' ? RNFS.CachesDirectoryPath : RNFS.DocumentDirectoryPath;
    const path = `${dir}/${fileName}`;
    await RNFS.writeFile(path, base64Pdf, 'base64');
    if (Platform.OS === 'android') {
      await Share.open({url: `file://${path}`, type: 'application/pdf', filename: fileName, failOnCancel: false});
    }
    return {success: true, path};
  } catch (error: any) {
    return {success: false, message: error?.message ?? 'Failed to save the invoice. Please try again.'};
  }
};

/** Opens a saved invoice PDF in the device's default PDF viewer. */
export const openInvoiceFile = async (path: string): Promise<void> => {
  if (Platform.OS === 'android') {
    await RNFetchBlob.android.actionViewIntent(path, 'application/pdf');
  } else {
    await Share.open({url: `file://${path}`, type: 'application/pdf', failOnCancel: false});
  }
};
