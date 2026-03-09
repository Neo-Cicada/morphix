import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { renderLimiter } from '../middleware/rateLimiter';
import { listVideos, getStats, createVideo, createDraft, updateDraftCode, getVideo } from '../controllers/videos';
import { startRender, getRenderStatus } from '../controllers/render';

const router = Router();

router.get('/', requireAuth, listVideos);
router.get('/stats', requireAuth, getStats);
router.post('/', requireAuth, createVideo);
router.post('/draft', requireAuth, createDraft);
router.get('/:id', requireAuth, getVideo);
router.patch('/:id/code', requireAuth, updateDraftCode);
router.post('/:id/render', renderLimiter, requireAuth, startRender);
router.get('/:id/render-status', requireAuth, getRenderStatus);

export default router;
