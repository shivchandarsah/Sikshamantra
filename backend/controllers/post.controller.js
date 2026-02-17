// backend/controllers/post.controller.js
import { ApiError } from "../utility/ApiError.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";

const create = asyncHandler(async (req, res) => {
  const { title, fee, description, preferredTime } = req.body;

  if ([title, description, preferredTime].some((field) => !field || field.trim() === "")) {
    throw new ApiError(409, "All fields are required");
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized: User not found");
  }

  // ✅ CRITICAL FIX: Only students should be able to create posts
  if (req.user.role !== 'student') {
    throw new ApiError(403, "Only students can create posts/requests for help");
  }

  const userId = req.user._id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(409, "Invalid user ID");
  }

  const parseDate = new Date(preferredTime);

  const postData = {
    topic: title,
    description,
    budget: fee,
    appointmentTime: parseDate,
    studentDetail: userId,
  };

  const createPost = await Post.create(postData);

  if (!createPost) {
    throw new ApiError(500, "Failed to create post");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createPost, "Successfully created post"));
});

const getPostDetail = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId || !isValidObjectId(postId)) {
    throw new ApiError(409, "Invalid or missing post ID");
  }

  const getPost = await Post.findOne({ _id: postId }).populate({
    path: "studentDetail",
    select: "fullName _id",
  });

  if (!getPost) throw new ApiError(404, "Post does not exist");

  return res
    .status(200)
    .json(new ApiResponse(200, getPost, "Successfully fetched post"));
});

const getAllPost = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized: User not found");
  }
  const userId = req.user._id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(409, "Invalid user ID");
  }

  const allPosts = await Post.find({ studentDetail: userId })
    .populate("studentDetail")
    .sort({ createdAt: -1 }); // Latest posts first
  
  // ✅ Return empty array instead of throwing error when no posts found
  return res
    .status(200)
    .json(new ApiResponse(200, allPosts, allPosts.length ? "Successfully fetched all posts" : "No posts found"));
});

const getAllPostForTeacher = asyncHandler(async (req, res) => {
  const allPosts = await Post.find({ status: "open" })
    .populate("studentDetail")
    .sort({ createdAt: -1 }); // Latest posts first
  
  // ✅ Return empty array instead of throwing error when no posts found
  return res
    .status(200)
    .json(new ApiResponse(200, allPosts, allPosts.length ? "Successfully fetched all posts" : "No posts found"));
});

const postClosed = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId || !isValidObjectId(postId)) {
    throw new ApiError(409, "Invalid or missing post ID");
  }

  const postClose = await Post.findByIdAndUpdate(postId, { status: "closed" }, { new: true });
  if (!postClose) throw new ApiError(500, "Failed to close post");

  return res
    .status(200)
    .json(new ApiResponse(200, postClose, "Post closed successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!postId || !isValidObjectId(postId)) {
    throw new ApiError(409, "Invalid or missing post ID");
  }

  // First, delete all related offers for this post
  const { Offer } = await import("../models/Offer.model.js");
  const deletedOffers = await Offer.deleteMany({ post: postId });

  // Then delete the post
  const postDelete = await Post.findByIdAndDelete(postId);
  if (!postDelete) throw new ApiError(500, "Failed to delete post");

  return res
    .status(200)
    .json(new ApiResponse(200, {
      post: postDelete,
      deletedOffersCount: deletedOffers.deletedCount
    }, `Successfully deleted post and ${deletedOffers.deletedCount} related offers`));
});

// ================= CLEANUP ORPHANED OFFERS =================
const cleanupOrphanedOffers = asyncHandler(async (req, res) => {
  const { Offer } = await import("../models/Offer.model.js");
  
  // Find all offers
  const allOffers = await Offer.find({}).populate('post');
  
  // Filter offers where post is null (deleted)
  const orphanedOffers = allOffers.filter(offer => !offer.post);
  
  // Delete orphaned offers
  const orphanedOfferIds = orphanedOffers.map(offer => offer._id);
  const deleteResult = await Offer.deleteMany({ _id: { $in: orphanedOfferIds } });
  
  return res
    .status(200)
    .json(new ApiResponse(200, {
      deletedCount: deleteResult.deletedCount,
      orphanedOfferIds
    }, `Cleaned up ${deleteResult.deletedCount} orphaned offers`));
});

export { create, getPostDetail, getAllPost, postClosed, deletePost, getAllPostForTeacher, cleanupOrphanedOffers };
