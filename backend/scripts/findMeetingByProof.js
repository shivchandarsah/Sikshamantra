// Script to find meeting by payment proof
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Meeting } from '../models/meeting.model.js';

dotenv.config();

const findMeetingByProof = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const transactionId = 'TXI1771314156936L65U8K1VJ';
    
    const meeting = await Meeting.findOne({ paymentProof: transactionId })
      .populate('studentId', 'fullName email')
      .populate('teacherId', 'fullName email');
    
    if (meeting) {
      console.log('📊 Meeting Found:');
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
      console.log('Scheduled Time:', meeting.scheduledTime);
      console.log('Created At:', meeting.createdAt);
      console.log('\n');

      if (meeting.paymentStatus === 'paid_awaiting_confirmation') {
        console.log('⚠️  Payment is awaiting teacher confirmation!');
        console.log('Teacher needs to confirm the payment to complete the transaction.');
      } else if (meeting.paymentStatus === 'completed') {
        console.log('✅ Payment has been confirmed');
      }
    } else {
      console.log('❌ No meeting found with payment proof:', transactionId);
      
      // Search for any meetings with similar proof
      const allMeetings = await Meeting.find({ 
        paymentProof: { $exists: true, $ne: null } 
      }).select('paymentProof paymentStatus subject');
      
      console.log('\n📋 All meetings with payment proof:');
      allMeetings.forEach(m => {
        console.log(`- ${m.subject}: ${m.paymentProof} (${m.paymentStatus})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findMeetingByProof();
