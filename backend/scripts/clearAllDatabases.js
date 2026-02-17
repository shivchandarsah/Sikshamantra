import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function clearDatabase(uri, name) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔌 Connecting to ${name}...`);
    console.log(`   URI: ${uri.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ Connected to ${name}\n`);

    // Get database
    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log(`📊 No collections found in ${name}\n`);
    } else {
      console.log(`📊 Found ${collections.length} collections\n`);
      console.log('🗑️  Dropping all collections...\n');

      // Drop each collection
      for (const collection of collections) {
        await db.collection(collection.name).drop();
        console.log(`   ✅ Dropped: ${collection.name}`);
      }

      console.log(`\n✅ All collections dropped from ${name}!\n`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed\n');

    return { success: true, collections: collections.length };

  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.log(`⚠️  ${name} is NOT accessible\n`);
      return { success: false, error: 'Not accessible' };
    } else {
      console.error(`❌ Error with ${name}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

async function clearAllDatabases() {
  console.log('\n' + '█'.repeat(60));
  console.log('🗑️  CLEAR ALL DATABASES - CLOUD AND LOCAL');
  console.log('█'.repeat(60));

  const results = {
    cloud: null,
    local: null,
  };

  // 1. Clear MongoDB Atlas (Cloud)
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv')) {
    results.cloud = await clearDatabase(
      process.env.MONGODB_URI,
      'MongoDB Atlas (Cloud)'
    );
  } else {
    console.log('\n⚠️  MongoDB Atlas URI not found in .env\n');
  }

  // 2. Clear Local MongoDB
  const localURI = 'mongodb://localhost:27017/sikshamantra';
  results.local = await clearDatabase(localURI, 'Local MongoDB');

  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('█'.repeat(60) + '\n');

  if (results.cloud) {
    if (results.cloud.success) {
      console.log(`✅ MongoDB Atlas (Cloud): Cleared ${results.cloud.collections} collections`);
    } else {
      console.log(`⚠️  MongoDB Atlas (Cloud): ${results.cloud.error}`);
    }
  }

  if (results.local) {
    if (results.local.success) {
      console.log(`✅ Local MongoDB: Cleared ${results.local.collections} collections`);
    } else {
      console.log(`⚠️  Local MongoDB: ${results.local.error}`);
    }
  }

  console.log('\n' + '█'.repeat(60));
  console.log('✅ DATABASE CLEANUP COMPLETE!');
  console.log('█'.repeat(60) + '\n');

  console.log('⚠️  IMPORTANT: All data has been deleted!');
  console.log('   Run this to recreate admin account:');
  console.log('   cd backend && node scripts/createAdmin.js\n');

  process.exit(0);
}

// Run the script
clearAllDatabases();
