import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      fullName: "System Administrator",
      email: "admin@sikshamantra.com",
      password: "admin123456", // Change this to a secure password
      role: "admin",
      isEmailVerified: true
    };

    const admin = await User.create(adminData);
    console.log("Admin user created successfully:");
    console.log("Email:", admin.email);
    console.log("Password: admin123456");
    console.log("Please change the password after first login!");

  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();