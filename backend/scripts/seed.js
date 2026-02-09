import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Allocation from '../models/Allocation.js';
import Project from '../models/Project.js';

dotenv.config();

const run = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Allocation.deleteMany({}),
    Project.deleteMany({})
  ]);

  // No manual hashing - let User model pre-save hook do it
  const admin = await User.create({ name: 'Admin', email: 'admin@gmail.com', password: 'Admin@123', role: 'admin' });
  const t1 = await User.create({ name: 'Santhosh Katti', email: 'santhosh@gmail.com', password: 'Sant@123', role: 'teacher', department: 'MCA' });
  const t2 = await User.create({ name: 'Niteesh', email: 'niteesh@gmail.com', password: 'Nite@123', role: 'teacher', department: 'MCA' });
  const s1 = await User.create({ name: 'Thushar', email: 'thushar@gmail.com', password: 'Thus@123', role: 'student', department: 'MCA' });
  const s2 = await User.create({ name: 'Gagan', email: 'gagan@gmail.com', password: 'Gaga@123', role: 'student', department: 'MCA' });

  // await Allocation.create({ studentId: s1._id, teacherId: t1._id, assignedBy: admin._id });
  // await Allocation.create({ studentId: s2._id, teacherId: t2._id, assignedBy: admin._id });

  // No sample projects - students start fresh
  // await Project.create({ studentId: s1._id, title: 'AI Chatbot', abstract: 'NLP assistant', status: 'submitted', guideId: t1._id });
  // await Project.create({ studentId: s2._id, title: 'IoT Monitor', abstract: 'Sensor network', status: 'approved', guideId: t2._id });

  console.log('Seed completed');
  await mongoose.connection.close();
};

run();
