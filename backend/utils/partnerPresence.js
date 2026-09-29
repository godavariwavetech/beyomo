/**
 * Partner presence rules.
 *
 * A partner is "online" purely based on their own toggle: isOnline. There is
 * deliberately no freshness/heartbeat expiry on top of it — product decision is that
 * once a partner switches on, they stay online (and eligible for jobs) no matter how
 * long the app stays closed, until they explicitly switch off. lastSeenAt is kept
 * (stamped on every heartbeat/toggle call) purely as "last seen" information, e.g.
 * for the admin panel — it no longer gates whether a partner counts as online.
 *
 * ONLINE_TIMEOUT_MINUTES is unused by isPartnerOnline for that reason, and is kept
 * only in case a future feature (e.g. an admin-facing staleness warning) wants it.
 */

// Unused by isPartnerOnline (see above) — no longer expires a partner's online status.
const ONLINE_TIMEOUT_MINUTES = 5;

// What the app uses as its heartbeat interval, so lastSeenAt ("last seen") info stays fresh.
const HEARTBEAT_MINUTES = 2;

/**
 * @param {{isOnline?: boolean, lastSeenAt?: Date|string|null}} partner
 * @returns {boolean}
 */
const isPartnerOnline = (partner) => Boolean(partner && partner.isOnline);

/**
 * Normalises a partner row for API responses: runs the raw stored isOnline through
 * isPartnerOnline (now a passthrough, kept for a single source of truth), and keeps
 * the raw flag as isOnlineFlag too so callers have both names available.
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
