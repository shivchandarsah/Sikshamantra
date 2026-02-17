// Script to check completed meetings and why they don't have summaries
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { Meeting } from '../models/meeting.model.js';
import { User } from '../models/user.model.js';

async function checkCompletedMeetings() {
  try {
    console.log('🔍 Checking Completed Meetings...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const completedMeetings = await Meeting.find({ status: 'completed' })
      .populate('studentId', 'fullName email')
      .populate('teacherId', 'fullName email')
      .sort({ completedAt: -1 });

    console.log(`📋 Found ${completedMeetings.length} completed meetings\n`);

    if (completedMeetings.length === 0) {
      console.log('❌ No completed meetings found');
    } else {
      completedMeetings.forEach((meeting, index) => {
        console.log(`${index + 1}. Meeting ID: ${meeting._id}`);
        console.log(`   Subject: ${meeting.subject}`);
        console.log(`   Teacher: ${meeting.teacherId?.fullName || 'N/A'}`);
        console.log(`   Student: ${meeting.studentId?.fullName || 'N/A'}`);
        console.log(`   Scheduled: ${meeting.scheduledTime?.toLocaleString() || 'N/A'}`);
        console.log(`   Completed: ${meeting.completedAt?.toLocaleString() || 'N/A'}`);
        console.log(`   Status: ${meeting.status}`);
        console.log(`   Price: NPR ${meeting.price || 0}`);
        console.log(`   Payment Status: ${meeting.paymentStatus || 'N/A'}`);
        
        // Check if meeting has participants data
        console.log(`   Participants: ${meeting.participants?.length || 0}`);
        
        // Check notes field (might contain meetingData)
        if (meeting.notes) {
          console.log(`   Notes: ${meeting.notes.substring(0, 100)}...`);
        }
        
        console.log('');
      });

      console.log('\n💡 Why no AI summaries were generated:');
      console.log('   When meetings were marked as "completed", the meetingData was not provided.');
      console.log('   The frontend needs to send chat messages, whiteboard content, and duration.');
      console.log('\n📝 To generate summaries, the meeting must be ended with:');
      console.log('   {');
      console.log('     status: "completed",');
      console.log('     meetingData: {');
      console.log('       chatMessages: [...],');
      console.log('       whiteboardContent: "...",');
      console.log('       participants: [...],');
      console.log('       duration: 45');
      console.log('     }');
      console.log('   }');
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

checkCompletedMeetings();
