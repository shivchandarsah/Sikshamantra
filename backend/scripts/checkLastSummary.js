// Check the last generated summary
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import MeetingSummary from '../models/meetingSummary.model.js';
import { User } from '../models/user.model.js';
import { Meeting } from '../models/meeting.model.js';

async function checkLastSummary() {
  try {
    console.log('🔍 Checking last generated summary...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const lastSummary = await MeetingSummary.findOne()
      .sort({ createdAt: -1 })
      .populate('teacher', 'fullName email')
      .populate('students', 'fullName email')
      .populate('meeting', 'subject');

    if (!lastSummary) {
      console.log('❌ No summaries found in database');
      process.exit(0);
    }

    console.log('📊 Last Summary Details:');
    console.log('─────────────────────────────────────');
    console.log('ID:', lastSummary._id);
    console.log('Meeting:', lastSummary.meeting?.subject || 'N/A');
    console.log('Teacher:', lastSummary.teacher?.fullName, `(${lastSummary.teacher?.email})`);
    console.log('Students:', lastSummary.students?.map(s => `${s.fullName} (${s.email})`).join(', '));
    console.log('Created:', lastSummary.createdAt);
    console.log('Email Sent:', lastSummary.emailSent ? '✅ Yes' : '❌ No');
    if (lastSummary.emailSentAt) {
      console.log('Email Sent At:', lastSummary.emailSentAt);
    }
    console.log('\n📝 Meeting Data:');
    console.log('─────────────────────────────────────');
    console.log('Duration:', lastSummary.meetingData?.duration, 'minutes');
    console.log('Chat Messages:', lastSummary.meetingData?.chatMessages?.length || 0);
    console.log('Participants:', lastSummary.meetingData?.participants?.join(', ') || 'None');
    
    if (lastSummary.meetingData?.chatMessages?.length > 0) {
      console.log('\n💬 Chat Messages:');
      lastSummary.meetingData.chatMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.sender}: ${msg.message}`);
      });
    }

    if (lastSummary.meetingData?.whiteboardContent) {
      console.log('\n📋 Whiteboard Content:');
      console.log(lastSummary.meetingData.whiteboardContent);
    }

    console.log('\n🤖 AI Summary:');
    console.log('─────────────────────────────────────');
    console.log('Summary:', lastSummary.aiSummary?.summary || 'No summary');
    console.log('Key Topics:', lastSummary.aiSummary?.keyTopics?.length || 0);
    if (lastSummary.aiSummary?.keyTopics?.length > 0) {
      lastSummary.aiSummary.keyTopics.forEach((topic, i) => {
        console.log(`  ${i + 1}. ${topic}`);
      });
    }
    console.log('Important Points:', lastSummary.aiSummary?.importantPoints?.length || 0);
    if (lastSummary.aiSummary?.importantPoints?.length > 0) {
      lastSummary.aiSummary.importantPoints.forEach((point, i) => {
        console.log(`  ${i + 1}. ${point}`);
      });
    }

    console.log('\n📧 Email Status:');
    console.log('─────────────────────────────────────');
    if (lastSummary.emailSent) {
      console.log('✅ Emails were sent successfully!');
      console.log('📬 Check these inboxes:');
      console.log('   Teacher:', lastSummary.teacher?.email);
      lastSummary.students?.forEach(s => {
        console.log('   Student:', s.email);
      });
      console.log('\n💡 TIP: Check spam/junk folder if not in inbox');
    } else {
      console.log('❌ Emails were NOT sent');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

checkLastSummary();
