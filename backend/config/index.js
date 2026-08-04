require("dotenv").config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "https://beyomo.com:3099/upload_files",

  // MySQL
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_NAME: process.env.DB_NAME || "beyomo",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",

  // JWT
  TOKEN_SECRET: process.env.TOKEN_SECRET || "beyomo_default_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN || "1d",

  // SunsTechIT SMS
  SUNSTECH_SMS_KEY: process.env.SUNSTECH_SMS_KEY || "",
  SUNSTECH_SMS_ROUTE_ID: process.env.SUNSTECH_SMS_ROUTE_ID || "13",
  SUNSTECH_SMS_SENDER_ID: process.env.SUNSTECH_SMS_SENDER_ID || "GDWOTP",
  SUNSTECH_SMS_TEMPLATE_ID: process.env.SUNSTECH_SMS_TEMPLATE_ID || "",
  MOCK_SMS: process.env.MOCK_SMS === "true",

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  // Logs
  LOGS_PATH: process.env.LOGS_PATH || "./logs/",

  APP_NAME: process.env.APP_NAME || "Beyomo",
};
