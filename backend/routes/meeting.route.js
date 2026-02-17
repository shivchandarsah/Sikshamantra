import { Router } from "express";
import {
  generateMeetingLink,
  joinMeeting,
  getMeetingDetails,
  getUpcomingMeetings,
  getPastMeetings,
  getAllMeetings,
  updateMeetingStatus,
  recordParticipantActivity,
  getMeetingsForReminders,
  markReminderSent,
  confirmPayment
} from "../controllers/meeting.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// All meeting routes require authentication
router.use(authMiddleware);

// Generate meeting link
router.post("/generate", generateMeetingLink);

// Join meeting
router.get("/join/:roomId", joinMeeting);

// Get meeting details
router.get("/details/:roomId", getMeetingDetails);

// Get upcoming meetings for current user
router.get("/upcoming", getUpcomingMeetings);

// Get past meetings for current user
router.get("/past", getPastMeetings);

// Get all meetings for current user (with pagination)
router.get("/all", getAllMeetings);

// Update meeting status
router.patch("/status/:meetingId", updateMeetingStatus);

// Record participant join/leave activity
router.post("/participant/:meetingId", recordParticipantActivity);

// Confirm payment (teacher only)
router.post("/confirm-payment/:meetingId", confirmPayment);

// Get meetings needing reminders (for background job)
router.get("/reminders", getMeetingsForReminders);

// Mark reminder as sent
router.patch("/reminder-sent/:meetingId", markReminderSent);

export default router;