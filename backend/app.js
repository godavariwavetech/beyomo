require("dotenv").config();

const express = require("express");
const app = express();
const os = require("os");
const url = require("url");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
const httpContext = require("express-http-context");
const { v1: uuidv1 } = require("uuid");
const promClient = require("prom-client");

const globalErrorHandler = require("./utils/errorHandlers/errorController");
const AppError = require("./utils/errorHandlers/appError");
const logger = require("./utils/logger");
const { connectDB, getDBStatus } = require("./utils/dbconnect");
const beyomoApiRoutes = require("./api");

// ----- DB Connection -----
(async function initDB() {
  try {
    await connectDB();
  } catch (e) {
    logger.error(`Database connection failed: ${e.message}`);
  }
})();

// ----- HTTP Context (for request ID tracking) -----
app.use(httpContext.middleware);

// ----- Security -----
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ----- Compression -----
app.use(compression());

// ----- CORS -----
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Access-Token"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// ----- Body Parsers -----
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false, limit: "5mb" }));
// Capture the raw body alongside the parsed one — needed to verify the Razorpay
// webhook's HMAC signature, which is computed over the exact bytes Razorpay sent
// (re-serializing req.body could reorder/reformat and break the signature match).
app.use(bodyParser.json({ limit: "5mb", verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ----- Prometheus Metrics -----
const promRegistry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: promRegistry });

const apiRequestCounter = new promClient.Counter({
  name: "beyomo_api_total_requests",
  help: "Total number of API requests received",
  labelNames: ["method", "endpoint"],
  registers: [promRegistry],
});

const responseTimeHistogram = new promClient.Histogram({
  name: "beyomo_api_response_time_seconds",
  help: "API response time in seconds",
  labelNames: ["method", "endpoint"],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
  registers: [promRegistry],
});

const responseStatusCounter = new promClient.Counter({
  name: "beyomo_api_response_status_count",
  help: "Count of API responses by status code",
  labelNames: ["status_code", "method", "endpoint"],
  registers: [promRegistry],
});

// ----- Request Logging & Tracking -----
app.use(function (req, res, next) {
  const endpoint = url.parse(req.originalUrl).pathname;

  apiRequestCounter.labels(req.method, endpoint).inc();
  res.locals.prometheusTimer = responseTimeHistogram.labels(req.method, endpoint).startTimer();

  const reqId = uuidv1();
  httpContext.set("reqId", reqId);
  req.reqId = reqId;

  logger.info(`[${reqId}] ${req.method} ${req.originalUrl}`);

  const oldSend = res.send;
  res.send = function (data) {
    responseStatusCounter.labels(res.statusCode.toString(), req.method, endpoint).inc();
    if (res.locals.prometheusTimer) res.locals.prometheusTimer();
    oldSend.apply(res, arguments);
  };

  next();
});

// ----- Prometheus Endpoint -----
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", promRegistry.contentType);
    res.end(await promRegistry.metrics());
  } catch (error) {
    logger.error(`Metrics error: ${error.message}`);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
});

// ----- Health Check -----
app.get("/", (req, res) => {
  res.json({
    status: true,
    app: "Beyomo Home Services API",
    version: "1.0.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    dbStatus: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: true,
    dbStatus: getDBStatus(),
    uptime: process.uptime(),
  });
});

// ----- Static Files (uploaded images) -----
// New uploads are written to upload_files/ (matches the live server's
// public_html/upload_files path). uploads/ stays mounted read-only so links
// already stored in the DB from before this rename keep resolving.
app.use("/upload_files", express.static(path.join(__dirname, "upload_files")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----- API Routes -----
app.use(beyomoApiRoutes);

// ----- 404 Handler -----
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ----- Global Error Handler -----
app.use(globalErrorHandler);

module.exports = app;
