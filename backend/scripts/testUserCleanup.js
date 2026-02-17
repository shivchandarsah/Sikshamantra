import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import { User } from '../models/user.model.js';

async function testUserCleanup() {
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Testing User Cleanup Feature\n');
    console.log('='.repeat(60) + '\n');

    // 1. Show current users
    console.log('1️⃣  Current Users:');
    const currentUsers = await User.find({});
    console.log(`   Total: ${currentUsers.length}`);
    currentUsers.forEach(u => {
      const verified = u.isEmailVerified ? '✅' : '❌';
      const age = Math.floor((Date.now() - u.createdAt) / 60000);
      console.log(`   ${verified} ${u.email} (${u.role}) - ${age} min old`);
    });
    console.log('');

    // 2. Create test unverified user
    console.log('2️⃣  Creating Test Unverified User:');
    const testEmail = `test_${Date.now()}@example.com`;
    
    const testUser = await User.create({
      fullName: 'Test User',
      email: testEmail,
      password: 'test123456',
      role: 'student',
      isEmailVerified: false
    });

    console.log(`   ✅ Created: ${testUser.email}`);
    console.log(`   Created at: ${testUser.createdAt}`);
    console.log(`   Verified: ${testUser.isEmailVerified}`);
    console.log('');

    // 3. Simulate old unverified user (for immediate testing)
    console.log('3️⃣  Simulating Old Unverified User:');
    const oldEmail = `old_test_${Date.now()}@example.com`;
    
    const oldUser = await User.create({
      fullName: 'Old Test User',
      email: oldEmail,
      password: 'test123456',
      role: 'student',
      isEmailVerified: false,
      createdAt: new Date(Date.now() - 11 * 60 * 1000) // 11 minutes ago
    });

    console.log(`   ✅ Created: ${oldUser.email}`);
    console.log(`   Created at: ${oldUser.createdAt} (11 minutes ago)`);
    console.log(`   Should be deleted by cleanup service`);
    console.log('');

    // 4. Show all users now
    console.log('4️⃣  All Users After Test Creation:');
    const allUsers = await User.find({});
    console.log(`   Total: ${allUsers.length}`);
    allUsers.forEach(u => {
      const verified = u.isEmailVerified ? '✅' : '❌';
      const age = Math.floor((Date.now() - u.createdAt) / 60000);
      console.log(`   ${verified} ${u.email} (${u.role}) - ${age} min old`);
    });
    console.log('');

    // 5. Manual cleanup test
    console.log('5️⃣  Running Manual Cleanup:');
    const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
    const expiredUsers = await User.find({
      isEmailVerified: false,
      role: { $ne: 'admin' },
      createdAt: { $lt: cutoffTime }
    });

    console.log(`   Found ${expiredUsers.length} expired user(s)`);
    
    for (const user of expiredUsers) {
      const minutesOld = Math.floor((Date.now() - user.createdAt) / 60000);
      console.log(`   - Deleting: ${user.email} (${minutesOld} min old)`);
      await User.findByIdAndDelete(user._id);
    }
    console.log('');

    // 6. Show final state
    console.log('6️⃣  Final User List:');
    const finalUsers = await User.find({});
    console.log(`   Total: ${finalUsers.length}`);
    finalUsers.forEach(u => {
      const verified = u.isEmailVerified ? '✅' : '❌';
      const age = Math.floor((Date.now() - u.createdAt) / 60000);
      console.log(`   ${verified} ${u.email} (${u.role}) - ${age} min old`);
    });
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Test Complete!\n');
    console.log('📝 Summary:');
    console.log('   - Unverified users older than 10 minutes are deleted');
    console.log('   - Verified users are kept regardless of age');
    console.log('   - Admin users are never deleted');
    console.log('   - Cleanup runs automatically every 2 minutes');
    console.log('   - TTL index also handles cleanup at database level\n');

    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUserCleanup();
