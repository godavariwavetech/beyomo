const { decodeToken } = require("./jwtUtils");
const AppError = require("./errorHandlers/appError");
const logger = require("./logger");

/**
 * User authentication middleware
 * Verifies Bearer token and checks userType === 'user'
 * Attaches decoded payload to req.user
 */
// TEMPORARY (per explicit request): token validation disabled for the user app.
// If a valid Bearer token is present it's still used normally; otherwise requests
// fall back to this fixed identity instead of being rejected. Revert by restoring
// the commented-out checks below.
const FALLBACK_USER = { userId: 1, userType: "user", role: "user" };

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // return next(new AppError("Authentication token is required", 401));
      req.user = FALLBACK_USER;
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      // return next(new AppError("Authentication token is required", 401));
      req.user = FALLBACK_USER;
      return next();
    }

    const decoded = decodeToken(token);

    if (decoded.userType !== "user") {
      return next(new AppError("Access denied. User token required.", 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    // Validation disabled — fall back instead of rejecting on expired/invalid tokens too.
    req.user = FALLBACK_USER;
    next();
  }
};

module.exports = authenticate;
