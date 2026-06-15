const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;
const SSL_KEY = process.env.SSL_KEY_PATH ? path.resolve(__dirname, process.env.SSL_KEY_PATH) : null;
const SSL_CERT = process.env.SSL_CERT_PATH ? path.resolve(__dirname, process.env.SSL_CERT_PATH) : null;
const SSL_CA = process.env.SSL_CA_PATH ? path.resolve(__dirname, process.env.SSL_CA_PATH) : null;

let server;

if (SSL_KEY && SSL_CERT && fs.existsSync(SSL_KEY) && fs.existsSync(SSL_CERT)) {
  const sslOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
    ...(SSL_CA && fs.existsSync(SSL_CA) && { ca: fs.readFileSync(SSL_CA) }),
  };

  server = https.createServer(sslOptions, app);

  // Redirect HTTP → HTTPS
  const httpRedirect = http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  });
  const HTTP_PORT = process.env.HTTP_PORT || 80;
  httpRedirect.listen(HTTP_PORT, () => {
    logger.info(`HTTP → HTTPS redirect active on port ${HTTP_PORT}`);
  });

  server.listen(PORT, () => {
    logger.info(`Beyomo API server running on port ${PORT} (HTTPS) in ${process.env.NODE_ENV || "development"} mode`);
    logger.info(`Health check: https://localhost:${PORT}/`);
    logger.info(`API base: https://localhost:${PORT}/api/v1`);
  });
} else {
  server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`Beyomo API server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    logger.info(`Health check: http://localhost:${PORT}/`);
    logger.info(`API base: http://localhost:${PORT}/api/v1`);
  });
}

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
