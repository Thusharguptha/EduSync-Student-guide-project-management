import Allocation from '../models/Allocation.js';
import Project from '../models/Project.js';
import Panel from '../models/Panel.js';
import Assignment from '../models/Assignment.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { toGrade } from '../utils/grade.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import { similarity } from '../utils/textSimilarity.js';

export const getStudents = async (req, res) => {
  const allocs = await Allocation.find({ teacherId: req.user._id }).populate('studentId', 'name email');
  res.json(allocs);
};

export const getProjects = async (req, res) => {
  const projects = await Project.find({ guideId: req.user._id })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1, updatedAt: -1 });

  // Check for title clashes for each project
  const projectsWithClashInfo = await Promise.all(projects.map(async (proj) => {
    const otherProjects = await Project.find({ _id: { $ne: proj._id } }).select('title');
    const titleClash = otherProjects.some(t =>
      similarity((t.title || '').toLowerCase(), (proj.title || '').toLowerCase()) > 0.6
    );
    return {
      ...proj.toObject(),
      titleClash
    };
  }));

  res.json(projectsWithClashInfo);
};

export const approveProject = async (req, res) => {
  const { studentId, approve } = req.body;
  const status = approve ? 'approved' : 'rejected';
  const proj = await Project.findOneAndUpdate({ studentId }, { status }, { new: true });

  // AUTO-COMPLETE MILESTONE: When project approved, complete "Project Proposal" milestone
  if (approve && status === 'approved') {
    try {
      const { autoCompleteMilestone } = await import('../utils/milestoneAutomation.js');
      await autoCompleteMilestone(studentId, 0); // Complete first milestone (index 0)
    } catch (error) {
      console.error('Error auto-completing milestone:', error);
      // Don't fail the approval if milestone update fails
    }
  }

  res.json(proj);
};

export const submitFeedback = async (req, res) => {
  const { studentId, feedback } = req.body;
  const proj = await Project.findOneAndUpdate({ studentId }, { $set: { feedback } }, { new: true, upsert: true });
  res.json(proj);
};

export const grade = async (req, res) => {
  const { studentId, score } = req.body;
  const proj = await Project.findOneAndUpdate(
    { studentId },
    { $push: { panelMarks: { score, memberId: req.user._id } } },
    { new: true, upsert: true }
  );
  const scores = (proj.panelMarks || []).map(p => p.score).filter(s => typeof s === 'number');
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : score;
  proj.grade = toGrade(avg);
  await proj.save();
  res.json({ average: avg, grade: proj.grade });
};

// Assignment Management
export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, maxScore, instructions, assignedTo, category } = req.body;
    const assignment = await Assignment.create({
      title,
      description,
      teacherId: req.user._id,
      dueDate: new Date(dueDate),
      maxScore: maxScore || 100,
      instructions,
      assignedTo: assignedTo || [],
      category: category || 'assignment'
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user._id })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, teacherId: req.user._id },
      req.body,
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

// Progress Tracking
export const getStudentProgress = async (req, res) => {
  try {
    const students = await Allocation.find({ teacherId: req.user._id })
      .populate('studentId', 'name email');

    const progressData = await Promise.all(
      students.map(async (alloc) => {
        const project = await Project.findOne({ studentId: alloc.studentId._id });
        const progress = await Progress.findOne({ studentId: alloc.studentId._id })
          .populate('projectId', 'title dueDate');

        return {
          student: alloc.studentId,
          project,
          progress,
          overallProgress: progress?.overallProgress || 0
        };
      })
    );

    res.json(progressData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student progress', error: error.message });
  }
};

export const updateProjectDueDate = async (req, res) => {
  try {
    const { studentId, dueDate } = req.body;
    const project = await Project.findOneAndUpdate(
      { studentId, guideId: req.user._id },
      { dueDate: new Date(dueDate) },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating due date', error: error.message });
  }
};

// Assignment Submission & Grading
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify the assignment belongs to this teacher
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found or access denied' });
    }

    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'name email department')
      .populate('gradedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    // Find the submission and verify teacher owns the assignment
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.assignmentId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    // Validate score
    if (score < 0 || score > submission.maxScore) {
      return res.status(400).json({
        message: `Score must be between 0 and ${submission.maxScore}`
      });
    }

    // Update submission with grade
    submission.score = score;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    const populated = await AssignmentSubmission.findById(submission._id)
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title maxScore')
      .populate('gradedBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
};

export const getSubmissionStats = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify assignment belongs to teacher
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignmentId });

    // Calculate statistics
    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
    const late = submissions.filter(s => s.isLate).length;

    // Calculate average score for graded submissions
    const gradedSubmissions = submissions.filter(s => s.score !== undefined && s.score !== null);
    const averageScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length
      : 0;

    // Get expected student count (assignedTo or all students)
    let expectedCount = 0;
    if (assignment.assignedTo && assignment.assignedTo.length > 0) {
      expectedCount = assignment.assignedTo.length;
    } else {
      // Count all students
      expectedCount = await User.countDocuments({ role: 'student' });
    }

    const notSubmitted = Math.max(0, expectedCount - total);

    res.json({
      total,
      graded,
      pending,
      late,
      notSubmitted,
      averageScore: Math.round(averageScore * 100) / 100,
      expectedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

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

    // Approve the document and auto-complete milestone
    milestone.approvedByTeacher = true;
    milestone.progress = 100;
    milestone.status = 'completed';
    milestone.completedAt = new Date();

    // Auto-unlock next milestone
    if (progress.milestones[milestoneIndex + 1]) {
      progress.milestones[milestoneIndex + 1].locked = false;
      progress.milestones[milestoneIndex + 1].status = 'in_progress';
    }

    // Recalculate overall progress
    const totalProgress = progress.milestones.reduce((sum, m) => sum + m.progress, 0);
    progress.overallProgress = Math.round(totalProgress / progress.milestones.length);

    await progress.save();

    res.json({ message: 'Milestone approved and completed', progress });
  } catch (error) {
    res.status(500).json({ message: 'Error approving milestone', error: error.message });
  }
};
