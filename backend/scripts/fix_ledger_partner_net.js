/**
 * Repairs UNSETTLED partner ledger entries whose partnerNetAmount disagrees with the
 * booking's own partnerEarning.
 *
 * Entries written before the computePartnerShare fix derived the split from raw catalog
 * prices and per-service CATEGORY adminPercent, which is blind to packages: a package's
 * fixed price is not the sum of its services' list prices, and a package carries its own
 * adminPercent. So on any booking containing a package or combo the ledger disagreed
 * with the "Your Earnings" figure the partner app shows.
 *
 * Only `unsettled` entries are touched — a settled entry represents money that has
 * already moved, and rewriting it would desync the ledger from what was actually paid.
 * Partner walletBalance / totalEarnings are adjusted by the delta so the running
 * balances stay consistent with the corrected entries.
 *
 * Dry run (default):  node scripts/fix_ledger_partner_net.js
 * Apply changes:      node scripts/fix_ledger_partner_net.js --apply
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { connectDB, sequelize } = require("../utils/dbconnect");

const APPLY = process.argv.includes("--apply");

const parseServices = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

async function run() {
  await connectDB();

  const PartnerLedgerEntry = require("../api/settlements/models/partnerLedgerEntry.model");
  const Partner = require("../api/partners/models/partner.model");
  const Booking = require("../api/bookings/models/booking.model");
  const { computePartnerShare } = require("../api/settlements/services/v1/settlements.service");

  const entries = await PartnerLedgerEntry.findAll({ where: { status: "unsettled" }, order: [["id", "ASC"]] });
  console.log(`${entries.length} unsettled ledger entries to check${APPLY ? "" : "  (DRY RUN — pass --apply to write)"}\n`);

  let changed = 0;

  for (const entry of entries) {
    const booking = await Booking.findByPk(entry.bookingId);
    if (!booking) {
      console.log(`  entry ${entry.id}: booking ${entry.bookingId} missing — skipped`);
      continue;
    }

    // Mirrors how createLedgerEntryForCompletion was called: this partner's claimed
    // services, or every active service when nothing was individually stamped (the
    // ordinary single-partner booking).
    const active = parseServices(booking.services).filter(s => !s.removed);
    const mine = active.filter(s => String(s.assignedPartnerId) === String(entry.partnerId));
    const items = mine.length > 0 ? mine : active;
    if (items.length === 0) {
      console.log(`  entry ${entry.id}: no active services — skipped`);
      continue;
    }

    const fresh = await computePartnerShare(booking, items);
    const oldNet = parseFloat(entry.partnerNetAmount);
    const oldAmount = parseFloat(entry.amount);
    const newAmount = entry.direction === "credit" ? fresh.partnerNetAmount : fresh.adminCommissionAmount;

    if (Math.abs(fresh.partnerNetAmount - oldNet) < 0.005 && Math.abs(newAmount - oldAmount) < 0.005) continue;

    changed++;
    console.log(
      `  ${booking.bookingCode} (entry ${entry.id}, partner ${entry.partnerId}):\n` +
      `      partnerNet  ${oldNet.toFixed(2)} -> ${fresh.partnerNetAmount.toFixed(2)}   (booking.partnerEarning = ${parseFloat(booking.partnerEarning).toFixed(2)})\n` +
      `      commission  ${parseFloat(entry.adminCommissionAmount).toFixed(2)} -> ${fresh.adminCommissionAmount.toFixed(2)}\n` +
      `      amount      ${oldAmount.toFixed(2)} -> ${newAmount.toFixed(2)}  (${entry.direction})`
    );

    if (!APPLY) continue;

    // A credit put `amount` INTO the wallet, a debit took it out — so the correction
    // has to follow the same sign the original increment used.
    const walletDelta = entry.direction === "credit" ? newAmount - oldAmount : -(newAmount - oldAmount);
    const earningsDelta = fresh.partnerNetAmount - oldNet;

    await sequelize.transaction(async (t) => {
      await entry.update({
        grossShare: fresh.grossShare,
        commissionPercent: fresh.commissionPercent,
        adminCommissionAmount: fresh.adminCommissionAmount,
        partnerNetAmount: fresh.partnerNetAmount,
        amount: newAmount,
      }, { transaction: t });

      if (walletDelta !== 0 || earningsDelta !== 0) {
        await Partner.increment(
          { walletBalance: walletDelta, totalEarnings: earningsDelta },
          { where: { id: entry.partnerId }, transaction: t }
        );
      }
    });
  }

  console.log(`\n${changed} entr${changed === 1 ? "y" : "ies"} ${APPLY ? "corrected" : "would change"}.`);
  await sequelize.close();
  process.exit(0);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
