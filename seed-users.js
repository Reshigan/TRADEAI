const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("./src/models/User");
const Tenant = require("./src/models/Tenant");
const Company = require("./src/models/Company");

async function seedUsers() {
  try {
    console.log("🚀 Seeding demo users...");
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://tradeai_admin:TradeAI2024MongoPass@tradeai-mongodb:27017/tradeai_production?authSource=admin";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create Tenant
    let tenant = await Tenant.findOne({ slug: "demo" });
    if (!tenant) {
      tenant = await Tenant.create({
        name: "Demo Company",
        slug: "demo",
        domain: "demo.tradeai.com",
        industry: "FMCG",
        status: "active"
      });
      console.log("✅ Created tenant");
    }

    // Create Company
    let company = await Company.findOne({ code: "DEMO" });
    if (!company) {
      company = await Company.create({
        name: "Demo Company",
        code: "DEMO",
        domain: "demo.tradeai.com",
        industry: "fmcg",
        country: "ZA",
        currency: "ZAR",
        timezone: "Africa/Johannesburg",
        tenant: tenant._id
      });
      console.log("✅ Created company");
    }

    // Create demo users
    const users = [
      {
        email: "admin@tradeai.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        department: "admin",
        employeeId: "ADM-001"
      },
      {
        email: "manager@tradeai.com",
        password: "password123",
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        department: "sales",
        employeeId: "MGR-001"
      },
      {
        email: "kam@tradeai.com",
        password: "password123",
        firstName: "KAM",
        lastName: "User",
        role: "kam",
        department: "sales",
        employeeId: "KAM-001"
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create({
          ...userData,
          tenantId: tenant._id,
          isActive: true
        });
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    }

    console.log("\n✅ Seeding complete!");
    console.log("\n👤 Login Credentials:");
    console.log("   ADMIN: admin@tradeai.com / admin123");
    console.log("   MANAGER: manager@tradeai.com / password123");
    console.log("   KAM: kam@tradeai.com / password123");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedUsers();