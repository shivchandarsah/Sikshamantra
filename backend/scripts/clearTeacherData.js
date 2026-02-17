// Script to clear all teacher data from database
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Teacher } from "../models/teacher.model.js";
import { Offer } from "../models/Offer.model.js";
import { Course } from "../models/course.model.js";
import TeacherBalance from "../models/teacherBalance.model.js";
import Payout from "../models/payout.model.js";
import { Meeting } from "../models/meeting.model.js";

// Load environment variables
dotenv.config();

const clearTeacherData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all teacher users
    const teachers = await User.find({ role: "teacher" });
    const teacherIds = teachers.map(t => t._id);

    console.log(`\n📊 Found ${teachers.length} teachers to delete`);

    if (teachers.length === 0) {
      console.log("✅ No teachers found in database");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show teacher details
    console.log("\n👥 Teachers to be deleted:");
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.fullName} (${teacher.email})`);
    });

    // Delete teacher profiles
    const teacherProfilesDeleted = await Teacher.deleteMany({
      userDetail: { $in: teacherIds }
    });
    console.log(`\n✅ Deleted ${teacherProfilesDeleted.deletedCount} teacher profiles`);

    // Delete teacher offers
    const offersDeleted = await Offer.deleteMany({
      offeredBy: { $in: teacherIds }
    });
    console.log(`✅ Deleted ${offersDeleted.deletedCount} offers`);

    // Delete teacher courses
    const coursesDeleted = await Course.deleteMany({
      uploadedBy: { $in: teacherIds }
    });
    console.log(`✅ Deleted ${coursesDeleted.deletedCount} courses`);

    // Delete teacher balances
    const balancesDeleted = await TeacherBalance.deleteMany({
      teacher: { $in: teacherIds }
    });
    console.log(`✅ Deleted ${balancesDeleted.deletedCount} teacher balances`);

    // Delete teacher payouts
    const payoutsDeleted = await Payout.deleteMany({
      teacher: { $in: teacherIds }
    });
    console.log(`✅ Deleted ${payoutsDeleted.deletedCount} payout requests`);

    // Delete meetings where teacher was involved
    const meetingsDeleted = await Meeting.deleteMany({
      teacherId: { $in: teacherIds }
    });
    console.log(`✅ Deleted ${meetingsDeleted.deletedCount} meetings`);

    // Delete meeting reviews for teachers (dynamic import)
    let reviewsDeleted = { deletedCount: 0 };
    try {
      const { default: MeetingReview } = await import("../models/meetingReview.model.js");
      reviewsDeleted = await MeetingReview.deleteMany({
        reviewee: { $in: teacherIds }
      });
    } catch (err) {
      console.log(`⚠️  MeetingReview model not found, skipping...`);
    }
    console.log(`✅ Deleted ${reviewsDeleted.deletedCount} reviews`);

    // Delete meeting summaries (dynamic import)
    let summariesDeleted = { deletedCount: 0 };
    try {
      const { default: MeetingSummary } = await import("../models/meetingSummary.model.js");
      summariesDeleted = await MeetingSummary.deleteMany({
        teacher: { $in: teacherIds }
      });
    } catch (err) {
      console.log(`⚠️  MeetingSummary model not found, skipping...`);
    }
    console.log(`✅ Deleted ${summariesDeleted.deletedCount} meeting summaries`);

    // Finally, delete teacher users
    const usersDeleted = await User.deleteMany({
      role: "teacher"
    });
    console.log(`✅ Deleted ${usersDeleted.deletedCount} teacher users`);

    console.log("\n🎉 All teacher data cleared successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Teachers: ${usersDeleted.deletedCount}`);
    console.log(`   - Profiles: ${teacherProfilesDeleted.deletedCount}`);
    console.log(`   - Offers: ${offersDeleted.deletedCount}`);
    console.log(`   - Courses: ${coursesDeleted.deletedCount}`);
    console.log(`   - Balances: ${balancesDeleted.deletedCount}`);
    console.log(`   - Payouts: ${payoutsDeleted.deletedCount}`);
    console.log(`   - Meetings: ${meetingsDeleted.deletedCount}`);
    console.log(`   - Reviews: ${reviewsDeleted.deletedCount}`);
    console.log(`   - Summaries: ${summariesDeleted.deletedCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error clearing teacher data:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
clearTeacherData();
