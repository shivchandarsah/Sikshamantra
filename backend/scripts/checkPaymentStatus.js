// Script to check payment and meeting status
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Meeting } from '../models/meeting.model.js';
import Payment from '../models/payment.model.js';
import TeacherBalance from '../models/teacherBalance.model.js';

dotenv.config();

const checkPaymentStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the payment with transaction ID from screenshot
    const transactionId = 'TXI1771314156936L65U8K1VJ';
    
    const payment = await Payment.findOne({ transactionId })
      .populate('user', 'fullName email role');
    
    if (payment) {
      console.log('📊 Payment Record:');
      console.log('========================');
      console.log('Transaction ID:', payment.transactionId);
      console.log('User:', payment.user?.fullName, `(${payment.user?.role})`);
      console.log('Amount:', payment.amount);
      console.log('Purpose:', payment.purpose);
      console.log('Status:', payment.status);
      console.log('Created:', payment.createdAt);
      console.log('Purpose ID (Meeting):', payment.purposeId);
      console.log('\n');
    } else {
      console.log('❌ Payment not found with transaction ID:', transactionId);
      console.log('\n');
    }

    // Find the meeting
    if (payment?.purposeId) {
      const meeting = await Meeting.findById(payment.purposeId)
        .populate('studentId', 'fullName email')
        .populate('teacherId', 'fullName email');
      
      if (meeting) {
        console.log('📊 Meeting Record:');
        console.log('========================');
        console.log('Meeting ID:', meeting._id);
        console.log('Subject:', meeting.subject);
        console.log('Student:', meeting.studentId?.fullName);
        console.log('Teacher:', meeting.teacherId?.fullName);
        console.log('Price:', meeting.price);
        console.log('Status:', meeting.status);
        console.log('Payment Status:', meeting.paymentStatus);
        console.log('Is Paid:', meeting.isPaid);
        console.log('Payment Proof:', meeting.paymentProof);
        console.log('Payment Confirmed By:', meeting.paymentConfirmedBy);
        console.log('Payment Confirmed At:', meeting.paymentConfirmedAt);
        console.log('\n');

        // Check teacher balance
        if (meeting.teacherId) {
          const teacherBalance = await TeacherBalance.findOne({ 
            teacher: meeting.teacherId._id 
          });
          
          if (teacherBalance) {
            console.log('📊 Teacher Balance:');
            console.log('========================');
            console.log('Total Earnings:', teacherBalance.totalEarnings);
            console.log('Available Balance:', teacherBalance.availableBalance);
            console.log('Pending Balance:', teacherBalance.pendingBalance);
            console.log('\n');
          } else {
            console.log('❌ No teacher balance record found\n');
          }
        }
      }
    }

    // Check all payments for this user
    if (payment?.user) {
      const allPayments = await Payment.find({ user: payment.user._id });
      console.log('📊 All Payments for User:');
      console.log('========================');
      console.log('Total Payments:', allPayments.length);
      console.log('Successful:', allPayments.filter(p => p.status === 'success').length);
      console.log('Pending:', allPayments.filter(p => p.status === 'pending').length);
      console.log('Failed:', allPayments.filter(p => p.status === 'failed').length);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPaymentStatus();
