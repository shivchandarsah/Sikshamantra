import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models (using correct export types)
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

// Dynamic imports for models that might not exist
let MeetingReview, MeetingSummary;

async function clearNonAdminUsers() {
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

    // Admin email to preserve
    const adminEmail = 'admin@sikshamantra.com';

    // Find all non-admin users
    const nonAdminUsers = await User.find({
      email: { $ne: adminEmail }
    });

    console.log(`📊 Found ${nonAdminUsers.length} non-admin users to delete\n`);

    if (nonAdminUsers.length === 0) {
      console.log('✅ No non-admin users found in database');
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      process.exit(0);
    }

    // Get user IDs
    const userIds = nonAdminUsers.map(user => user._id);

    // Delete related data
    console.log('🗑️  Deleting related data...\n');

    // 1. Delete student profiles
    const studentsDeleted = await Student.deleteMany({ userId: { $in: userIds } });
    console.log(`   ✅ Deleted ${studentsDeleted.deletedCount} student profiles`);

    // 2. Delete teacher profiles
    const teachersDeleted = await Teacher.deleteMany({ userId: { $in: userIds } });
    console.log(`   ✅ Deleted ${teachersDeleted.deletedCount} teacher profiles`);

    // 3. Delete posts
    const postsDeleted = await Post.deleteMany({ studentId: { $in: userIds } });
    console.log(`   ✅ Deleted ${postsDeleted.deletedCount} posts`);

    // 4. Delete offers
    const offersDeleted = await Offer.deleteMany({ teacherId: { $in: userIds } });
    console.log(`   ✅ Deleted ${offersDeleted.deletedCount} offers`);

    // 5. Delete courses
    const coursesDeleted = await Course.deleteMany({ teacherId: { $in: userIds } });
    console.log(`   ✅ Deleted ${coursesDeleted.deletedCount} courses`);

    // 6. Delete meetings (where user is student or teacher)
    const meetingsDeleted = await Meeting.deleteMany({
      $or: [
        { studentId: { $in: userIds } },
        { teacherId: { $in: userIds } }
      ]
    });
    console.log(`   ✅ Deleted ${meetingsDeleted.deletedCount} meetings`);

    // 7. Delete payments
    const paymentsDeleted = await Payment.deleteMany({
      $or: [
        { studentId: { $in: userIds } },
        { teacherId: { $in: userIds } }
      ]
    });
    console.log(`   ✅ Deleted ${paymentsDeleted.deletedCount} payments`);

    // 8. Delete teacher balances
    const balancesDeleted = await TeacherBalance.deleteMany({ teacherId: { $in: userIds } });
    console.log(`   ✅ Deleted ${balancesDeleted.deletedCount} teacher balances`);

    // 9. Delete payouts
    const payoutsDeleted = await Payout.deleteMany({ teacherId: { $in: userIds } });
    console.log(`   ✅ Deleted ${payoutsDeleted.deletedCount} payout requests`);

    // 10. Delete chats
    const chatsDeleted = await Chat.deleteMany({
      $or: [
        { senderId: { $in: userIds } },
        { receiverId: { $in: userIds } }
      ]
    });
    console.log(`   ✅ Deleted ${chatsDeleted.deletedCount} chat messages`);

    // 11. Delete notifications
    const notificationsDeleted = await Notification.deleteMany({
      $or: [
        { userId: { $in: userIds } },
        { senderId: { $in: userIds } }
      ]
    });
    console.log(`   ✅ Deleted ${notificationsDeleted.deletedCount} notifications`);

    // 12. Delete meeting reviews (if model exists)
    if (MeetingReview) {
      const reviewsDeleted = await MeetingReview.deleteMany({
        $or: [
          { reviewerId: { $in: userIds } },
          { revieweeId: { $in: userIds } }
        ]
      });
      console.log(`   ✅ Deleted ${reviewsDeleted.deletedCount} meeting reviews`);
    }

    // 13. Delete meeting summaries (if model exists)
    if (MeetingSummary) {
      const summariesDeleted = await MeetingSummary.deleteMany({ meetingId: { $in: userIds } });
      console.log(`   ✅ Deleted ${summariesDeleted.deletedCount} meeting summaries`);
    }

    // Finally, delete the users themselves
    console.log('\n🗑️  Deleting users...\n');
    const usersDeleted = await User.deleteMany({
      email: { $ne: adminEmail }
    });
    console.log(`   ✅ Deleted ${usersDeleted.deletedCount} users\n`);

    // Verify admin still exists
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(`✅ Admin account preserved: ${adminEmail}`);
      console.log(`   Role: ${adminExists.role}`);
      console.log(`   Name: ${adminExists.fullName || 'Admin'}\n`);
    } else {
      console.log(`⚠️  Warning: Admin account not found!\n`);
    }

    // Show final counts
    console.log('📊 Final Database Status:');
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalOffers = await Offer.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalMeetings = await Meeting.countDocuments();
    const totalPayments = await Payment.countDocuments();

    console.log(`   Users: ${totalUsers}`);
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Teachers: ${totalTeachers}`);
    console.log(`   Posts: ${totalPosts}`);
    console.log(`   Offers: ${totalOffers}`);
    console.log(`   Courses: ${totalCourses}`);
    console.log(`   Meetings: ${totalMeetings}`);
    console.log(`   Payments: ${totalPayments}\n`);

    console.log('✅ All non-admin users and their data have been deleted successfully!\n');

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
clearNonAdminUsers();
