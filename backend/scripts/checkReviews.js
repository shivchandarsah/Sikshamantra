import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MeetingReview } from '../models/meetingReview.model.js';
import { User } from '../models/user.model.js';
import { Meeting } from '../models/meeting.model.js';

dotenv.config();

const checkReviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all reviews
    const allReviews = await MeetingReview.find({})
      .populate('reviewer', 'fullName email')
      .populate('reviewee', 'fullName email')
      .populate('meeting', 'subject');

    console.log('\n📊 Total Reviews in Database:', allReviews.length);

    if (allReviews.length > 0) {
      console.log('\n📝 Review Details:');
      allReviews.forEach((review, index) => {
        console.log(`\n--- Review ${index + 1} ---`);
        console.log('ID:', review._id);
        console.log('Reviewer:', review.reviewer?.fullName, `(${review.reviewer?.email})`);
        console.log('Reviewee:', review.reviewee?.fullName, `(${review.reviewee?.email})`);
        console.log('Reviewer Role:', review.reviewerRole);
        console.log('Rating:', review.rating);
        console.log('Status:', review.status);
        console.log('Meeting:', review.meeting?.subject);
        console.log('Created:', review.createdAt);
      });

      // Group by reviewee
      console.log('\n\n📊 Reviews Grouped by Reviewee:');
      const reviewsByUser = {};
      allReviews.forEach(review => {
        const revieweeId = review.reviewee._id.toString();
        if (!reviewsByUser[revieweeId]) {
          reviewsByUser[revieweeId] = {
            name: review.reviewee.fullName,
            email: review.reviewee.email,
            reviews: []
          };
        }
        reviewsByUser[revieweeId].reviews.push(review);
      });

      Object.entries(reviewsByUser).forEach(([userId, data]) => {
        console.log(`\n${data.name} (${data.email}):`);
        console.log(`  User ID: ${userId}`);
        console.log(`  Total Reviews: ${data.reviews.length}`);
        console.log(`  Average Rating: ${(data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)}`);
      });
    } else {
      console.log('\n⚠️ No reviews found in database');
    }

    // Check user stats
    console.log('\n\n👥 User Review Stats:');
    const users = await User.find({ role: { $in: ['student', 'teacher'] } })
      .select('fullName email role averageRating totalReviews');
    
    users.forEach(user => {
      console.log(`\n${user.fullName} (${user.role}):`);
      console.log(`  Email: ${user.email}`);
      console.log(`  User ID: ${user._id}`);
      console.log(`  Average Rating: ${user.averageRating || 0}`);
      console.log(`  Total Reviews: ${user.totalReviews || 0}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkReviews();
