// Test AI Summary Email Generation
// IMPORTANT: Load dotenv FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import other modules after env is loaded
import mongoose from 'mongoose';
import meetingSummaryService from '../services/meetingSummary.service.js';
import { Meeting } from '../models/meeting.model.js';
import { User } from '../models/user.model.js';

// Check if Gemini API key is configured
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY is not configured in .env file');
  console.error('💡 Please add a valid Gemini API key to backend/.env');
  console.error('   Get your API key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

async function testAISummaryEmail() {
  try {
    console.log('🧪 Testing AI Summary Email Generation\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find a completed meeting
    console.log('🔍 Finding a completed meeting...');
    const completedMeeting = await Meeting.findOne({ status: 'completed' })
      .populate('teacherId', 'fullName email')
      .populate('studentId', 'fullName email')
      .sort({ completedAt: -1 });

    if (!completedMeeting) {
      console.log('❌ No completed meetings found in database');
      console.log('💡 Complete a meeting first, then run this test');
      process.exit(0);
    }

    console.log('✅ Found completed meeting:');
    console.log('   ID:', completedMeeting._id);
    console.log('   Subject:', completedMeeting.subject);
    console.log('   Teacher:', completedMeeting.teacherId?.fullName, `(${completedMeeting.teacherId?.email})`);
    console.log('   Student:', completedMeeting.studentId?.fullName, `(${completedMeeting.studentId?.email})`);
    console.log('   Completed:', completedMeeting.completedAt || 'N/A');
    console.log('');

    // Prepare test meeting data
    const testMeetingData = {
      teacherId: completedMeeting.teacherId._id,
      studentIds: [completedMeeting.studentId._id],
      teacher: completedMeeting.teacherId.fullName,
      subject: completedMeeting.subject,
      duration: 30,
      startTime: completedMeeting.scheduledTime || completedMeeting.createdAt,
      endTime: new Date(),
      chatMessages: [
        { sender: completedMeeting.teacherId.fullName, message: 'Hello! Let\'s start the class.', timestamp: new Date() },
        { sender: completedMeeting.studentId.fullName, message: 'Hi! I\'m ready to learn.', timestamp: new Date() },
        { sender: completedMeeting.teacherId.fullName, message: 'Today we will cover the basics of the topic.', timestamp: new Date() },
        { sender: completedMeeting.studentId.fullName, message: 'Can you explain more about this concept?', timestamp: new Date() },
        { sender: completedMeeting.teacherId.fullName, message: 'Sure! Let me explain in detail...', timestamp: new Date() }
      ],
      whiteboardContent: 'Key concepts discussed:\n- Introduction to the topic\n- Main principles\n- Practical examples\n- Q&A session',
      participants: [
        `${completedMeeting.teacherId.fullName} (Teacher)`,
        `${completedMeeting.studentId.fullName} (Student)`
      ]
    };

    console.log('📝 Test meeting data prepared:');
    console.log('   Chat messages:', testMeetingData.chatMessages.length);
    console.log('   Duration:', testMeetingData.duration, 'minutes');
    console.log('   Has whiteboard content:', !!testMeetingData.whiteboardContent);
    console.log('');

    // Generate AI summary
    console.log('🤖 Generating AI summary...');
    const summary = await meetingSummaryService.createMeetingSummary(
      completedMeeting._id,
      testMeetingData
    );

    console.log('✅ AI summary generated successfully!');
    console.log('   Summary ID:', summary._id);
    console.log('   Summary text:', summary.aiSummary?.summary?.substring(0, 100) + '...');
    console.log('   Key topics:', summary.aiSummary?.keyTopics?.length || 0);
    console.log('   Important points:', summary.aiSummary?.importantPoints?.length || 0);
    console.log('');

    // Send email
    console.log('📧 Sending summary email...');
    await meetingSummaryService.sendSummaryEmail(summary._id);

    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('📬 Check the email inboxes:');
    console.log('   Teacher:', completedMeeting.teacherId?.email);
    console.log('   Student:', completedMeeting.studentId?.email);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

// Run test
testAISummaryEmail();
