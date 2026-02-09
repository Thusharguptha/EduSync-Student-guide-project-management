import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    milestones: [{
      title: { type: String, required: true },
      description: { type: String },
      dueDate: { type: Date },
      completedAt: { type: Date },
      status: { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
      progress: { type: Number, min: 0, max: 100, default: 0 },
      notes: { type: String },
      locked: { type: Boolean, default: false }, // NEW: For sequential unlocking
      order: { type: Number }, // NEW: Milestone order
      fileUrl: { type: String }, // NEW: Document upload for each milestone
      approvedByTeacher: { type: Boolean, default: false } // NEW: Teacher approval flag
    }],
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'MilestoneTemplate' }, // NEW: Template reference
    customTemplate: { type: Boolean, default: false }, // NEW: Flag if milestones were customized
    overallProgress: { type: Number, min: 0, max: 100, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Progress', progressSchema);
