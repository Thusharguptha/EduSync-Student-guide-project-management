import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplateToStudent,
    updateStudentMilestones
} from '../controllers/templateController.js';

const router = Router();

// Anyone authenticated can view templates
router.get('/templates', auth, getTemplates);

// Only teachers can manage templates
router.use(auth, permit('teacher'));

router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// Apply template to student and manage milestones
router.post('/student/apply-template', applyTemplateToStudent);
router.put('/student/:studentId/milestones', updateStudentMilestones);

export default router;
