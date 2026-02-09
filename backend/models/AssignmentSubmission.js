import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema(
    {
        assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fileUrl: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['submitted', 'graded', 'returned', 'late'],
            default: 'submitted'
        },
        score: { type: Number, min: 0 },
        maxScore: { type: Number },
        feedback: { type: String },
        gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        gradedAt: { type: Date },
        isLate: { type: Boolean, default: false },
        attemptNumber: { type: Number, default: 1 },
        notes: { type: String }
    },
    { timestamps: true }
);

// Index for efficient queries
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 });
assignmentSubmissionSchema.index({ studentId: 1 });

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
