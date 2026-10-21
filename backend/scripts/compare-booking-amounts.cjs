// Read-only diagnostic: no migrations, updates, notifications, or wallet changes.
// Run against the database containing the bookings:
//   node scripts/compare-booking-amounts.cjs NLR2600096 RJY2600061
require('dotenv').config();
const {sequelize} = require('../utils/dbconnect');
require('../utils/models');
const Booking = require('../api/bookings/models/booking.model');
const Ledger = require('../api/settlements/models/partnerLedgerEntry.model');
const {recomputeBookingAmounts} = require('../api/bookings/services/v1/bookings.service');

const parse = value => typeof value === 'string' ? JSON.parse(value) : value;

async function main() {
  const codes = process.argv.slice(2);
  if (codes.length === 0) codes.push('NLR2600096', 'RJY2600061');
  try {
    for (const bookingCode of codes) {
      const booking = await Booking.findOne({where: {bookingCode}});
      if (!booking) {
        console.log(JSON.stringify({bookingCode, found: false}));
        continue;
      }
      const services = parse(booking.services) || [];
      const ledgers = await Ledger.findAll({where: {bookingId: booking.id}, raw: true});
      console.log(JSON.stringify({
        bookingCode,
        cityId: booking.cityId,
        status: booking.status,
        packageId: booking.packageId,
        packageQty: booking.packageQty,
        packages: parse(booking.packages),
        stored: Object.fromEntries(['baseAmount', 'discountAmount', 'couponDiscountAmount',
          'taxAmount', 'totalAmount', 'partnerEarning'].map(key => [key, booking[key]])),
        recomputed: await recomputeBookingAmounts(booking, services),
        services: services.map(s => ({serviceId: s.serviceId, name: s.name, price: s.price,
          qty: s.qty, removed: !!s.removed, packageId: s.packageId,
          addedByPackage: s.addedByPackage, assignedPartnerId: s.assignedPartnerId})),
        ledger: ledgers.map(e => ({id: e.id, partnerId: e.partnerId, status: e.status,
          grossShare: e.grossShare, commissionPercent: e.commissionPercent,
          adminCommissionAmount: e.adminCommissionAmount, partnerNetAmount: e.partnerNetAmount})),
      }, null, 2));
    }
  } finally {
    await sequelize.close();
  }
}

main().catch(error => {console.error(error.message); process.exitCode = 1;});
