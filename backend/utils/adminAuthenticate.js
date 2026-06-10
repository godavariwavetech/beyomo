const { decodeToken } = require("./jwtUtils");
const AppError = require("./errorHandlers/appError");
const logger = require("./logger");

/**
 * Admin authentication middleware factory
 * @param {Array} allowedRoles - optional array of roles e.g. ['super_admin', 'admin']
 * @returns Express middleware
 *
 * Usage:
 *   router.get('/route', adminAuthenticate(), handler)
 *   router.get('/route', adminAuthenticate(['super_admin']), handler)
 */
const adminAuthenticate = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Authentication token is required", 401));
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return next(new AppError("Authentication token is required", 401));
      }

      const decoded = decodeToken(token);

      if (decoded.userType !== "admin") {
        return next(new AppError("Access denied. Admin token required.", 403));
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return next(
          new AppError(
            `Access denied. Required role: ${allowedRoles.join(" or ")}`,
            403
          )
        );
      }

      req.admin = decoded;
      next();
    } catch (error) {
      logger.error(`Admin authentication error: ${error.message}`);
      if (error.name === "TokenExpiredError") {
        return next(new AppError("Your session has expired. Please login again.", 401));
      }
      if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid authentication token.", 401));
      }
      return next(new AppError("Authentication failed.", 401));
    }
  };
};

module.exports = adminAuthenticate;
