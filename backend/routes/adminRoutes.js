import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { listUsers, createUser, allocateGuide, listAllocations, createPanel, listPanels, dashboardStats, deleteUser, bulkRegisterUsers, getAllUsers, updateUser } from '../controllers/adminController.js';
import { excelUploader } from '../utils/uploader.js';

const router = Router();

router.use(auth, permit('admin'));

// Bulk registration
router.post('/bulk-register', excelUploader.single('file'), bulkRegisterUsers);
router.get('/all-users', getAllUsers);
router.put('/users/:id', updateUser);

// Existing routes
router.get('/users', listUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.post('/allocate', allocateGuide);
router.get('/allocations', listAllocations);
router.post('/panels', createPanel);
router.get('/panels', listPanels);
router.get('/dashboard-stats', dashboardStats);

export default router;
