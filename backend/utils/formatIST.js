const moment = require("moment");

// Fixed +05:30 offset rather than an IANA zone name — works with plain `moment`
// (no moment-timezone/tz-database dependency) and is correct everywhere the app
// operates (Nellore, Ongole, Rajahmundry — all India), regardless of the server's
// own OS timezone.
const IST_OFFSET_MINUTES = 330;

// e.g. "24 Sep, 1:56 PM" — used in notification text so a partner can see when a
// job is scheduled without having to open the app.
const formatISTDateTime = (date) => moment(date).utcOffset(IST_OFFSET_MINUTES).format("D MMM, h:mm A");

module.exports = { formatISTDateTime };
