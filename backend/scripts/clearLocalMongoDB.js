import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function clearLocalMongoDB() {
  try {
    // Local MongoDB connection string
    const localMongoURI = 'mongodb://localhost:27017/sikshamantra';
    
    console.log('🔌 Attempting to connect to LOCAL MongoDB...');
    console.log('   Connection: mongodb://localhost:27017/sikshamantra\n');
    
    try {
      // Try to connect to local MongoDB with a short timeout
      await mongoose.connect(localMongoURI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      console.log('✅ Connected to LOCAL MongoDB\n');

      // Get database
      const db = mongoose.connection.db;
      
      // Get all collections
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('📊 No collections found in local database\n');
      } else {
        console.log(`📊 Found ${collections.length} collections in local database\n`);
        console.log('🗑️  Dropping all collections...\n');

        // Drop each collection
        for (const collection of collections) {
          await db.collection(collection.name).drop();
          console.log(`   ✅ Dropped collection: ${collection.name}`);
        }
        
        console.log('\n✅ All collections dropped from local MongoDB!\n');
      }

      // Close connection
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ LOCAL MongoDB has been cleared successfully!');
      console.log('='.repeat(60) + '\n');
      
      process.exit(0);

    } catch (connectionError) {
      if (connectionError.name === 'MongooseServerSelectionError') {
        console.log('⚠️  LOCAL MongoDB is NOT running or not installed\n');
        console.log('This is NORMAL if you are only using MongoDB Atlas (cloud).\n');
        console.log('Your cloud database (MongoDB Atlas) is separate and unaffected.\n');
        console.log('If you want to use local MongoDB:');
        console.log('  1. Install MongoDB Community Server');
        console.log('  2. Start MongoDB service');
        console.log('  3. Run this script again\n');
        process.exit(0);
      } else {
        throw connectionError;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
clearLocalMongoDB();
