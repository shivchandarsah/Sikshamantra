// Meeting Summary Controller
import meetingSummaryService from '../services/meetingSummary.service.js';
import MeetingSummary from '../models/meetingSummary.model.js';
import { ApiError } from '../utility/ApiError.js';
import { ApiResponse } from '../utility/ApiResponse.js';
import { asyncHandler } from '../utility/AsyncHandler.js';

// Generate summary after meeting ends
export const generateMeetingSummary = asyncHandler(async (req, res) => {
  const { meetingId, meetingData } = req.body;

  if (!meetingId || !meetingData) {
    throw new ApiError(400, 'Meeting ID and meeting data are required');
  }

  // Create summary
  const summary = await meetingSummaryService.createMeetingSummary(meetingId, meetingData);

  // Send emails asynchronously (don't wait)
  meetingSummaryService.sendSummaryEmail(summary._id).catch(err => {
    console.error('Error sending summary emails:', err);
  });

  res.status(200).json(
    new ApiResponse(200, summary, 'Meeting summary generated successfully')
  );
});

// Get user's meeting summaries
export const getUserSummaries = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  const summaries = await meetingSummaryService.getUserSummaries(userId, role);

  res.status(200).json(
    new ApiResponse(200, summaries, 'Summaries retrieved successfully')
  );
});

// Get single summary
export const getSummary = asyncHandler(async (req, res) => {
  const { summaryId } = req.params;
  const userId = req.user._id;

  const summary = await MeetingSummary.findById(summaryId)
    .populate('teacher', 'fullName email')
    .populate('students', 'fullName email')
    .populate('meeting', 'topic');

  if (!summary) {
    throw new ApiError(404, 'Summary not found');
  }

  // Check if user has access
  const hasAccess = 
    summary.teacher._id.toString() === userId.toString() ||
    summary.students.some(s => s._id.toString() === userId.toString());

  if (!hasAccess) {
    throw new ApiError(403, 'Access denied');
  }

  res.status(200).json(
    new ApiResponse(200, summary, 'Summary retrieved successfully')
  );
});

// Resend summary email
export const resendSummaryEmail = asyncHandler(async (req, res) => {
  const { summaryId } = req.params;

  await meetingSummaryService.sendSummaryEmail(summaryId);

  res.status(200).json(
    new ApiResponse(200, null, 'Summary email sent successfully')
  );
});
