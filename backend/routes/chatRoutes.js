import { Router } from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { getDirectHistory, getBroadcastHistory } from '../controllers/chatController.js';

const router = Router();

router.use(auth);

router.get('/direct/:userId', getDirectHistory);
router.get('/broadcast', getBroadcastHistory);

export default router;
