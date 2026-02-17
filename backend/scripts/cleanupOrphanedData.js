import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import { User } from '../models/user.model.js';
import { Student } from '../models/student.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Post } from '../models/post.model.js';
import { Offer } from '../models/Offer.model.js';
import { Course } from '../models/course.model.js';
import { Meeting } from '../models/meeting.model.js';
import Payment from '../models/payment.model.js';
import TeacherBalance from '../models/teacherBalance.model.js';
import Payout from '../models/payout.model.js';
import { Chat } from '../models/chat.model.js';
import { Notification } from '../models/notification.model.js';

// Dynamic imports for optional models
let MeetingReview, MeetingSummary;

async function cleanupOrphanedData() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Try to import optional models
    try {
      const reviewModule = await import('../models/meetingReview.model.js');
      MeetingReview = reviewModule.MeetingReview;
    } catch (error) {
      console.log('⚠️  MeetingReview model not found, skipping...');
    }

    try {
      const summaryModule = await import('../models/meetingSummary.model.js');
      MeetingSummary = summaryModule.default;
    } catch (error) {
      console.log('⚠️  MeetingSummary model not found, skipping...');
    }

    console.log('🗑️  Cleaning up orphaned data...\n');

    // Get all valid user IDs
    const validUsers = await User.find({}, '_id');
    const validUserIds = validUsers.map(u => u._id);

    console.log(`📊 Found ${validUserIds.length} valid users in database\n`);

    // 1. Clean orphaned student profiles
    const orphanedStudents = await Student.deleteMany({ 
      userId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedStudents.deletedCount} orphaned student profiles`);

    // 2. Clean orphaned teacher profiles
    const orphanedTeachers = await Teacher.deleteMany({ 
      userId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedTeachers.deletedCount} orphaned teacher profiles`);

    // 3. Clean orphaned posts
    const orphanedPosts = await Post.deleteMany({ 
      studentId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedPosts.deletedCount} orphaned posts`);

    // 4. Clean orphaned offers
    const orphanedOffers = await Offer.deleteMany({ 
      teacherId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedOffers.deletedCount} orphaned offers`);

    // 5. Clean orphaned courses
    const orphanedCourses = await Course.deleteMany({ 
      teacherId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedCourses.deletedCount} orphaned courses`);

    // 6. Clean orphaned meetings
    const orphanedMeetings = await Meeting.deleteMany({
      $or: [
        { studentId: { $nin: validUserIds } },
        { teacherId: { $nin: validUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${orphanedMeetings.deletedCount} orphaned meetings`);

    // 7. Clean orphaned payments
    const orphanedPayments = await Payment.deleteMany({
      $or: [
        { studentId: { $nin: validUserIds } },
        { teacherId: { $nin: validUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${orphanedPayments.deletedCount} orphaned payments`);

    // 8. Clean orphaned teacher balances
    const orphanedBalances = await TeacherBalance.deleteMany({ 
      teacherId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedBalances.deletedCount} orphaned teacher balances`);

    // 9. Clean orphaned payouts
    const orphanedPayouts = await Payout.deleteMany({ 
      teacherId: { $nin: validUserIds } 
    });
    console.log(`   ✅ Deleted ${orphanedPayouts.deletedCount} orphaned payout requests`);

    // 10. Clean orphaned chats
    const orphanedChats = await Chat.deleteMany({
      $or: [
        { sender: { $nin: validUserIds } },
        { receiver: { $nin: validUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${orphanedChats.deletedCount} orphaned chat messages`);

    // 11. Clean orphaned notifications
    const orphanedNotifications = await Notification.deleteMany({
      $or: [
        { recipient: { $nin: validUserIds } },
        { sender: { $nin: validUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${orphanedNotifications.deletedCount} orphaned notifications`);

    // 12. Clean orphaned meeting reviews
    if (MeetingReview) {
      const orphanedReviews = await MeetingReview.deleteMany({
        $or: [
          { reviewerId: { $nin: validUserIds } },
          { revieweeId: { $nin: validUserIds } }
        ]
      });
      console.log(`   ✅ Deleted ${orphanedReviews.deletedCount} orphaned meeting reviews`);
    }

    // 13. Clean orphaned meeting summaries (check if meeting exists)
    if (MeetingSummary) {
      const validMeetings = await Meeting.find({}, '_id');
      const validMeetingIds = validMeetings.map(m => m._id);
      
      const orphanedSummaries = await MeetingSummary.deleteMany({
        meetingId: { $nin: validMeetingIds }
      });
      console.log(`   ✅ Deleted ${orphanedSummaries.deletedCount} orphaned meeting summaries`);
    }

    // Show final counts
    console.log('\n📊 Final Database Status:');
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalOffers = await Offer.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalMeetings = await Meeting.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalNotifications = await Notification.countDocuments();

    console.log(`   Users: ${totalUsers}`);
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Teachers: ${totalTeachers}`);
    console.log(`   Posts: ${totalPosts}`);
    console.log(`   Offers: ${totalOffers}`);
    console.log(`   Courses: ${totalCourses}`);
    console.log(`   Meetings: ${totalMeetings}`);
    console.log(`   Payments: ${totalPayments}`);
    console.log(`   Chats: ${totalChats}`);
    console.log(`   Notifications: ${totalNotifications}\n`);

    console.log('✅ All orphaned data has been cleaned up successfully!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
cleanupOrphanedData();
