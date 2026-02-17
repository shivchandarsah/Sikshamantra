import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { MeetingReview } from "../models/meetingReview.model.js";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";
import { clearUserCache } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

/* =====================================================
   ✍️ CREATE MEETING REVIEW
===================================================== */
export const createMeetingReview = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { rating, comment, categories, isAnonymous } = req.body;
  const userId = req.user._id;

  // Validate meeting exists and is completed
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (meeting.status !== "completed") {
    throw new ApiError(400, "Can only review completed meetings");
  }

  // Check if user is part of the meeting
  const isStudent = meeting.studentId.toString() === userId.toString();
  const isTeacher = meeting.teacherId.toString() === userId.toString();

  if (!isStudent && !isTeacher) {
    throw new ApiError(403, "You are not a participant of this meeting");
  }

  // Determine reviewer role and reviewee
  const reviewerRole = isStudent ? "student" : "teacher";
  const revieweeId = isStudent ? meeting.teacherId : meeting.studentId;

  // Check if review already exists
  const existingReview = await MeetingReview.findOne({
    meeting: meetingId,
    reviewer: userId,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this meeting");
  }

  // Create review
  const review = await MeetingReview.create({
    meeting: meetingId,
    reviewer: userId,
    reviewee: revieweeId,
    reviewerRole,
    rating: rating || 0,
    comment: comment || "",
    categories: categories || {},
    isAnonymous: isAnonymous || false,
  });

  console.log('✅ Review created successfully:', {
    reviewId: review._id,
    reviewer: userId.toString(),
    reviewee: revieweeId.toString(),
    reviewerRole,
    rating: review.rating,
    status: review.status,
    meetingId: meetingId
  });

  // Populate review
  const populatedReview = await MeetingReview.findById(review._id)
    .populate("reviewer", "fullName profilePicture")
    .populate("reviewee", "fullName profilePicture")
    .populate("meeting", "subject scheduledTime");

  // Update user's average rating
  await updateUserAverageRating(revieweeId);

  return res.status(201).json(
    new ApiResponse(201, populatedReview, "Review submitted successfully")
  );
});

/* =====================================================
   📝 UPDATE MEETING REVIEW
===================================================== */
export const updateMeetingReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, categories, isAnonymous } = req.body;
  const userId = req.user._id;

  const review = await MeetingReview.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if user is the reviewer
  if (review.reviewer.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own reviews");
  }

  // Update fields
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (categories !== undefined) review.categories = categories;
  if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

  await review.save();

  const updatedReview = await MeetingReview.findById(reviewId)
    .populate("reviewer", "fullName profilePicture")
    .populate("reviewee", "fullName profilePicture")
    .populate("meeting", "subject scheduledTime");

  // Update user's average rating
  await updateUserAverageRating(review.reviewee);

  return res.status(200).json(
    new ApiResponse(200, updatedReview, "Review updated successfully")
  );
});

/* =====================================================
   🗑️ DELETE MEETING REVIEW
===================================================== */
export const deleteMeetingReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await MeetingReview.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if user is the reviewer or admin
  if (review.reviewer.toString() !== userId.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  const revieweeId = review.reviewee;
  await MeetingReview.findByIdAndDelete(reviewId);

  // Update user's average rating
  await updateUserAverageRating(revieweeId);

  return res.status(200).json(
    new ApiResponse(200, null, "Review deleted successfully")
  );
});

/* =====================================================
   📖 GET REVIEWS FOR A MEETING
===================================================== */
export const getMeetingReviews = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const reviews = await MeetingReview.find({ meeting: meetingId, status: "active" })
    .populate("reviewer", "fullName profilePicture")
    .populate("reviewee", "fullName profilePicture")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, reviews, "Meeting reviews fetched successfully")
  );
});

/* =====================================================
   👤 GET REVIEWS FOR A USER (TEACHER/STUDENT)
===================================================== */
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, role } = req.query;

  console.log('📊 Getting reviews for user:', userId);

  // Build filter object
  const filter = { 
    reviewee: new mongoose.Types.ObjectId(userId), 
    status: "active" 
  };
  
  if (role) {
    filter.reviewerRole = role;
  }

  console.log('🔍 Filter:', JSON.stringify(filter));

  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    MeetingReview.find(filter)
      .populate("reviewer", "fullName profilePicture")
      .populate("meeting", "subject scheduledTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MeetingReview.countDocuments(filter),
  ]);

  console.log('✅ Found reviews:', reviews.length);
  if (reviews.length > 0) {
    console.log('📝 Sample review:', {
      id: reviews[0]._id,
      reviewee: reviews[0].reviewee,
      reviewer: reviews[0].reviewer?._id,
      rating: reviews[0].rating
    });
  }

  // Calculate statistics
  const stats = await MeetingReview.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: "active" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $gte: ["$rating", 4.5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $and: [{ $gte: ["$rating", 3.5] }, { $lt: ["$rating", 4.5] }] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $and: [{ $gte: ["$rating", 2.5] }, { $lt: ["$rating", 3.5] }] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $and: [{ $gte: ["$rating", 1.5] }, { $lt: ["$rating", 2.5] }] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $lt: ["$rating", 1.5] }, 1, 0] } },
      },
    },
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      statistics: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, "User reviews fetched successfully")
  );
});

/* =====================================================
   ✅ CHECK IF USER CAN REVIEW MEETING
===================================================== */
export const canReviewMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if meeting is completed
  if (meeting.status !== "completed") {
    return res.status(200).json(
      new ApiResponse(200, { canReview: false, reason: "Meeting not completed yet" })
    );
  }

  // Check if user is participant
  const isParticipant = 
    meeting.studentId.toString() === userId.toString() ||
    meeting.teacherId.toString() === userId.toString();

  if (!isParticipant) {
    return res.status(200).json(
      new ApiResponse(200, { canReview: false, reason: "Not a participant" })
    );
  }

  // Check if already reviewed
  const existingReview = await MeetingReview.findOne({
    meeting: meetingId,
    reviewer: userId,
  });

  if (existingReview) {
    return res.status(200).json(
      new ApiResponse(200, { 
        canReview: false, 
        reason: "Already reviewed",
        review: existingReview 
      })
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { canReview: true })
  );
});

/* =====================================================
   📊 GET MY REVIEWS (REVIEWS I GAVE)
===================================================== */
export const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    MeetingReview.find({ reviewer: userId })
      .populate("reviewee", "fullName profilePicture")
      .populate("meeting", "subject scheduledTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MeetingReview.countDocuments({ reviewer: userId }),
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, "Your reviews fetched successfully")
  );
});

/* =====================================================
   🔧 HELPER: UPDATE USER AVERAGE RATING
===================================================== */
const updateUserAverageRating = async (userId) => {
  try {
    console.log('🔄 Updating average rating for user:', userId.toString());
    
    const stats = await MeetingReview.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: "active" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    console.log('📊 Calculated stats:', stats);

    if (stats.length > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        {
          averageRating: Math.round(stats[0].averageRating * 10) / 10,
          totalReviews: stats[0].totalReviews,
        },
        { new: true }
      );
      console.log('✅ User rating updated:', {
        userId: updatedUser._id,
        averageRating: updatedUser.averageRating,
        totalReviews: updatedUser.totalReviews
      });
      
      // Clear user cache so next request gets fresh data
      clearUserCache(userId.toString());
      console.log('🗑️ User cache cleared for:', userId.toString());
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        {
          averageRating: 0,
          totalReviews: 0,
        },
        { new: true }
      );
      console.log('✅ User rating reset to 0:', updatedUser._id);
      
      // Clear user cache
      clearUserCache(userId.toString());
      console.log('🗑️ User cache cleared for:', userId.toString());
    }
  } catch (error) {
    console.error("❌ Error updating user average rating:", error);
  }
};
