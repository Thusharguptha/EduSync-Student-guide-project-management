import mongoose from 'mongoose';

const milestoneTemplateSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ['web', 'mobile', 'research', 'ml', 'iot', 'general'],
            default: 'general'
        },
        milestones: [{
            title: { type: String, required: true },
            description: { type: String, required: true },
            estimatedDays: { type: Number, default: 7 },
            order: { type: Number, required: true }
        }],
        isDefault: { type: Boolean, default: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isPublic: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Index for efficient queries
milestoneTemplateSchema.index({ category: 1, isDefault: 1 });
milestoneTemplateSchema.index({ createdBy: 1 });

export default mongoose.model('MilestoneTemplate', milestoneTemplateSchema);
