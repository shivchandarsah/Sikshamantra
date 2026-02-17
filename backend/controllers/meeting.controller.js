import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import meetingSummaryService from "../services/meetingSummary.service.js";
import crypto from "crypto";

/* =====================================================
   🎥 GENERATE MEETING LINK
===================================================== */
const generateMeetingLink = asyncHandler(async (req, res) => {
  console.log('🎥 Generate Meeting Link Request:', {
    body: req.body,
    user: req.user ? { id: req.user._id, name: req.user.fullName, role: req.user.role } : 'NO USER'
  });

  const { studentId, teacherId, subject, scheduledTime, price } = req.body;
  
  if (!studentId || !teacherId || !subject) {
    console.error('❌ Missing required fields:', { studentId, teacherId, subject });
    throw new ApiError(400, "Student ID, Teacher ID, and subject are required");
  }

  // Verify that both users exist
  const [student, teacher] = await Promise.all([
    User.findById(studentId),
    User.findById(teacherId)
  ]);

  if (!student || !teacher) {
    console.error('❌ User not found:', { student: !!student, teacher: !!teacher });
    throw new ApiError(404, "Student or Teacher not found");
  }

  if (student.role !== 'student' || teacher.role !== 'teacher') {
    console.error('❌ Invalid roles:', { studentRole: student.role, teacherRole: teacher.role });
    throw new ApiError(400, "Invalid user roles");
  }

  // Generate unique room ID
  const roomId = `educonnect-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  
  // Create Jitsi Meet URL
  const meetingUrl = `https://meet.jit.si/${roomId}`;
  
  // Parse scheduled time or default to now
  const meetingTime = scheduledTime ? new Date(scheduledTime) : new Date();
  
  // Parse price (default to 0 if not provided)
  const meetingPrice = parseFloat(price) || 0;
  
  console.log('✅ Creating meeting:', {
    roomId,
    meetingUrl,
    studentId,
    teacherId,
    subject,
    scheduledTime: meetingTime,
    price: meetingPrice
  });

  // Create meeting in database
  const meeting = await Meeting.create({
    roomId,
    meetingUrl,
    studentId,
    teacherId,
    subject,
    scheduledTime: meetingTime,
    createdBy: req.user._id,
    status: scheduledTime ? 'scheduled' : 'active',
    price: meetingPrice,
    paymentStatus: meetingPrice > 0 ? 'pending' : 'not_required'
  });

  // Populate user details
  await meeting.populate([
    { path: 'studentId', select: 'fullName email' },
    { path: 'teacherId', select: 'fullName email' },
    { path: 'createdBy', select: 'fullName email' }
  ]);

  console.log('✅ Meeting created successfully:', meeting._id);

  // Create notification for the recipient (the user who didn't create the meeting)
  try {
    const recipientId = req.user._id.toString() === studentId ? teacherId : studentId;
    const recipient = req.user._id.toString() === studentId ? teacher : student;
    const creator = req.user;

    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: "meeting",
      title: "Meeting Invitation",
      message: `${creator.fullName} invited you to a meeting: ${subject}${meetingPrice > 0 ? ` (Fee: NPR ${meetingPrice})` : ''}`,
      data: {
        meetingId: meeting._id,
        roomId: meeting.roomId,
        meetingUrl: meeting.meetingUrl,
        subject: subject,
        scheduledTime: meetingTime,
        price: meetingPrice
      },
      actionUrl: recipient.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'
    });
    
    console.log('✅ Notification created for recipient:', recipientId);
  } catch (notificationError) {
    console.error("Failed to create meeting notification:", notificationError);
    // Don't fail the meeting creation if notification fails
  }

  return res.status(200).json(
    new ApiResponse(200, meeting, "Meeting link generated successfully")
  );
});

/* =====================================================
   🎥 JOIN MEETING
===================================================== */
const joinMeeting = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  
  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  // Create join URL with user info
  const userName = req.user.fullName.replace(/\s+/g, '_');
  const meetingUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="${userName}"`;
  
  return res.status(200).json(
    new ApiResponse(200, { meetingUrl, roomId }, "Meeting join link generated")
  );
});

/* =====================================================
   🎥 GET MEETING DETAILS
===================================================== */
const getMeetingDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  // Find meeting in database
  const meeting = await Meeting.findOne({ roomId })
    .populate([
      { path: 'studentId', select: 'fullName email' },
      { path: 'teacherId', select: 'fullName email' },
      { path: 'createdBy', select: 'fullName email' }
    ]);
  
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  return res.status(200).json(
    new ApiResponse(200, meeting, "Meeting details retrieved")
  );
});

/* =====================================================
   🔔 GET UPCOMING MEETINGS FOR USER
===================================================== */
const getUpcomingMeetings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get meetings where user is either student or teacher
  const meetings = await Meeting.find({
    $or: [
      { studentId: userId },
      { teacherId: userId }
    ],
    scheduledTime: { $gte: new Date() },
    status: { $in: ['scheduled', 'active'] }
  })
  .populate([
    { path: 'studentId', select: 'fullName email profilePicture' },
    { path: 'teacherId', select: 'fullName email profilePicture esewaId esewaQRCode' },
    { path: 'createdBy', select: 'fullName email' }
  ])
  .sort({ scheduledTime: 1 })
  .limit(10);

  return res.status(200).json(
    new ApiResponse(200, meetings, "Upcoming meetings retrieved")
  );
});

/* =====================================================
   📚 GET PAST/COMPLETED MEETINGS FOR USER
===================================================== */
const getPastMeetings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get meetings where user is either student or teacher and meeting is in the past
  const meetings = await Meeting.find({
    $or: [
      { studentId: userId },
      { teacherId: userId }
    ],
    $or: [
      { scheduledTime: { $lt: new Date() } },
      { status: { $in: ['completed', 'cancelled'] } }
    ]
  })
  .populate([
    { path: 'studentId', select: 'fullName email profilePicture' },
    { path: 'teacherId', select: 'fullName email profilePicture esewaId esewaQRCode' },
    { path: 'createdBy', select: 'fullName email' }
  ])
  .sort({ scheduledTime: -1 }) // Most recent first
  .limit(50); // Limit to last 50 meetings

  return res.status(200).json(
    new ApiResponse(200, meetings, "Past meetings retrieved")
  );
});

/* =====================================================
   📋 GET ALL MEETINGS FOR USER
===================================================== */
const getAllMeetings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  
  // Get all meetings where user is either student or teacher
  const meetings = await Meeting.find({
    $or: [
      { studentId: userId },
      { teacherId: userId }
    ]
  })
  .populate([
    { path: 'studentId', select: 'fullName email profilePicture' },
    { path: 'teacherId', select: 'fullName email profilePicture esewaId esewaQRCode' },
    { path: 'createdBy', select: 'fullName email' }
  ])
  .sort({ scheduledTime: -1 }) // Most recent first
  .limit(limit * 1)
  .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Meeting.countDocuments({
    $or: [
      { studentId: userId },
      { teacherId: userId }
    ]
  });

  return res.status(200).json(
    new ApiResponse(200, {
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, "All meetings retrieved")
  );
});

/* =====================================================
   ✅ UPDATE MEETING STATUS
===================================================== */
const updateMeetingStatus = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { status, notes, meetingData, paymentProof, paymentStatus } = req.body;
  
  if (!status || !['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
    throw new ApiError(400, "Valid status is required (scheduled, active, completed, cancelled)");
  }

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user has permission to update this meeting
  const userId = req.user._id.toString();
  if (meeting.studentId.toString() !== userId && 
      meeting.teacherId.toString() !== userId && 
      meeting.createdBy.toString() !== userId) {
    throw new ApiError(403, "You don't have permission to update this meeting");
  }

  // Prepare update object
  const updateData = { 
    status,
    ...(notes && { notes }),
    ...(status === 'completed' && { completedAt: new Date() }),
    ...(paymentProof && { paymentProof }),
    ...(paymentStatus && { paymentStatus })
  };

  // Update meeting
  const updatedMeeting = await Meeting.findByIdAndUpdate(
    meetingId,
    updateData,
    { new: true }
  ).populate([
    { path: 'studentId', select: 'fullName email' },
    { path: 'teacherId', select: 'fullName email' },
    { path: 'createdBy', select: 'fullName email' }
  ]);

  // 📢 Create review notifications when meeting is completed
  if (status === 'completed') {
    try {
      // Notify teacher to review student
      await Notification.create({
        recipient: meeting.teacherId,
        sender: meeting.studentId,
        type: "meeting",
        title: "Rate Your Meeting",
        message: `Please rate your meeting "${meeting.subject}" with ${meeting.studentId.fullName}`,
        data: {
          meetingId: meeting._id,
          action: 'review',
          subject: meeting.subject
        },
        actionUrl: '/meetings'
      });

      // Notify student to review teacher
      await Notification.create({
        recipient: meeting.studentId,
        sender: meeting.teacherId,
        type: "meeting",
        title: "Rate Your Meeting",
        message: `Please rate your meeting "${meeting.subject}" with ${meeting.teacherId.fullName}`,
        data: {
          meetingId: meeting._id,
          action: 'review',
          subject: meeting.subject
        },
        actionUrl: '/meetings'
      });

      console.log('✅ Review notifications created for both participants');
    } catch (notificationError) {
      console.error('❌ Failed to create review notifications:', notificationError);
      // Don't fail the meeting update if notification creation fails
    }
  }

  // 🤖 Generate AI summary when meeting is completed
  if (status === 'completed' && meetingData) {
    console.log('🤖 Starting AI summary generation...');
    console.log('📊 Meeting data received:', {
      hasChatMessages: !!meetingData.chatMessages,
      chatMessagesCount: meetingData.chatMessages?.length || 0,
      hasWhiteboardContent: !!meetingData.whiteboardContent,
      hasParticipants: !!meetingData.participants,
      participantsCount: meetingData.participants?.length || 0
    });
    
    try {
      // Calculate duration
      const startTime = meeting.scheduledTime || meeting.createdAt;
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes

      console.log('⏱️ Meeting duration:', duration, 'minutes');

      // Prepare meeting data for summary
      const summaryData = {
        teacherId: meeting.teacherId._id,
        studentIds: [meeting.studentId._id],
        teacher: meeting.teacherId.fullName,
        subject: meeting.subject,
        duration: duration,
        startTime: startTime,
        endTime: endTime,
        chatMessages: meetingData.chatMessages || [],
        whiteboardContent: meetingData.whiteboardContent || '',
        participants: [
          `${meeting.teacherId.fullName} (Teacher)`,
          `${meeting.studentId.fullName} (Student)`
        ]
      };

      console.log('📝 Summary data prepared:', {
        subject: summaryData.subject,
        duration: summaryData.duration,
        chatMessagesCount: summaryData.chatMessages.length,
        hasWhiteboardContent: !!summaryData.whiteboardContent
      });

      // Generate summary asynchronously (don't wait)
      meetingSummaryService.createMeetingSummary(meetingId, summaryData)
        .then(summary => {
          console.log('✅ Meeting summary generated successfully:', summary._id);
          // Send emails asynchronously
          return meetingSummaryService.sendSummaryEmail(summary._id);
        })
        .then(() => {
          console.log('✅ Summary emails sent successfully to teacher and student');
        })
        .catch(err => {
          console.error('❌ Error in AI summary generation or email sending:');
          console.error('   Error message:', err.message);
          console.error('   Error stack:', err.stack);
          
          // Create notification for admin about the failure
          Notification.create({
            recipient: meeting.teacherId,
            type: "system",
            title: "AI Summary Generation Failed",
            message: `Failed to generate AI summary for meeting "${meeting.subject}". Error: ${err.message}`,
            data: { meetingId: meeting._id }
          }).catch(notifErr => console.error('Failed to create error notification:', notifErr));
        });
    } catch (error) {
      console.error('❌ Error preparing meeting summary:');
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      // Don't fail the status update if summary generation fails
    }
  } else {
    if (status === 'completed' && !meetingData) {
      console.log('⚠️ Meeting marked as completed but no meetingData provided');
      console.log('   AI summary will not be generated');
      console.log('   Meeting ID:', meetingId);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, updatedMeeting, `Meeting status updated to ${status}`)
  );
});

/* =====================================================
   👥 RECORD PARTICIPANT JOIN/LEAVE
===================================================== */
const recordParticipantActivity = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { action } = req.body; // 'join' or 'leave'
  
  if (!action || !['join', 'leave'].includes(action)) {
    throw new ApiError(400, "Valid action is required (join or leave)");
  }

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  const userId = req.user._id;
  
  // Find existing participant record or create new one
  let participantIndex = meeting.participants.findIndex(
    p => p.userId.toString() === userId.toString()
  );

  if (action === 'join') {
    if (participantIndex === -1) {
      // Add new participant
      meeting.participants.push({
        userId,
        joinedAt: new Date()
      });
    } else {
      // Update join time if rejoining
      meeting.participants[participantIndex].joinedAt = new Date();
      meeting.participants[participantIndex].leftAt = undefined;
    }
    
    // Update meeting status to active if it's the first participant
    if (meeting.status === 'scheduled') {
      meeting.status = 'active';
    }
  } else if (action === 'leave') {
    if (participantIndex !== -1) {
      meeting.participants[participantIndex].leftAt = new Date();
    }
  }

  await meeting.save();

  return res.status(200).json(
    new ApiResponse(200, meeting, `Participant ${action} recorded`)
  );
});

/* =====================================================
   🔔 GET MEETINGS NEEDING REMINDERS
===================================================== */
const getMeetingsForReminders = asyncHandler(async (req, res) => {
  const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  
  // Find meetings scheduled in the next 10 minutes that haven't had reminders sent
  const meetings = await Meeting.find({
    scheduledTime: {
      $gte: fiveMinutesFromNow,
      $lte: tenMinutesFromNow
    },
    reminderSent: false,
    status: 'scheduled'
  })
  .populate([
    { path: 'studentId', select: 'fullName email' },
    { path: 'teacherId', select: 'fullName email' }
  ]);

  return res.status(200).json(
    new ApiResponse(200, meetings, "Meetings needing reminders retrieved")
  );
});

/* =====================================================
   🔔 MARK REMINDER AS SENT
===================================================== */
const markReminderSent = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { reminderType } = req.body; // '15-minute', '10-minute', or '5-minute'
  
  if (!reminderType || !['15-minute', '10-minute', '5-minute'].includes(reminderType)) {
    throw new ApiError(400, "Valid reminder type is required (15-minute, 10-minute, or 5-minute)");
  }

  const updateField = {};
  if (reminderType === '15-minute') {
    updateField['reminders.fifteenMinute.sent'] = true;
    updateField['reminders.fifteenMinute.sentAt'] = new Date();
  } else if (reminderType === '10-minute') {
    updateField['reminders.tenMinute.sent'] = true;
    updateField['reminders.tenMinute.sentAt'] = new Date();
  } else if (reminderType === '5-minute') {
    updateField['reminders.fiveMinute.sent'] = true;
    updateField['reminders.fiveMinute.sentAt'] = new Date();
  }

  const meeting = await Meeting.findByIdAndUpdate(
    meetingId,
    updateField,
    { new: true }
  );

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  return res.status(200).json(
    new ApiResponse(200, meeting, `${reminderType} reminder marked as sent`)
  );
});

/* =====================================================
   💰 CONFIRM PAYMENT (TEACHER ONLY)
/* =====================================================
   💰 CONFIRM PAYMENT (TEACHER ONLY)
===================================================== */
const confirmPayment = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId)
    .populate('studentId', 'fullName email')
    .populate('teacherId', 'fullName email');

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Only teacher can confirm payment
  if (meeting.teacherId._id.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the teacher can confirm payment");
  }

  // Check if payment is awaiting confirmation
  if (meeting.paymentStatus !== 'paid_awaiting_confirmation') {
    throw new ApiError(400, "Payment is not awaiting confirmation");
  }

  // Import models
  const Payment = (await import('../models/payment.model.js')).default;
  const TeacherBalance = (await import('../models/teacherBalance.model.js')).default;
  const { Notification } = await import('../models/notification.model.js');

  // Check if payment record already exists (by meeting or by transaction ID)
  let studentPayment = await Payment.findOne({
    $or: [
      { user: meeting.studentId._id, purposeId: meeting._id, purpose: 'meeting' },
      { transactionId: meeting.paymentProof }
    ]
  });

  if (studentPayment) {
    // Update existing payment record
    console.log('✅ Found existing payment record, updating...');
    studentPayment.status = 'success';
    studentPayment.esewaRefId = meeting.paymentProof;
    studentPayment.user = meeting.studentId._id;
    studentPayment.purposeId = meeting._id;
    studentPayment.purpose = 'meeting';
    studentPayment.amount = meeting.price;
    studentPayment.metadata = {
      ...studentPayment.metadata,
      meetingId: meeting._id,
      teacherId: meeting.teacherId._id,
      subject: meeting.subject,
      confirmedAt: new Date()
    };
    await studentPayment.save();
    console.log('✅ Updated existing payment record');
  } else {
    // Create new payment record with unique transaction ID
    const transactionId = meeting.paymentProof || `MEETING-${meeting._id}-${Date.now()}`;
    
    console.log('✅ Creating new payment record with transaction ID:', transactionId);
    
    try {
      studentPayment = await Payment.create({
        transactionId: transactionId,
        user: meeting.studentId._id,
        amount: meeting.price,
        purpose: 'meeting',
        purposeId: meeting._id,
        status: 'success',
        paymentMethod: 'esewa',
        esewaRefId: meeting.paymentProof,
        metadata: {
          meetingId: meeting._id,
          teacherId: meeting.teacherId._id,
          subject: meeting.subject,
          confirmedAt: new Date()
        }
      });
      console.log('✅ Created new payment record');
    } catch (error) {
      // If duplicate key error, try to find and update the existing record
      if (error.code === 11000) {
        console.log('⚠️ Duplicate transaction ID detected, finding existing payment...');
        studentPayment = await Payment.findOne({ transactionId: transactionId });
        if (studentPayment) {
          studentPayment.status = 'success';
          studentPayment.user = meeting.studentId._id;
          studentPayment.purposeId = meeting._id;
          studentPayment.purpose = 'meeting';
          studentPayment.amount = meeting.price;
          studentPayment.esewaRefId = meeting.paymentProof;
          studentPayment.metadata = {
            ...studentPayment.metadata,
            meetingId: meeting._id,
            teacherId: meeting.teacherId._id,
            subject: meeting.subject,
            confirmedAt: new Date()
          };
          await studentPayment.save();
          console.log('✅ Updated existing payment record after duplicate error');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  // Get or create teacher balance
  let teacherBalance = await TeacherBalance.findOne({ teacher: meeting.teacherId._id });
  if (!teacherBalance) {
    teacherBalance = await TeacherBalance.create({
      teacher: meeting.teacherId._id,
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      withdrawnAmount: 0,
      commissionRate: 20
    });
  }

  // Add earnings to teacher balance (80% of payment)
  const breakdown = await teacherBalance.addEarnings(meeting.price, studentPayment._id);

  // Update meeting payment status
  meeting.paymentStatus = 'completed';
  meeting.isPaid = true;
  meeting.paymentConfirmedBy = userId;
  meeting.paymentConfirmedAt = new Date();
  meeting.paymentId = studentPayment._id;
  await meeting.save();

  // Create notification for student
  try {
    await Notification.create({
      recipient: meeting.studentId._id,
      sender: userId,
      type: "meeting",
      title: "Payment Confirmed",
      message: `Your payment of NPR ${meeting.price} for "${meeting.subject}" has been confirmed by ${meeting.teacherId.fullName}`,
      data: {
        meetingId: meeting._id,
        action: 'payment_confirmed',
        amount: meeting.price,
        transactionId: studentPayment.transactionId
      },
      actionUrl: '/student/payment-history'
    });
  } catch (notificationError) {
    console.error('❌ Failed to create payment confirmation notification:', notificationError);
  }

  console.log('✅ Payment confirmed:', {
    meetingId: meeting._id,
    amount: meeting.price,
    teacherShare: breakdown.teacherShare,
    commission: breakdown.commission,
    paymentId: studentPayment._id
  });

  return res.status(200).json(
    new ApiResponse(200, {
      meeting,
      payment: studentPayment,
      earnings: breakdown
    }, "Payment confirmed successfully")
  );
});

export {
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
};