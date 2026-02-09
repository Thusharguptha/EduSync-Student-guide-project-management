import mongoose from 'mongoose';

const logEntrySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    week: { type: Number },
    workDone: { type: String },
    issues: { type: String },
    nextSteps: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('LogEntry', logEntrySchema);
