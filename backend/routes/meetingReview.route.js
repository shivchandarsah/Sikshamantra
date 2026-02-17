import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createMeetingReview,
  updateMeetingReview,
  deleteMeetingReview,
  getMeetingReviews,
  getUserReviews,
  canReviewMeeting,
  getMyReviews,
} from "../controllers/meetingReview.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Create review for a meeting
router.post("/:meetingId", createMeetingReview);

// Update review
router.put("/:reviewId", updateMeetingReview);

// Delete review
router.delete("/:reviewId", deleteMeetingReview);

// Get all reviews for a meeting
router.get("/meeting/:meetingId", getMeetingReviews);

// Check if user can review a meeting
router.get("/can-review/:meetingId", canReviewMeeting);

// Get reviews for a specific user (teacher/student)
router.get("/user/:userId", getUserReviews);

// Get my reviews (reviews I gave)
router.get("/my/reviews", getMyReviews);

export default router;
