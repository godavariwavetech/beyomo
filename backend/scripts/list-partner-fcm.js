// Prints partner IDs, phone numbers, and their FCM tokens from the DB.
// Use to grab a token for testing push notifications via Firebase Console.

require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.query(
    "SELECT id, phone, name, status, fcmToken, updatedAt FROM partners WHERE fcmToken IS NOT NULL AND fcmToken != '' ORDER BY updatedAt DESC LIMIT 10",
  );

  if (rows.length === 0) {
    console.log("No partners with an FCM token registered.");
  } else {
    console.log(`Found ${rows.length} partner(s) with FCM tokens:\n`);
    for (const p of rows) {
      console.log(`  id=${p.id}  phone=${p.phone}  name=${p.name}  status=${p.status}`);
      console.log(`  token: ${p.fcmToken}`);
      console.log(`  updated: ${p.updatedAt}\n`);
    }
  }

  await conn.end();
})();
