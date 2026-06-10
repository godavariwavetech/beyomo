const { decodeToken } = require("./jwtUtils");
const AppError = require("./errorHandlers/appError");
const logger = require("./logger");

/**
 * User authentication middleware
 * Verifies Bearer token and checks userType === 'user'
 * Attaches decoded payload to req.user
 */
const authenticate = (req, res, next) => {
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

    if (decoded.userType !== "user") {
      return next(new AppError("Access denied. User token required.", 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Your session has expired. Please login again.", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid authentication token.", 401));
    }
    return next(new AppError("Authentication failed.", 401));
  }
};

module.exports = authenticate;
