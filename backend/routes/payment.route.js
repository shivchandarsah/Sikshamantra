// Payment Routes
import express from 'express';
import {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
  getPayment,
  getAllPayments,
  refundPayment
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User routes (requires authentication)
router.post('/initiate', verifyJWT, initiatePayment);
router.get('/verify', verifyPayment); // No auth needed for callback
router.get('/history', verifyJWT, getPaymentHistory);
router.get('/:transactionId', verifyJWT, getPayment);

// Admin routes (requires authentication - role check in controller)
router.get('/admin/all', verifyJWT, getAllPayments);
router.post('/admin/refund/:transactionId', verifyJWT, refundPayment);

export default router;
