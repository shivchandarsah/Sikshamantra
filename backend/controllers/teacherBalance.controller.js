// Teacher Balance Controller
import TeacherBalance from '../models/teacherBalance.model.js';
import Payout from '../models/payout.model.js';
import Payment from '../models/payment.model.js';
import { ApiError } from '../utility/ApiError.js';
import { ApiResponse } from '../utility/ApiResponse.js';
import { asyncHandler } from '../utility/AsyncHandler.js';

// Get teacher balance
export const getTeacherBalance = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  let balance = await TeacherBalance.findOne({ teacher: teacherId });

  // Create balance if doesn't exist
  if (!balance) {
    balance = await TeacherBalance.create({
      teacher: teacherId,
      commissionRate: process.env.PLATFORM_COMMISSION || 20
    });
  }

  res.status(200).json(
    new ApiResponse(200, balance, 'Balance retrieved successfully')
  );
});

// Update payment settings (eSewa ID or bank details)
export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { payoutMethod, esewaId, bankDetails } = req.body;

  if (!payoutMethod || !['esewa', 'bank'].includes(payoutMethod)) {
    throw new ApiError(400, 'Valid payout method is required (esewa or bank)');
  }

  if (payoutMethod === 'esewa' && !esewaId) {
    throw new ApiError(400, 'eSewa ID is required');
  }

  if (payoutMethod === 'bank' && (!bankDetails || !bankDetails.accountNumber)) {
    throw new ApiError(400, 'Bank details are required');
  }

  let balance = await TeacherBalance.findOne({ teacher: teacherId });

  if (!balance) {
    balance = await TeacherBalance.create({
      teacher: teacherId,
      commissionRate: process.env.PLATFORM_COMMISSION || 20
    });
  }

  // Update payment settings
  balance.payoutMethod = payoutMethod;
  
  if (payoutMethod === 'esewa') {
    balance.esewaId = esewaId;
  } else if (payoutMethod === 'bank') {
    balance.bankDetails = bankDetails;
  }

  await balance.save();

  res.status(200).json(
    new ApiResponse(200, balance, 'Payment settings updated successfully')
  );
});

// Get earnings history
export const getEarningsHistory = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  // Get payments where teacher earned money
  const payments = await Payment.find({
    $or: [
      { 'metadata.teacherId': teacherId },
      { purpose: 'course', purposeId: { $exists: true } },
      { purpose: 'meeting', purposeId: { $exists: true } }
    ],
    status: 'success'
  })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('user', 'fullName email')
    .populate('purposeId');

  // Filter payments related to this teacher
  const teacherPayments = [];
  
  for (const payment of payments) {
    let isTeacherPayment = false;
    
    if (payment.purpose === 'course' && payment.purposeId) {
      const { Course } = await import('../models/course.model.js');
      const course = await Course.findById(payment.purposeId);
      if (course && course.uploadedBy.toString() === teacherId.toString()) {
        isTeacherPayment = true;
      }
    } else if (payment.purpose === 'meeting' && payment.purposeId) {
      const { Meeting } = await import('../models/meeting.model.js');
      const meeting = await Meeting.findById(payment.purposeId);
      if (meeting && meeting.teacherId.toString() === teacherId.toString()) {
        isTeacherPayment = true;
      }
    }
    
    if (isTeacherPayment) {
      teacherPayments.push(payment);
    }
  }

  const total = teacherPayments.length;

  res.status(200).json(
    new ApiResponse(200, {
      payments: teacherPayments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }, 'Earnings history retrieved successfully')
  );
});

// Request payout
export const requestPayout = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { amount, requestNote } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Valid amount is required');
  }

  // Get teacher balance
  const balance = await TeacherBalance.findOne({ teacher: teacherId });

  if (!balance) {
    throw new ApiError(404, 'Balance not found');
  }

  // Check if payment method is set
  if (balance.payoutMethod === 'not_set') {
    throw new ApiError(400, 'Please set up your payment method first');
  }

  // Check if sufficient balance
  if (amount > balance.availableBalance) {
    throw new ApiError(400, `Insufficient balance. Available: NPR ${balance.availableBalance}`);
  }

  // Minimum payout amount
  const minPayout = 100;
  if (amount < minPayout) {
    throw new ApiError(400, `Minimum payout amount is NPR ${minPayout}`);
  }

  // Create payout request
  const payout = await Payout.create({
    teacher: teacherId,
    amount,
    method: balance.payoutMethod,
    payoutDetails: {
      esewaId: balance.esewaId,
      bankDetails: balance.bankDetails
    },
    requestNote: requestNote || '',
    status: 'pending'
  });

  // Update balance
  await balance.requestPayout(amount);

  res.status(200).json(
    new ApiResponse(200, payout, 'Payout request submitted successfully')
  );
});

// Get payout history
export const getPayoutHistory = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const query = { teacher: teacherId };
  if (status) query.status = status;

  const payouts = await Payout.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('processedBy', 'fullName email');

  const total = await Payout.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      payouts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }, 'Payout history retrieved successfully')
  );
});

// Cancel payout request (only if pending)
export const cancelPayoutRequest = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { payoutId } = req.params;

  const payout = await Payout.findOne({
    _id: payoutId,
    teacher: teacherId
  });

  if (!payout) {
    throw new ApiError(404, 'Payout request not found');
  }

  if (payout.status !== 'pending') {
    throw new ApiError(400, 'Only pending payout requests can be cancelled');
  }

  // Update payout status
  payout.status = 'cancelled';
  await payout.save();

  // Return amount to available balance
  const balance = await TeacherBalance.findOne({ teacher: teacherId });
  if (balance) {
    await balance.cancelPayout(payout.amount);
  }

  res.status(200).json(
    new ApiResponse(200, payout, 'Payout request cancelled successfully')
  );
});
