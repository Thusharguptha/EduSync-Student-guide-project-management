import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    instructions: { type: String },
    attachments: [{ type: String }],
    isActive: { type: Boolean, default: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // specific students or empty for all
    category: { type: String, enum: ['project', 'assignment', 'milestone'], default: 'assignment' }
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
