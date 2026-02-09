import MilestoneTemplate from '../models/MilestoneTemplate.js';
import Progress from '../models/Progress.js';
import { initializeMilestonesWithLocking, calculateMilestoneDueDates } from '../utils/milestoneAutomation.js';

// Get all available templates (default + teacher's custom)
export const getTemplates = async (req, res) => {
    try {
        const templates = await MilestoneTemplate.find({
            $or: [
                { isDefault: true },
                { createdBy: req.user._id },
                { isPublic: true }
            ]
        }).sort({ isDefault: -1, createdAt: -1 });

        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    }
};

// Create custom template
export const createTemplate = async (req, res) => {
    try {
        const { name, description, category, milestones } = req.body;

        const template = await MilestoneTemplate.create({
            name,
            description,
            category,
            milestones,
            createdBy: req.user._id,
            isPublic: false
        });

        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error creating template', error: error.message });
    }
};

// Update template
export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await MilestoneTemplate.findOneAndUpdate(
            { _id: id, createdBy: req.user._id }, // Only update own templates
            req.body,
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ message: 'Template not found or unauthorized' });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error updating template', error: error.message });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await MilestoneTemplate.findOneAndDelete({
            _id: id,
            createdBy: req.user._id,
            isDefault: false // Can't delete system templates
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found or unauthorized' });
        }

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting template', error: error.message });
    }
};

// Apply template to student (create progress)
export const applyTemplateToStudent = async (req, res) => {
    try {
        const { studentId, templateId, projectDueDate } = req.body;

        const template = await MilestoneTemplate.findById(templateId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Initialize milestones with sequential locking
        let milestones = initializeMilestonesWithLocking(template.milestones);

        // Calculate due dates if project deadline provided
        if (projectDueDate) {
            milestones = calculateMilestoneDueDates(projectDueDate, milestones);
        }

        // Check if progress already exists
        let progress = await Progress.findOne({ studentId });

        if (progress) {
            // Update existing progress
            progress.milestones = milestones;
            progress.templateId = templateId;
            progress.customTemplate = false;
            progress.overallProgress = 0;
            await progress.save();
        } else {
            // Create new progress
            progress = await Progress.create({
                studentId,
                milestones,
                templateId,
                customTemplate: false
            });
        }

        res.status(201).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Error applying template', error: error.message });
    }
};

// Update student milestones (custom edit)
export const updateStudentMilestones = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { milestones } = req.body;

        const progress = await Progress.findOne({ studentId });
        if (!progress) {
            return res.status(404).json({ message: 'Progress not found' });
        }

        progress.milestones = milestones;
        progress.customTemplate = true; // Mark as customized
        await progress.save();

        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Error updating milestones', error: error.message });
    }
};
