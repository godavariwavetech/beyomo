class AppError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.msg = message;
    this.statusCode = statusCode;
    this.status = false;
    this.isOperational = true;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
