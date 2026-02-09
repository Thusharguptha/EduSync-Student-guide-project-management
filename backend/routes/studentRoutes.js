import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { submitProject, getProject, addLog, getFeedback, uploadFile, getGuide, getAssignments, getProgress, updateProgress, submitAssignment, getMySubmissions, getSubmissionById } from '../controllers/studentController.js';
import { uploader } from '../utils/uploader.js';

const router = Router();

router.use(auth, permit('student'));

router.post('/project', submitProject);
router.get('/project', getProject);
router.post('/logbook', addLog);
router.get('/feedback', getFeedback);
router.post('/upload', uploader.single('file'), uploadFile);
router.get('/guide', getGuide);

// Assignment and Progress routes
router.get('/assignments', getAssignments);
router.get('/progress', getProgress);
router.post('/progress', updateProgress);

// Assignment Submission routes
router.post('/assignment/submit', submitAssignment);
router.get('/submissions', getMySubmissions);
router.get('/submissions/:id', getSubmissionById);

export default router;
