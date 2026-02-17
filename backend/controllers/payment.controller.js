// Payment Controller
import crypto from 'crypto';
import axios from 'axios';
import Payment from '../models/payment.model.js';
import { Course } from '../models/course.model.js';
import TeacherBalance from '../models/teacherBalance.model.js';
import { ApiError } from '../utility/ApiError.js';
import { ApiResponse } from '../utility/ApiResponse.js';
import { asyncHandler } from '../utility/AsyncHandler.js';

// Generate unique transaction ID
const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Initiate Payment
export const initiatePayment = asyncHandler(async (req, res) => {
  const { amount, purpose, purposeId, metadata } = req.body;
  const userId = req.user._id;

  // Validate amount
  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid amount');
  }

  // Validate purpose
  const validPurposes = ['course', 'meeting', 'consultation', 'subscription', 'donation', 'other'];
  if (!validPurposes.includes(purpose)) {
    throw new ApiError(400, 'Invalid payment purpose');
  }

  // If purpose is course, verify course exists
  if (purpose === 'course' && purposeId) {
    const course = await Course.findById(purposeId);
    if (!course) {
      throw new ApiError(404, 'Course not found');
    }
  }

  // If purpose is meeting, verify meeting exists and is completed
  if (purpose === 'meeting' && purposeId) {
    const { Meeting } = await import("../models/meeting.model.js");
    const meeting = await Meeting.findById(purposeId);
    if (!meeting) {
      throw new ApiError(404, 'Meeting not found');
    }
    if (meeting.status !== 'completed') {
      throw new ApiError(400, 'Can only pay for completed meetings');
    }
    // Check if already paid
    if (meeting.isPaid) {
      throw new ApiError(400, 'Meeting has already been paid for');
    }
  }

  // Generate transaction ID
  const transactionId = generateTransactionId();

  // Create payment record
  const payment = await Payment.create({
    transactionId,
    user: userId,
    amount,
    purpose,
    purposeId: purposeId || null,
    status: 'pending',
    metadata: metadata || {}
  });

  // Prepare eSewa payment data
  const esewaData = {
    amt: amount,
    psc: 0, // Service charge
    pdc: 0, // Delivery charge
    txAmt: 0, // Tax amount
    tAmt: amount, // Total amount
    pid: transactionId,
    scd: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
    su: `${process.env.ESEWA_SUCCESS_URL}?txnId=${transactionId}`,
    fu: `${process.env.ESEWA_FAILURE_URL}?txnId=${transactionId}`
  };

  res.status(200).json(
    new ApiResponse(200, {
      payment,
      esewaData,
      paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://uat.esewa.com.np/epay/main'
    }, 'Payment initiated successfully')
  );
});

// Verify Payment (Called after eSewa callback)
export const verifyPayment = asyncHandler(async (req, res) => {
  const { oid, amt, refId } = req.query;

  if (!oid || !amt || !refId) {
    throw new ApiError(400, 'Missing payment verification parameters');
  }

  // Find payment record
  const payment = await Payment.findOne({ transactionId: oid });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  // Check if already verified
  if (payment.status === 'success') {
    return res.status(200).json(
      new ApiResponse(200, payment, 'Payment already verified')
    );
  }

  try {
    // Verify with eSewa
    const verifyUrl = process.env.ESEWA_VERIFY_URL || 'https://uat.esewa.com.np/epay/transrec';
    const verifyData = {
      amt: amt,
      rid: refId,
      pid: oid,
      scd: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST'
    };

    const response = await axios.get(verifyUrl, {
      params: verifyData,
      timeout: 10000
    });

    // Check if verification successful
    // eSewa returns XML with <response_code>Success</response_code>
    const isSuccess = response.data.includes('<response_code>Success</response_code>');

    if (isSuccess) {
      // Update payment status
      payment.status = 'success';
      payment.esewaRefId = refId;
      payment.esewaResponse = {
        verificationResponse: response.data,
        verifiedAt: new Date()
      };
      await payment.save();

      // Handle post-payment actions based on purpose
      await handlePostPayment(payment);

      res.status(200).json(
        new ApiResponse(200, payment, 'Payment verified successfully')
      );
    } else {
      payment.status = 'failed';
      payment.esewaResponse = {
        verificationResponse: response.data,
        verifiedAt: new Date()
      };
      await payment.save();

      throw new ApiError(400, 'Payment verification failed');
    }
  } catch (error) {
    payment.status = 'failed';
    payment.esewaResponse = {
      error: error.message,
      verifiedAt: new Date()
    };
    await payment.save();

    throw new ApiError(500, `Payment verification error: ${error.message}`);
  }
});

// Handle post-payment actions
const handlePostPayment = async (payment) => {
  switch (payment.purpose) {
    case 'course':
      // Grant access to course and credit teacher
      if (payment.purposeId) {
        const course = await Course.findById(payment.purposeId).populate('uploadedBy');
        if (course && course.uploadedBy) {
          // Credit teacher balance
          await creditTeacherBalance(course.uploadedBy._id, payment.amount, payment._id);
        }
      }
      break;
    
    case 'meeting':
      // Mark meeting as paid and credit teacher
      if (payment.purposeId) {
        const { Meeting } = await import("../models/meeting.model.js");
        const meeting = await Meeting.findById(payment.purposeId).populate('teacherId');
        if (meeting && meeting.teacherId) {
          // Update meeting payment status
          meeting.isPaid = true;
          meeting.paymentId = payment._id;
          meeting.paymentStatus = 'completed';
          await meeting.save();
          
          // Credit teacher balance
          await creditTeacherBalance(meeting.teacherId._id, payment.amount, payment._id);
        }
      }
      break;
    
    case 'consultation':
      // Confirm meeting/appointment and credit teacher
      // You'll need to get teacher ID from appointment
      // await creditTeacherBalance(teacherId, payment.amount, payment._id);
      break;
    
    case 'subscription':
      // Activate premium subscription
      // Update user subscription status
      break;
    
    default:
      // No specific action needed
      break;
  }
};

// Credit teacher balance after successful payment
const creditTeacherBalance = async (teacherId, amount, paymentId) => {
  try {
    // Find or create teacher balance
    let balance = await TeacherBalance.findOne({ teacher: teacherId });
    
    if (!balance) {
      balance = await TeacherBalance.create({
        teacher: teacherId,
        commissionRate: 20 // Default 20% commission
      });
    }
    
    // Add earnings (automatically deducts commission)
    const breakdown = await balance.addEarnings(amount, paymentId);
    
    console.log(`✅ Credited teacher ${teacherId}:`, breakdown);
    
    return breakdown;
  } catch (error) {
    console.error('Error crediting teacher balance:', error);
    // Don't throw error - payment is already successful
  }
};

// Get Payment History
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, purpose, page = 1, limit = 10 } = req.query;

  const query = { user: userId };
  if (status) query.status = status;
  if (purpose) query.purpose = purpose;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('purposeId');

  const count = await Payment.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    }, 'Payment history retrieved successfully')
  );
});

// Get Single Payment
export const getPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findOne({
    transactionId,
    user: userId
  }).populate('purposeId');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  res.status(200).json(
    new ApiResponse(200, payment, 'Payment retrieved successfully')
  );
});

// Admin: Get All Payments
export const getAllPayments = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin only.');
  }

  const { status, purpose, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (purpose) query.purpose = purpose;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('user', 'name email')
    .populate('purposeId');

  const count = await Payment.countDocuments(query);

  // Calculate statistics
  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
      statistics: stats
    }, 'All payments retrieved successfully')
  );
});

// Admin: Refund Payment
export const refundPayment = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin only.');
  }

  const { transactionId } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status !== 'success') {
    throw new ApiError(400, 'Only successful payments can be refunded');
  }

  // Update payment status
  payment.status = 'refunded';
  payment.metadata = {
    ...payment.metadata,
    refundReason: reason,
    refundedAt: new Date(),
    refundedBy: req.user._id
  };
  await payment.save();

  // Note: Actual refund process with eSewa needs to be done manually
  // or through their merchant portal

  res.status(200).json(
    new ApiResponse(200, payment, 'Payment marked as refunded')
  );
});
