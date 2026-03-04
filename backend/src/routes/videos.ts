import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listVideos, getStats, createVideo } from '../controllers/videos';

const router = Router();

router.get('/', requireAuth, listVideos);
router.get('/stats', requireAuth, getStats);
router.post('/', requireAuth, createVideo);

export default router;
