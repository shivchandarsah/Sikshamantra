// Meeting Summary Routes
import express from 'express';
import {
  generateMeetingSummary,
  getUserSummaries,
  getSummary,
  resendSummaryEmail
} from '../controllers/meetingSummary.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Generate summary (called after meeting ends)
router.post('/generate', generateMeetingSummary);

// Get user's summaries
router.get('/my-summaries', getUserSummaries);

// Get single summary
router.get('/:summaryId', getSummary);

// Resend summary email
router.post('/:summaryId/resend-email', resendSummaryEmail);

export default router;
