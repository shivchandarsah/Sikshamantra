// Script to clear ALL data from database (DANGEROUS - USE WITH CAUTION)
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const clearAllData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    console.log(`\n📊 Found ${collections.length} collections`);
    console.log("\n⚠️  WARNING: This will delete ALL data from the database!");
    console.log("⚠️  This action cannot be undone!\n");

    let totalDeleted = 0;

    // Delete all documents from each collection
    for (const collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`✅ Cleared ${collection.collectionName}: ${result.deletedCount} documents`);
      totalDeleted += result.deletedCount;
    }

    console.log(`\n🎉 All data cleared successfully!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error clearing data:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Confirmation prompt
console.log("\n⚠️  ⚠️  ⚠️  DANGER ZONE ⚠️  ⚠️  ⚠️");
console.log("This script will DELETE ALL DATA from the database!");
console.log("This includes:");
console.log("  - All users (students, teachers, admins)");
console.log("  - All posts and offers");
console.log("  - All courses and meetings");
console.log("  - All payments and balances");
console.log("  - All reviews and summaries");
console.log("  - EVERYTHING!\n");

// Run the script
clearAllData();
