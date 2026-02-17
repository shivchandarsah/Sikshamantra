import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import { User } from '../models/user.model.js';
import { Student } from '../models/student.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Post } from '../models/post.model.js';
import { Offer } from '../models/Offer.model.js';
import { Course } from '../models/course.model.js';
import { Meeting } from '../models/meeting.model.js';

async function verifyDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Database Status:\n');

    const users = await User.find({});
    console.log(`Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    const students = await Student.countDocuments();
    const teachers = await Teacher.countDocuments();
    const posts = await Post.countDocuments();
    const offers = await Offer.countDocuments();
    const courses = await Course.countDocuments();
    const meetings = await Meeting.countDocuments();

    console.log(`\nStudents: ${students}`);
    console.log(`Teachers: ${teachers}`);
    console.log(`Posts: ${posts}`);
    console.log(`Offers: ${offers}`);
    console.log(`Courses: ${courses}`);
    console.log(`Meetings: ${meetings}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyDatabase();
