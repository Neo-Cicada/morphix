import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { editScene, batchEditScenes, getBatch } from '../controllers/ai';

const router = Router();

router.post('/edit', aiLimiter, requireAuth, editScene);
router.post('/batch', aiLimiter, requireAuth, batchEditScenes);
router.get('/batch/:batchId', requireAuth, getBatch);

export default router;
