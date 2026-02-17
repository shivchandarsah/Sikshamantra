// Teacher Balance Routes
import express from 'express';
import {
  getTeacherBalance,
  updatePaymentSettings,
  getEarningsHistory,
  requestPayout,
  getPayoutHistory,
  cancelPayoutRequest
} from '../controllers/teacherBalance.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Balance routes
router.get('/balance', getTeacherBalance);
router.get('/earnings', getEarningsHistory);

// Payment settings
router.put('/payment-settings', updatePaymentSettings);

// Payout routes
router.post('/payout/request', requestPayout);
router.get('/payout/history', getPayoutHistory);
router.delete('/payout/:payoutId/cancel', cancelPayoutRequest);

export default router;
