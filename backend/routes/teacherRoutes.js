import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import {
  getStudents,
  getProjects,
  approveProject,
  submitFeedback,
  grade,
  createAssignment,
  getAssignments,
  updateAssignment,
  getStudentProgress,
  updateProjectDueDate,
  getAssignmentSubmissions,
  gradeSubmission,
  getSubmissionStats,
  approveMilestoneDocument
} from '../controllers/teacherController.js';

const router = Router();

router.use(auth, permit('teacher'));

router.get('/students', getStudents);
router.get('/projects', getProjects);
router.post('/approve-project', approveProject);
router.post('/submit-feedback', submitFeedback);
router.post('/grade', grade);

// Assignment routes
router.post('/assignments', createAssignment);
router.get('/assignments', getAssignments);
router.put('/assignments/:id', updateAssignment);

// Assignment Submission & Grading routes
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.post('/submissions/:submissionId/grade', gradeSubmission);
router.get('/assignments/:assignmentId/stats', getSubmissionStats);

// Milestone routes
router.post('/approve-milestone', approveMilestoneDocument);

// Progress tracking routes
router.get('/student-progress', getStudentProgress);
router.post('/update-due-date', updateProjectDueDate);

export default router;
