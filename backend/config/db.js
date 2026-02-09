import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB || 'edusync'
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connection error', err.message);
    process.exit(1);
  }
};

export default connectDB;
