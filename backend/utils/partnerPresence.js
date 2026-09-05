/**
 * Partner presence rules.
 *
 * A partner is "online" only when BOTH are true:
 *   1. isOnline  — the partner toggled themselves on in the app, and
 *   2. lastSeenAt is recent — we've heard from them within ONLINE_TIMEOUT_MINUTES.
 *
 * The second condition is what keeps this honest. The app can only send "offline"
 * when it is running: force-quitting it, losing signal, or a flat battery all leave
 * isOnline stuck at true. Without the freshness check the dashboard would show
 * partners as available who haven't been reachable for days, and admins would
 * assign them jobs they never receive.
 *
 * The app re-sends its status on this cadence (see HEARTBEAT_MINUTES) so a partner
 * who stays online keeps lastSeenAt fresh.
 */

// How long after the last heartbeat a partner is still considered online.
const ONLINE_TIMEOUT_MINUTES = 5;

// What the app should use as its heartbeat interval. Deliberately shorter than the
// timeout so a single dropped request doesn't flip a working partner to offline.
const HEARTBEAT_MINUTES = 2;

/**
 * @param {{isOnline?: boolean, lastSeenAt?: Date|string|null}} partner
 * @returns {boolean}
 */
const isPartnerOnline = (partner) => {
  if (!partner || !partner.isOnline || !partner.lastSeenAt) return false;

  const lastSeen = new Date(partner.lastSeenAt).getTime();
  if (Number.isNaN(lastSeen)) return false;

  return Date.now() - lastSeen < ONLINE_TIMEOUT_MINUTES * 60 * 1000;
};

/**
 * Normalises a partner row for API responses: replaces the raw stored isOnline
 * with the freshness-checked value, and keeps the raw flag as isOnlineFlag so
 * callers can still tell "toggled off" apart from "toggled on but gone stale".
 *
 * @param {object} partner - Sequelize instance or plain object
 * @returns {object} plain object
 */
const withPresence = (partner) => {
  if (!partner) return partner;
  const plain = typeof partner.toJSON === "function" ? partner.toJSON() : { ...partner };

  return {
    ...plain,
    isOnlineFlag: Boolean(plain.isOnline),
    isOnline: isPartnerOnline(plain),
  };
};

module.exports = { ONLINE_TIMEOUT_MINUTES, HEARTBEAT_MINUTES, isPartnerOnline, withPresence };
