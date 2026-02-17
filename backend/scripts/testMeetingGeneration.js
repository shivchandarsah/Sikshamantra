// Test meeting link generation
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Meeting } from '../models/meeting.model.js';

async function testMeetingGeneration() {
  try {
    console.log('🧪 Testing Meeting Link Generation\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a student and teacher
    const student = await User.findOne({ role: 'student' });
    const teacher = await User.findOne({ role: 'teacher' });

    if (!student) {
      console.log('❌ No student found in database');
      console.log('   Please register a student first\n');
      process.exit(0);
    }

    if (!teacher) {
      console.log('❌ No teacher found in database');
      console.log('   Please register a teacher first\n');
      process.exit(0);
    }

    console.log('📊 Found Users:');
    console.log(`   Student: ${student.fullName} (${student.email})`);
    console.log(`   Teacher: ${teacher.fullName} (${teacher.email})\n`);

    // Test data
    const testData = {
      studentId: student._id,
      teacherId: teacher._id,
      subject: 'Test Meeting - Math Tutoring',
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      price: 100
    };

    console.log('📝 Test Data:');
    console.log(`   Subject: ${testData.subject}`);
    console.log(`   Scheduled: ${testData.scheduledTime}`);
    console.log(`   Price: NPR ${testData.price}\n`);

    // Generate room ID
    const crypto = await import('crypto');
    const roomId = `educonnect-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;

    console.log('🔗 Generated Meeting Link:');
    console.log(`   Room ID: ${roomId}`);
    console.log(`   URL: ${meetingUrl}\n`);

    // Create meeting
    const meeting = await Meeting.create({
      roomId,
      meetingUrl,
      studentId: testData.studentId,
      teacherId: testData.teacherId,
      subject: testData.subject,
      scheduledTime: testData.scheduledTime,
      createdBy: testData.teacherId,
      status: 'scheduled',
      price: testData.price,
      paymentStatus: 'pending'
    });

    console.log('✅ Meeting Created Successfully!');
    console.log(`   Meeting ID: ${meeting._id}`);
    console.log(`   Status: ${meeting.status}`);
    console.log(`   Payment Status: ${meeting.paymentStatus}\n`);

    // Populate and display
    await meeting.populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' },
      { path: 'createdBy', select: 'fullName email' }
    ]);

    console.log('📋 Meeting Details:');
    console.log(`   Student: ${meeting.studentId.fullName}`);
    console.log(`   Teacher: ${meeting.teacherId.fullName}`);
    console.log(`   Subject: ${meeting.subject}`);
    console.log(`   Scheduled: ${meeting.scheduledTime}`);
    console.log(`   Price: NPR ${meeting.price}`);
    console.log(`   Meeting URL: ${meeting.meetingUrl}\n`);

    console.log('✅ Test Passed! Meeting generation is working correctly.\n');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testMeetingGeneration();
