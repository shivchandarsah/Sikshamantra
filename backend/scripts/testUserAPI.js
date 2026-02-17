import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

dotenv.config();

const testUserAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Prince sah (student)
    const student = await User.findOne({ email: 'princesah440@gmail.com' });
    
    if (student) {
      console.log('👤 Student User Data:');
      console.log('Name:', student.fullName);
      console.log('Email:', student.email);
      console.log('Role:', student.role);
      console.log('Average Rating:', student.averageRating);
      console.log('Total Reviews:', student.totalReviews);
      console.log('\n');
    }

    // Find Anil sahani (teacher)
    const teacher = await User.findOne({ email: 'garibanilsahani@gmail.com' });
    
    if (teacher) {
      console.log('👨‍🏫 Teacher User Data:');
      console.log('Name:', teacher.fullName);
      console.log('Email:', teacher.email);
      console.log('Role:', teacher.role);
      console.log('Average Rating:', teacher.averageRating);
      console.log('Total Reviews:', teacher.totalReviews);
      console.log('\n');
    }

    // Test the select statement used in auth middleware
    console.log('🔍 Testing Auth Middleware Select Statement:');
    const testUser = await User.findById(student._id).select(
      "_id fullName email role isEmailVerified age phoneNumber qualification currentCenter profilePicture averageRating totalReviews esewaId esewaQRCode"
    );
    
    console.log('Selected fields:', {
      _id: testUser._id,
      fullName: testUser.fullName,
      email: testUser.email,
      averageRating: testUser.averageRating,
      totalReviews: testUser.totalReviews
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testUserAPI();
