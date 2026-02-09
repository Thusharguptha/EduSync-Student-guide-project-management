import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Project from '../models/Project.js';
import Progress from '../models/Progress.js';

dotenv.config();

const clearProjects = async () => {
    await connectDB();

    const deletedProjects = await Project.deleteMany({});
    const deletedProgress = await Progress.deleteMany({});

    console.log(`Deleted ${deletedProjects.deletedCount} projects`);
    console.log(`Deleted ${deletedProgress.deletedCount} progress records`);
    console.log('Database cleared - students can now submit fresh projects');

    await mongoose.connection.close();
};

clearProjects();
