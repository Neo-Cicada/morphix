import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { editScene } from '../controllers/ai';

const router = Router();

router.post('/edit', aiLimiter, requireAuth, editScene);

export default router;
