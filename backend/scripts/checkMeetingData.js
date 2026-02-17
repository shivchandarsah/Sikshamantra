// Script to check meeting data with teacher info
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Meeting } from '../models/meeting.model.js';
import { User } from '../models/user.model.js';

dotenv.config();

const checkMeetingData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a recent meeting
    const meeting = await Meeting.findOne()
      .populate([
        { path: 'studentId', select: 'fullName email profilePicture' },
        { path: 'teacherId', select: 'fullName email profilePicture esewaId esewaQRCode' },
        { path: 'createdBy', select: 'fullName email' }
      ])
      .sort({ createdAt: -1 });

    if (!meeting) {
      console.log('❌ No meetings found');
      process.exit(1);
    }

    console.log('\n📊 Meeting Data:');
    console.log('========================');
    console.log('Meeting ID:', meeting._id);
    console.log('Subject:', meeting.subject);
    console.log('Status:', meeting.status);
    console.log('\nTeacher Info:');
    if (meeting.teacherId) {
      console.log('  Name:', meeting.teacherId.fullName);
      console.log('  Email:', meeting.teacherId.email);
      console.log('  eSewa ID:', meeting.teacherId.esewaId || '(not populated)');
      console.log('  Has QR Code:', !!meeting.teacherId.esewaQRCode);
    } else {
      console.log('  ❌ Teacher not populated');
    }

    console.log('\nStudent Info:');
    if (meeting.studentId) {
      console.log('  Name:', meeting.studentId.fullName);
      console.log('  Email:', meeting.studentId.email);
    } else {
      console.log('  ❌ Student not populated');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkMeetingData();
