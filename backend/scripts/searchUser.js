import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import { User } from '../models/user.model.js';

async function searchUser() {
  try {
    const searchEmail = process.argv[2] || 'sahplayer70@gmail.com';
    
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Searching for user: ${searchEmail}\n`);

    // Search in cloud database
    const user = await User.findOne({ email: searchEmail });

    if (user) {
      console.log('❌ USER FOUND IN CLOUD DATABASE:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.fullName);
      console.log('   Role:', user.role);
      console.log('   Created:', user.createdAt);
      console.log('   ID:', user._id);
      console.log('\n');
    } else {
      console.log('✅ User NOT found in cloud database\n');
    }

    // List all users
    console.log('📊 All users in cloud database:');
    const allUsers = await User.find({});
    console.log(`   Total: ${allUsers.length}\n`);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');

    // Now check local database
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Checking LOCAL MongoDB...\n');

    try {
      await mongoose.connect('mongodb://localhost:27017/sikshamantra', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('✅ Connected to LOCAL MongoDB\n');

      const localUser = await User.findOne({ email: searchEmail });
      
      if (localUser) {
        console.log('❌ USER FOUND IN LOCAL DATABASE:');
        console.log('   Email:', localUser.email);
        console.log('   Name:', localUser.fullName);
        console.log('   Role:', localUser.role);
        console.log('   Created:', localUser.createdAt);
        console.log('   ID:', localUser._id);
        console.log('\n');
      } else {
        console.log('✅ User NOT found in local database\n');
      }

      const allLocalUsers = await User.find({});
      console.log('📊 All users in local database:');
      console.log(`   Total: ${allLocalUsers.length}\n`);
      allLocalUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });

      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');

    } catch (error) {
      console.log('⚠️  Local MongoDB not accessible\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

searchUser();
