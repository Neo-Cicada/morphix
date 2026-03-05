import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { editScene } from '../controllers/ai';

const router = Router();

router.post('/edit', requireAuth, editScene);

export default router;
