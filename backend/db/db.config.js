import mongoose from "mongoose";

// Optional: quiets deprecation warnings in newer Mongoose versions
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    // Try MONGODB_URI first (current .env), then fall back to MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/FinalProject_db";

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is not defined. Please set it in your .env file."
      );
    }

    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || process.env.MONGO_DB_NAME || undefined,
    });

    // Log successful connection with details
    const dbName = mongoose.connection.db.databaseName;
    const host = mongoose.connection.host;
    
    console.log(`✅ MongoDB Connected:`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${host}`);
    
    // Check if it's Atlas (cloud) or local
    if (host.includes('mongodb.net')) {
      console.log(`   Type: MongoDB Atlas (Cloud) ☁️`);
    } else {
      console.log(`   Type: Local MongoDB 💻`);
    }
    console.log('');

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
