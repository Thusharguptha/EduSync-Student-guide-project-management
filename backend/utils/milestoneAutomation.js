import Progress from '../models/Progress.js';

/**
 * Auto-complete milestone when triggered by project events
 * @param {ObjectId} studentId - Student's ID
 * @param {Number} milestoneIndex - Index of milestone to complete (0-based)
 */
export const autoCompleteMilestone = async (studentId, milestoneIndex) => {
    try {
        const progress = await Progress.findOne({ studentId });
        if (!progress || !progress.milestones[milestoneIndex]) return;

        const milestone = progress.milestones[milestoneIndex];

        // Mark current milestone as completed
        milestone.status = 'completed';
        milestone.progress = 100;
        milestone.completedAt = new Date();

        // Unlock next milestone if exists
        if (progress.milestones[milestoneIndex + 1]) {
            progress.milestones[milestoneIndex + 1].locked = false;
            progress.milestones[milestoneIndex + 1].status = 'in_progress';
        }

        // Recalculate overall progress
        const totalProgress = progress.milestones.reduce((sum, m) => sum + m.progress, 0);
        progress.overallProgress = Math.round(totalProgress / progress.milestones.length);
        progress.lastUpdated = new Date();

        await progress.save();
        return progress;
    } catch (error) {
        console.error('Error auto-completing milestone:', error);
        throw error;
    }
};

/**
 * Unlock next milestone after current one completes
 * @param {ObjectId} studentId - Student's ID
 */
export const unlockNextMilestone = async (studentId) => {
    try {
        const progress = await Progress.findOne({ studentId });
        if (!progress) return;

        // Find first incomplete milestone
        const currentIndex = progress.milestones.findIndex(m => m.status !== 'completed');
        if (currentIndex === -1) return; // All completed

        // Unlock it if locked
        if (progress.milestones[currentIndex].locked) {
            progress.milestones[currentIndex].locked = false;
            progress.milestones[currentIndex].status = 'in_progress';
            await progress.save();
        }

        return progress;
    } catch (error) {
        console.error('Error unlocking milestone:', error);
        throw error;
    }
};

/**
 * Initialize milestones with sequential locking
 * First milestone unlocked, rest locked
 * @param {Array} milestones - Milestone array
 */
export const initializeMilestonesWithLocking = (milestones) => {
    return milestones.map((m, index) => ({
        ...m,
        locked: index !== 0, // First milestone unlocked, rest locked
        status: index === 0 ? 'in_progress' : 'pending',
        order: index
    }));
};

/**
 * Calculate milestone due dates based on project deadline
 * @param {Date} projectDueDate - Project final deadline
 * @param {Array} milestones - Milestones with estimatedDays
 */
export const calculateMilestoneDueDates = (projectDueDate, milestones) => {
    const endDate = new Date(projectDueDate);
    const totalDays = milestones.reduce((sum, m) => sum + (m.estimatedDays || 7), 0);

    let currentDate = new Date();
    const dailyIncrement = (endDate - currentDate) / totalDays;

    return milestones.map(m => {
        const daysForThisMilestone = m.estimatedDays || 7;
        currentDate = new Date(currentDate.getTime() + (dailyIncrement * daysForThisMilestone));
        return {
            ...m,
            dueDate: new Date(currentDate)
        };
    });
};
