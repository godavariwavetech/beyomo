const jwt = require("jsonwebtoken");
const { TOKEN_SECRET, JWT_EXPIRES_IN, ADMIN_JWT_EXPIRES_IN } = require("../config");

/**
 * Sign a JWT token with the given payload
 * @param {Object} payload - { userId, userType, role }
 * @param {String} expiresIn - optional override
 * @returns {String} signed JWT token
 */
const signToken = (payload, expiresIn = null) => {
  const expiry =
    expiresIn ||
    (payload.userType === "admin" ? ADMIN_JWT_EXPIRES_IN : JWT_EXPIRES_IN);
  return jwt.sign(payload, TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: expiry,
  });
};

/**
 * Decode and verify a JWT token
 * @param {String} token
 * @returns {Object} decoded payload
 */
const decodeToken = (token) => {
  return jwt.verify(token, TOKEN_SECRET, { algorithms: ["HS256"] });
};

/**
 * Decode without verifying (for inspection only)
 * @param {String} token
 * @returns {Object|null} decoded payload or null
 */
const decodeTokenUnsafe = (token) => {
  return jwt.decode(token);
};

module.exports = { signToken, decodeToken, decodeTokenUnsafe };
