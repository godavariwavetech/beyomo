const winston = require("winston");
const { createLogger, transports, format } = require("winston");
const fs = require("fs");
const path = require("path");
const httpContext = require("express-http-context");
const cron = require("node-cron");
const { LOGS_PATH } = require("../config");

// Ensure logs directory exists
const logsDir = path.resolve(LOGS_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilename = path.join(logsDir, "beyomo.log");
const logFilePattern = /^beyomo\.log\.\d{4}-\d{2}-\d{2}$/;

const formatMessage = function (message) {
  const reqId = httpContext.get("reqId");
  if (reqId) {
    if (typeof message === "string") {
      message = `[${reqId}] ${message}`;
    } else {
      message = `[${reqId}] ${JSON.stringify(message)}`;
    }
  } else if (typeof message !== "string") {
    message = JSON.stringify(message);
  }
  return message;
};

const winstonTransports = [
  new transports.File({
    filename: logFilename,
    format: format.combine(format.timestamp(), format.simple()),
  }),
];

// Also log to console in development
if (process.env.NODE_ENV !== "production") {
  winstonTransports.push(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
      ),
    })
  );
}

const winstonLogger = createLogger({
  level: "info",
  transports: winstonTransports,
});

const logger = {
  log: function (level, message) {
    winstonLogger.log(level, formatMessage(message));
  },
  error: function (message) {
    winstonLogger.error(formatMessage(message));
  },
  warn: function (message) {
    winstonLogger.warn(formatMessage(message));
  },
  verbose: function (message) {
    winstonLogger.verbose(formatMessage(message));
  },
  info: function (message) {
    winstonLogger.info(formatMessage(message));
  },
  debug: function (message) {
    winstonLogger.debug(formatMessage(message));
  },
  silly: function (message) {
    winstonLogger.silly(formatMessage(message));
  },
  rotateLogsAndCleanup: function () {
    performLogRotation();
    cleanupLogFiles();
  },
};

function performLogRotation() {
  try {
    if (!fs.existsSync(logFilename)) return;
    const currentDate = new Date().toISOString().slice(0, 10);
    const rotatedFilename = `${logFilename}.${currentDate}`;
    fs.copyFileSync(logFilename, rotatedFilename);
    fs.writeFileSync(logFilename, "");
    logger.info(`Log rotated to ${rotatedFilename}`);
  } catch (e) {
    console.error("Log rotation error:", e);
  }
}

function cleanupLogFiles() {
  try {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7); // Keep 7 days
    const cutoffDate = currentDate.toISOString().slice(0, 10);

    const logFiles = fs.readdirSync(logsDir).filter((file) => logFilePattern.test(file));

    logFiles.forEach((file) => {
      try {
        const logFileDate = file.split(".")[2];
        if (logFileDate && logFileDate <= cutoffDate) {
          fs.unlinkSync(path.join(logsDir, file));
          logger.info(`Deleted old log file: ${file}`);
        }
      } catch (e) {
        console.error("Log cleanup error for file:", file, e);
      }
    });
  } catch (e) {
    console.error("Log cleanup error:", e);
  }
}

// Schedule daily log rotation at midnight
cron.schedule("0 0 * * *", function () {
  logger.rotateLogsAndCleanup();
});

module.exports = logger;
