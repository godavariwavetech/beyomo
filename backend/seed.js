require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./utils/dbconnect");

async function seed() {
  await connectDB();
  const AdminUser = require("./api/adminUsers/models/adminUser.model");

  const existing = await AdminUser.findOne({ where: { email: "admin@beyomo.com" } });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  await AdminUser.create({
    name: "Super Admin",
    email: "admin@beyomo.com",
    password: "Admin@123",
    role: "super_admin",
    status: "active",
  });

  console.log("Admin user created:");
  console.log("  Email   : admin@beyomo.com");
  console.log("  Password: Admin@123");
  process.exit(0);
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
