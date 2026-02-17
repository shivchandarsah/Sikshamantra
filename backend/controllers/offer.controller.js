import mongoose from "mongoose";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";

import { Offer } from "../models/Offer.model.js";
import { Teacher } from "../models/teacher.model.js";
import { Post } from "../models/post.model.js";
import { Notification } from "../models/notification.model.js";

// ================= CREATE OFFER =================
const createOffer = asyncHandler(async (req, res) => {

  if (!req.user) throw new ApiError(401, "Unauthorized");
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Only teachers can create offers");
  }

  const { fee, time, message } = req.body;
  const { reqId } = req.query; // reqId === postId

  // Validate input
  if (
    fee === undefined ||
    !time ||
    !message ||
    !mongoose.Types.ObjectId.isValid(reqId)
  ) {
    throw new ApiError(400, "Invalid or missing fields");
  }

  const parsedTime = new Date(time);
  if (isNaN(parsedTime.getTime())) {
    throw new ApiError(400, "Invalid appointment time");
  }

  // Get post (single source of truth)
  const post = await Post.findById(reqId);
  if (!post) throw new ApiError(404, "Post not found");

  const studentId = post.studentDetail;
  if (!studentId) {
    throw new ApiError(400, "Post has no student associated");
  }

  // Prevent self-offer (should not happen with clean data)
  if (studentId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Cannot create offer to yourself");
  }

  // Ensure teacher profile exists
  const teacher = await Teacher.findOne({ userDetail: req.user._id });
  if (!teacher) {
    throw new ApiError(400, "Teacher profile not found");
  }

  // Prevent duplicate offer by same teacher on same post
  const existingOffer = await Offer.findOne({
    post: reqId,
    offeredBy: req.user._id,
  });

  if (existingOffer) {
    throw new ApiError(409, "You have already made an offer on this post");
  }

  const offer = await Offer.create({
    offeredBy: req.user._id,
    offeredTo: studentId,
    post: reqId,
    appointmentTime: parsedTime,
    proposed_price: fee,
    message,
  });

  const populatedOffer = await Offer.findById(offer._id)
    .populate({ path: "offeredBy", select: "fullName _id" })
    .populate({ path: "offeredTo", select: "fullName _id" });

  // Create notification for the student
  try {
    await Notification.create({
      recipient: studentId,
      sender: req.user._id,
      type: "offer",
      title: "New Offer Received",
      message: `${req.user.fullName} made an offer for your request: ${post.topic}`,
      data: {
        offerId: offer._id,
        postId: reqId,
        proposedPrice: fee,
        appointmentTime: parsedTime,
        postTopic: post.topic
      },
      actionUrl: '/student/accepted-offers'
    });
  } catch (notificationError) {
    console.error("Failed to create offer notification:", notificationError);
    // Don't fail the offer creation if notification fails
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ...populatedOffer.toObject(),
        offeredBy: {
          ...populatedOffer.offeredBy.toObject(),
          rating: teacher.rating || 0,
          experience: teacher.experience || 0,
        },
      },
      "Offer created successfully"
    )
  );
});

// ================= FETCH OFFERS =================
const fetchOffers = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const userId = req.user._id;
  const isTeacher = req.user.role === "teacher";

  const query = isTeacher
    ? { offeredBy: userId }
    : { offeredTo: userId };

  const offers = await Offer.find(query)
    .populate({
      path: "post",
      populate: { path: "studentDetail", select: "fullName _id" },
    })
    .populate("offeredBy", "fullName _id")
    .populate("offeredTo", "fullName _id")
    .sort({ createdAt: -1 }); // Latest offers first

  // Filter out offers with deleted posts
  const validOffers = offers.filter(offer => offer.post !== null);

  return res
    .status(200)
    .json(new ApiResponse(200, validOffers, "Offers fetched successfully"));
});

// ================= FETCH OFFER BY POST =================
const fetchOfferByReqId = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  
  const { reqId } = req.query;
  if (!mongoose.Types.ObjectId.isValid(reqId)) {
    throw new ApiError(400, "Invalid request ID");
  }

  // ✅ Handle both teachers and students
  if (req.user.role === "teacher") {
    // Teachers: Return their own offer for this post
    const offer = await Offer.findOne({
      post: reqId,
      offeredBy: req.user._id,
    }).populate("offeredBy", "fullName _id");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          offer,
          offer ? "Offer found" : "No offer found"
        )
      );
  } else if (req.user.role === "student") {
    // Students: Return null (they don't create offers)
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Students don't create offers"
        )
      );
  } else {
    throw new ApiError(403, "Invalid user role");
  }
});

// ================= FETCH ALL OFFERS BY POST =================
const fetchOffersByReqId = asyncHandler(async (req, res) => {
  const { reqId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(reqId)) {
    throw new ApiError(400, "Invalid request ID");
  }

  // Check if the post exists
  const { Post } = await import("../models/post.model.js");
  const post = await Post.findById(reqId);
  if (!post) {
    // Post has been deleted, return empty offers array
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Post not found, no offers available"));
  }

  const offers = await Offer.find({ post: reqId })
    .populate("offeredBy", "fullName _id")
    .sort({ createdAt: -1 }); // Latest offers first

  return res
    .status(200)
    .json(new ApiResponse(200, offers, "Offers fetched successfully"));
});

// ================= ACCEPT OFFER =================
const acceptOffer = asyncHandler(async (req, res) => {

  if (!req.user) throw new ApiError(401, "Unauthorized");
  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can accept offers");
  }

  const { offerId } = req.query;
  if (!mongoose.Types.ObjectId.isValid(offerId)) {
    throw new ApiError(400, "Invalid offer ID");
  }

  const offer = await Offer.findById(offerId);
  if (!offer) throw new ApiError(404, "Offer not found");

  // Ownership check
  if (offer.offeredTo.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "This offer does not belong to you");
  }

  if (offer.status === "Accepted") {
    throw new ApiError(400, "Offer already accepted");
  }

  if (offer.status === "Rejected") {
    throw new ApiError(400, "Cannot accept a rejected offer");
  }

  offer.status = "Accepted";
  await offer.save();

  // Close post
  await Post.findByIdAndUpdate(offer.post, { status: "closed" });

  // Create notification for the teacher
  try {
    const populatedOffer = await Offer.findById(offerId)
      .populate({ path: "post", select: "topic" })
      .populate({ path: "offeredBy", select: "fullName" });

    await Notification.create({
      recipient: offer.offeredBy,
      sender: req.user._id,
      type: "offer",
      title: "Offer Accepted",
      message: `${req.user.fullName} accepted your offer for: ${populatedOffer.post.topic}`,
      data: {
        offerId: offerId,
        postId: offer.post,
        postTopic: populatedOffer.post.topic,
        status: "Accepted"
      },
      actionUrl: '/teacher/offered'
    });
  } catch (notificationError) {
    console.error("Failed to create offer acceptance notification:", notificationError);
    // Don't fail the acceptance if notification fails
  }

  return res
    .status(200)
    .json(new ApiResponse(200, offer, "Offer accepted successfully"));
});

// ================= REJECT OFFER =================
const rejectOffer = asyncHandler(async (req, res) => {

  if (!req.user) throw new ApiError(401, "Unauthorized");

  const { offerId } = req.query;
  const { reason } = req.body; // Optional rejection reason

  if (!mongoose.Types.ObjectId.isValid(offerId)) {
    throw new ApiError(400, "Invalid offer ID");
  }

  const offer = await Offer.findById(offerId);
  if (!offer) throw new ApiError(404, "Offer not found");

  // Check permissions based on user role
  if (req.user.role === "student") {
    // Students can reject offers made to them
    if (offer.offeredTo.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "This offer does not belong to you");
    }
  } else if (req.user.role === "teacher") {
    // Teachers can reject/cancel their own offers (only if not accepted)
    if (offer.offeredBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only cancel your own offers");
    }
    if (offer.status === "Accepted") {
      throw new ApiError(400, "Cannot cancel an accepted offer. Contact the student directly.");
    }
  } else {
    throw new ApiError(403, "Invalid user role");
  }

  if (offer.status === "Rejected") {
    throw new ApiError(400, "Offer already rejected");
  }

  // Update offer status
  offer.status = "Rejected";
  if (reason) {
    offer.rejectionReason = reason;
  }
  offer.rejectedAt = new Date();
  offer.rejectedBy = req.user._id;
  
  await offer.save();

  const actionText = req.user.role === "teacher" ? "cancelled" : "rejected";
  
  return res
    .status(200)
    .json(new ApiResponse(200, offer, `Offer ${actionText} successfully`));
});

export {
  createOffer,
  fetchOffers,
  fetchOfferByReqId,
  fetchOffersByReqId,
  acceptOffer,
  rejectOffer,
};
