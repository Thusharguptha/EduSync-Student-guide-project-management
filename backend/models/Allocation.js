import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Allocation', allocationSchema);
