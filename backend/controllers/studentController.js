import Project from '../models/Project.js';
import LogEntry from '../models/LogEntry.js';
import { similarity } from '../utils/textSimilarity.js';
import Allocation from '../models/Allocation.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Progress from '../models/Progress.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';

export const submitProject = async (req, res) => {
  const { title, abstract, fileUrl } = req.body;
  const existing = await Project.findOne({ studentId: req.user._id });

  // PREVENT MULTIPLE SUBMISSIONS: Only allow if no project exists or if it was rejected
  if (existing && existing.status !== 'rejected') {
    return res.status(400).json({
      message: 'Project already submitted. You can only resubmit if your project is rejected by the teacher.'
    });
  }

  const status = 'submitted';
  // Link to allocated guide, if any
  const alloc = await Allocation.findOne({ studentId: req.user._id });
  const guideId = alloc?.teacherId;
  const submittedAt = new Date();
  const proj = existing
    ? await Project.findOneAndUpdate(
      { _id: existing._id },
      { title, abstract, fileUrl, status, guideId: guideId || existing.guideId, submittedAt },
      { new: true }
    )
    : await Project.create({ studentId: req.user._id, title, abstract, fileUrl, status, guideId, submittedAt });

  // AUTO-CREATE STANDARD MILESTONES if they don't exist
  let progress = await Progress.findOne({ studentId: req.user._id });
  if (!progress || !progress.milestones || progress.milestones.length === 0) {
    const standardMilestones = [
      {
        title: 'Project Proposal',
        description: 'Submit initial project proposal',
        status: 'in_progress',
        progress: 0,
        locked: false,
        order: 0
      },
      {
        title: 'Literature Review',
        description: 'Complete literature review and research',
        status: 'pending',
        progress: 0,
        locked: true,
        order: 1
      },
      {
        title: 'Implementation',
        description: 'Develop the project',
        status: 'pending',
        progress: 0,
        locked: true,
        order: 2
      },
      {
        title: 'Testing & Documentation',
        description: 'Test and document the project',
        status: 'pending',
        progress: 0,
        locked: true,
        order: 3
      },
      {
        title: 'Final Submission',
        description: 'Submit final project with presentation',
        status: 'pending',
        progress: 0,
        locked: true,
        order: 4
      }
    ];

    if (progress) {
      progress.milestones = standardMilestones;
      progress.projectId = proj._id;
      await progress.save();
    } else {
      await Progress.create({
        studentId: req.user._id,
        projectId: proj._id,
        milestones: standardMilestones,
        overallProgress: 0
      });
    }
  }

  const titles = await Project.find({ _id: { $ne: proj._id } }).select('title');
  const clash = titles.some(t => similarity((t.title || '').toLowerCase(), (title || '').toLowerCase()) > 0.6);
  res.json({ project: proj, titleClash: clash });
};

export const getProject = async (req, res) => {
  const proj = await Project.findOne({ studentId: req.user._id });
  res.json(proj || {});
};

export const addLog = async (req, res) => {
  const { week, workDone, issues, nextSteps } = req.body;
  const log = await LogEntry.create({ studentId: req.user._id, week, workDone, issues, nextSteps });
  res.status(201).json(log);
};

export const getFeedback = async (req, res) => {
  const proj = await Project.findOne({ studentId: req.user._id }).select('feedback grade');
  res.json(proj || {});
};

export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
};

export const getGuide = async (req, res) => {
  const alloc = await Allocation.findOne({ studentId: req.user._id }).populate('teacherId', 'name email role');
  if (!alloc) return res.json(null);
  res.json(alloc.teacherId);
};

// Assignment and Progress Management for Students
export const getAssignments = async (req, res) => {
  try {
    // Get assignments assigned to this student or all students
    const assignments = await Assignment.find({
      $or: [
        { assignedTo: req.user._id },
        { assignedTo: { $size: 0 } } // assignments for all students
      ],
      isActive: true
    }).populate('teacherId', 'name email').sort({ dueDate: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

export const getProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({ studentId: req.user._id })
      .populate('projectId', 'title dueDate status')
      .populate('templateId', 'name description');

    // Return progress or empty object if none exists
    // Teacher will set milestones via template system
    res.json(progress || {});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { milestoneIndex, progress, status, notes, fileUrl } = req.body;

    const progressDoc = await Progress.findOne({ studentId: req.user._id });
    if (!progressDoc) return res.status(404).json({ message: 'Progress not found' });

    if (milestoneIndex >= 0 && milestoneIndex < progressDoc.milestones.length) {
      const milestone = progressDoc.milestones[milestoneIndex];

      // Check if milestone is locked
      if (milestone.locked) {
        return res.status(403).json({
          message: 'This milestone is locked. Complete the previous milestone first.'
        });
      }

      milestone.progress = progress;
      milestone.status = status;
      milestone.notes = notes;

      // NEW: Handle file upload for milestone
      if (fileUrl) {
        milestone.fileUrl = fileUrl;
      }

      // NEW: Milestone can only be completed if teacher has approved the document
      // OR for first milestone (Project Proposal) which is auto-approved by teacher
      if (status === 'completed') {
        if (milestoneIndex > 0 && !milestone.approvedByTeacher) {
          return res.status(400).json({
            message: 'You must upload a document and wait for teacher approval before marking this milestone as completed.'
          });
        }

        milestone.completedAt = new Date();

        // Auto-unlock next milestone
        if (progressDoc.milestones[milestoneIndex + 1]) {
          progressDoc.milestones[milestoneIndex + 1].locked = false;
          progressDoc.milestones[milestoneIndex + 1].status = 'in_progress';
        }
      }

      // Calculate overall progress
      const totalProgress = progressDoc.milestones.reduce((sum, m) => sum + m.progress, 0);
      progressDoc.overallProgress = Math.round(totalProgress / progressDoc.milestones.length);
      progressDoc.lastUpdated = new Date();

      await progressDoc.save();
    }

    res.json(progressDoc);
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
};

// Assignment Submission Management
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileUrl, notes } = req.body;

    // Validate assignment exists and is active
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (!assignment.isActive) return res.status(400).json({ message: 'Assignment is no longer active' });

    // Check if student has already submitted
    const existingSubmissions = await AssignmentSubmission.find({
      assignmentId,
      studentId: req.user._id
    });

    const attemptNumber = existingSubmissions.length + 1;

    // Check if late
    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);
    const status = isLate ? 'late' : 'submitted';

    // Create submission
    const submission = await AssignmentSubmission.create({
      assignmentId,
      studentId: req.user._id,
      fileUrl,
      submittedAt: now,
      status,
      isLate,
      attemptNumber,
      maxScore: assignment.maxScore,
      notes
    });

    const populated = await AssignmentSubmission.findById(submission._id)
      .populate('assignmentId', 'title dueDate maxScore')
      .populate('studentId', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ studentId: req.user._id })
      .populate('assignmentId', 'title dueDate maxScore teacherId')
      .populate('gradedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await AssignmentSubmission.findOne({
      _id: id,
      studentId: req.user._id
    })
      .populate('assignmentId', 'title description dueDate maxScore instructions')
      .populate('gradedBy', 'name email');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

