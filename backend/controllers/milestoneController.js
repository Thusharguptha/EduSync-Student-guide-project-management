// NEW: Approve milestone document submitted by student
export const approveMilestoneDocument = async (req, res) => {
    try {
        const { studentId, milestoneIndex } = req.body;

        const progress = await Progress.findOne({ studentId });
        if (!progress) {
            return res.status(404).json({ message: 'Progress not found' });
        }

        if (milestoneIndex < 0 || milestoneIndex >= progress.milestones.length) {
            return res.status(400).json({ message: 'Invalid milestone index' });
        }

        const milestone = progress.milestones[milestoneIndex];

        // Check if document has been uploaded
        if (!milestone.fileUrl) {
            return res.status(400).json({ message: 'No document uploaded for this milestone yet' });
        }

        // Approve the document
        milestone.approvedByTeacher = true;
        await progress.save();

        res.json({ message: 'Milestone document approved successfully', progress });
    } catch (error) {
        res.status(500).json({ message: 'Error approving milestone', error: error.message });
    }
};
