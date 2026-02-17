// Script to check user payment details in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

dotenv.config();

const checkUserPaymentDetails = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by name
    const userName = 'Anil Sahani'; // Change this to the teacher's name
    const user = await User.findOne({ 
      fullName: { $regex: userName, $options: 'i' } 
    }).select('fullName email role esewaId esewaQRCode');

    if (!user) {
      console.log('❌ User not found:', userName);
      process.exit(1);
    }

    console.log('\n📊 User Payment Details:');
    console.log('========================');
    console.log('Name:', user.fullName);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('eSewa ID:', user.esewaId || '(not set)');
    console.log('QR Code:', user.esewaQRCode ? `${user.esewaQRCode.substring(0, 50)}...` : '(not set)');
    console.log('Has eSewa ID:', !!user.esewaId);
    console.log('Has QR Code:', !!user.esewaQRCode);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUserPaymentDetails();
