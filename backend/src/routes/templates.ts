import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listTemplates, getTemplate, createTemplate, deleteTemplate } from '../controllers/templates';

const router = Router();

router.get('/', requireAuth, listTemplates);
router.get('/:id', requireAuth, getTemplate);
router.post('/', requireAuth, createTemplate);
router.delete('/:id', requireAuth, deleteTemplate);

export default router;
