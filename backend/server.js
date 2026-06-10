const http = require("http");
require("dotenv").config();

const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Beyomo API server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  logger.info(`Health check: http://localhost:${PORT}/`);
  logger.info(`API base: http://localhost:${PORT}/api/v1`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Graceful shutdown on SIGTERM (e.g., Docker stop)
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});

module.exports = server;
