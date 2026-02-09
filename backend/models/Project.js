import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    abstract: { type: String },
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected', 'completed'], default: 'draft' },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: { type: String },
    grade: { type: String },
    feedback: { type: String },
    submittedAt: { type: Date },
    dueDate: { type: Date },
    similarityScore: { type: Number, default: 0 },
    progressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Progress' },
    panelMarks: [{
      panelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel' },
      memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: { type: Number, min: 0, max: 100 }
    }]
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
