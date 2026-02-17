import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Offer } from "../models/Offer.model.js";
import { Post } from "../models/post.model.js";
import { Review } from "../models/review.model.js";

/**
 * Get Student Profile Stats
 */
export const getStudentProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (req.user.role !== "student") {
    throw new ApiError(403, "Access denied. Student profile only.");
  }

  // Get the latest user data from database (not from JWT token)
  const currentUser = await User.findById(userId).select('-password -refreshToken -emailVerificationOTP -passwordResetToken');
  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Get completed meetings for this student
  const { Meeting } = await import('../models/meeting.model.js');
  const completedMeetings = await Meeting.find({
    studentId: userId,
    status: 'completed'
  }).populate('teacherId', 'fullName email profilePicture');

  // Get all accepted offers for this student
  const acceptedOffers = await Offer.find({
    offeredTo: userId,
    status: "Accepted",
  }).populate({
    path: "offeredBy",
    select: "fullName email",
  }).populate({
    path: "post",
    select: "topic description",
  });

  // Get all appointments for accepted offers
  const acceptedOfferIds = acceptedOffers.map((offer) => offer._id);
  const appointments = await Appointment.find({
    offer: { $in: acceptedOfferIds },
  })
    .populate({
      path: "offer",
      populate: [
        {
          path: "offeredBy",
          select: "fullName email",
        },
        {
          path: "post",
          select: "topic description",
        },
      ],
    });

  // Get all posts (courses/requests) created by this student
  const studentPosts = await Post.find({
    studentDetail: userId,
  }).select("topic description status createdAt");

  // Count unique teachers from completed meetings
  const uniqueTeachers = new Set();
  completedMeetings.forEach((meeting) => {
    if (meeting.teacherId) {
      uniqueTeachers.add(meeting.teacherId._id.toString());
    }
  });

  // Get teacher details
  const teacherIds = Array.from(uniqueTeachers);
  const teachers = await User.find({
    _id: { $in: teacherIds },
  }).select("fullName email profilePicture");

  const profileData = {
    user: {
      _id: currentUser._id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role,
      age: currentUser.age,
      phoneNumber: currentUser.phoneNumber,
      qualification: currentUser.qualification,
      currentCenter: currentUser.currentCenter,
      profilePicture: currentUser.profilePicture,
    },
    stats: {
      classesAttended: completedMeetings.length, // Count from Meeting model
      coursesRead: studentPosts.length,
      teachersCount: teachers.length,
      acceptedOffersCount: acceptedOffers.length,
      totalReviews: currentUser.totalReviews || 0,
      averageRating: currentUser.averageRating || 0,
    },
    courses: studentPosts.map((post) => ({
      topic: post.topic,
      description: post.description,
      status: post.status,
      createdAt: post.createdAt,
    })),
    teachers: teachers.map((teacher) => ({
      _id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
    })),
    appointments: appointments.map((appointment) => ({
      _id: appointment._id,
      scheduleTime: appointment.scheduleTime,
      teacher: appointment.offer?.offeredBy,
      course: acceptedOffers.find(
        (offer) => offer._id.toString() === appointment.offer?._id.toString()
      )?.post,
    })),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, profileData, "Student profile fetched successfully")
    );
});

/**
 * Get Student Profile by ID (for teachers to view)
 */
export const getStudentProfileById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const requesterId = req.user._id;

  // Only teachers can view student profiles
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Access denied. Only teachers can view student profiles.");
  }

  // Verify the student exists
  const student = await User.findById(studentId).select('-password -refreshToken -emailVerificationOTP -passwordResetToken');
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.role !== "student") {
    throw new ApiError(400, "User is not a student");
  }

  // Check if the teacher has any accepted offers with this student
  const hasConnection = await Offer.findOne({
    offeredBy: requesterId,
    offeredTo: studentId,
    status: "Accepted"
  });

  if (!hasConnection) {
    throw new ApiError(403, "You can only view profiles of students you are teaching");
  }

  // Get student's posts/requests
  const studentPosts = await Post.find({
    studentDetail: studentId,
  }).select("topic description status createdAt budget");

  // Get accepted offers for this student (to show teaching history)
  const acceptedOffers = await Offer.find({
    offeredTo: studentId,
    status: "Accepted",
  }).populate({
    path: "offeredBy",
    select: "fullName email",
  }).populate({
    path: "post",
    select: "topic description",
  });

  // Get appointments for this student
  const acceptedOfferIds = acceptedOffers.map((offer) => offer._id);
  const appointments = await Appointment.find({
    offer: { $in: acceptedOfferIds },
  }).populate({
    path: "offer",
    populate: [
      {
        path: "offeredBy",
        select: "fullName email",
      },
      {
        path: "post",
        select: "topic description",
      },
    ],
  });

  const profileData = {
    user: {
      _id: student._id,
      fullName: student.fullName,
      email: student.email,
      role: student.role,
      age: student.age,
      phoneNumber: student.phoneNumber,
      qualification: student.qualification,
      currentCenter: student.currentCenter,
      profilePicture: student.profilePicture,
    },
    stats: {
      totalRequests: studentPosts.length,
      activeRequests: studentPosts.filter(post => post.status === 'open').length,
      completedSessions: appointments.length,
      averageRating: 0, // Can be calculated if reviews are implemented
    },
    recentRequests: studentPosts.slice(0, 5).map((post) => ({
      _id: post._id,
      topic: post.topic,
      description: post.description,
      status: post.status,
      budget: post.budget,
      createdAt: post.createdAt,
    })),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, profileData, "Student profile fetched successfully")
    );
});
export const getTeacherProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Access denied. Teacher profile only.");
  }

  // Get the latest user data from database (not from JWT token)
  const currentUser = await User.findById(userId).select('-password -refreshToken -emailVerificationOTP -passwordResetToken');
  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Get completed meetings for this teacher
  const { Meeting } = await import('../models/meeting.model.js');
  const completedMeetings = await Meeting.find({
    teacherId: userId,
    status: 'completed'
  }).populate('studentId', 'fullName email profilePicture');

  // Get all offers made by this teacher
  const teacherOffers = await Offer.find({
    offeredBy: userId,
  }).populate({
    path: "offeredTo",
    select: "fullName email",
  }).populate({
    path: "post",
    select: "topic description",
  });

  // Get accepted offers
  const acceptedOffers = teacherOffers.filter(
    (offer) => offer.status === "Accepted"
  );

  // Get all appointments for accepted offers
  const acceptedOfferIds = acceptedOffers.map((offer) => offer._id);
  const appointments = await Appointment.find({
    offer: { $in: acceptedOfferIds },
  }).populate({
    path: "offer",
    populate: [
      {
        path: "offeredTo",
        select: "fullName email",
      },
      {
        path: "post",
        select: "topic description",
      },
    ],
  });

  // Get reviews from MeetingReview model (new system)
  const { MeetingReview } = await import('../models/meetingReview.model.js');
  const reviews = await MeetingReview.find({
    reviewee: userId,
    status: "active"
  })
    .populate({
      path: "reviewer",
      select: "fullName email profilePicture",
    })
    .populate({
      path: "meeting",
      select: "subject scheduledTime",
    })
    .sort({ createdAt: -1 })
    .limit(10); // Limit to recent 10 reviews

  const profileData = {
    user: {
      _id: currentUser._id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role,
      age: currentUser.age,
      phoneNumber: currentUser.phoneNumber,
      qualification: currentUser.qualification,
      currentCenter: currentUser.currentCenter,
      profilePicture: currentUser.profilePicture,
    },
    stats: {
      totalReviews: currentUser.totalReviews || 0,
      averageRating: currentUser.averageRating || 0,
      classesTaken: completedMeetings.length, // Count from Meeting model
      totalOffers: teacherOffers.length,
      acceptedOffers: acceptedOffers.length,
      pendingOffers: teacherOffers.filter(
        (offer) => offer.status === "Pending"
      ).length,
    },
    reviews: reviews.map((review) => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      student: review.reviewer, // reviewer is the student who reviewed the teacher
      createdAt: review.createdAt,
    })),
    appointments: appointments.map((appointment) => ({
      _id: appointment._id,
      scheduleTime: appointment.scheduleTime,
      student: appointment.offer?.offeredTo,
      course: appointment.offer?.post,
    })),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, profileData, "Teacher profile fetched successfully")
    );
});

