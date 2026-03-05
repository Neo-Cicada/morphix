import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listVideos, getStats, createVideo } from '../controllers/videos';
import { startRender, getRenderStatus } from '../controllers/render';

const router = Router();

router.get('/', requireAuth, listVideos);
router.get('/stats', requireAuth, getStats);
router.post('/', requireAuth, createVideo);
router.post('/:id/render', requireAuth, startRender);
router.get('/:id/render-status', requireAuth, getRenderStatus);

export default router;
