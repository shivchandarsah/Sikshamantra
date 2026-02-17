// Script to check if AI summaries are saved in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import MeetingSummary from '../models/meetingSummary.model.js';
import { Meeting } from '../models/meeting.model.js';

async function checkAISummaries() {
  try {
    console.log('🔍 Checking AI Summaries in Database...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total summaries
    const totalSummaries = await MeetingSummary.countDocuments();
    console.log(`📊 Total AI Summaries: ${totalSummaries}\n`);

    if (totalSummaries === 0) {
      console.log('❌ No AI summaries found in database');
      console.log('\n💡 Possible reasons:');
      console.log('   1. No meetings have been completed yet');
      console.log('   2. Meetings were completed without meetingData');
      console.log('   3. AI summary generation failed');
      console.log('   4. Check backend logs for errors\n');
      
      // Check completed meetings
      const completedMeetings = await Meeting.countDocuments({ status: 'completed' });
      console.log(`📋 Completed Meetings: ${completedMeetings}`);
      
      if (completedMeetings > 0) {
        console.log('\n⚠️  You have completed meetings but no summaries!');
        console.log('   This means meetingData was not provided when ending meetings.\n');
      }
    } else {
      console.log('✅ AI summaries ARE being saved to database!\n');
      
      // Get recent summaries
      const recentSummaries = await MeetingSummary.find()
        .populate('teacher', 'fullName email')
        .populate('students', 'fullName email')
        .populate('meeting', 'subject scheduledTime')
        .sort({ createdAt: -1 })
        .limit(5);

      console.log('📝 Recent Summaries:\n');
      recentSummaries.forEach((summary, index) => {
        console.log(`${index + 1}. Summary ID: ${summary._id}`);
        console.log(`   Meeting: ${summary.meeting?.subject || 'N/A'}`);
        console.log(`   Teacher: ${summary.teacher?.fullName || 'N/A'}`);
        console.log(`   Students: ${summary.students?.length || 0}`);
        console.log(`   Duration: ${summary.meetingData?.duration || 0} minutes`);
        console.log(`   Generated: ${summary.createdAt.toLocaleString()}`);
        console.log(`   Email Sent: ${summary.emailSent ? '✅ Yes' : '❌ No'}`);
        
        if (summary.aiSummary) {
          console.log(`   Summary: ${summary.aiSummary.summary?.substring(0, 100)}...`);
          console.log(`   Key Topics: ${summary.aiSummary.keyTopics?.length || 0}`);
          console.log(`   Important Points: ${summary.aiSummary.importantPoints?.length || 0}`);
        }
        console.log('');
      });

      // Statistics
      const summariesWithEmail = await MeetingSummary.countDocuments({ emailSent: true });
      console.log(`📧 Summaries with emails sent: ${summariesWithEmail}/${totalSummaries}`);
      
      // Check for summaries without AI content
      const summariesWithoutAI = await MeetingSummary.countDocuments({
        'aiSummary.summary': { $exists: false }
      });
      if (summariesWithoutAI > 0) {
        console.log(`⚠️  Summaries without AI content: ${summariesWithoutAI}`);
      }
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

checkAISummaries();
