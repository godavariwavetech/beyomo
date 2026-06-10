require("dotenv").config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

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

  // MSG91
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || "",
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || "",
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || "BEYOMO",
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

  // Logs
  LOGS_PATH: process.env.LOGS_PATH || "./logs/",

  APP_NAME: process.env.APP_NAME || "Beyomo",
};
