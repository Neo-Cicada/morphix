import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const createTemplateSchema = z.object({
    name: z.string().min(1).max(120),
    scene_json: z.record(z.string(), z.unknown()),
});

export async function listTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const templates = await prisma.template.findMany({
            where: {
                OR: [
                    { is_preset: true },
                    { user_id: req.user!.id },
                ],
            },
            orderBy: [{ is_preset: 'desc' }, { created_at: 'asc' }],
            select: { id: true, name: true, scene_json: true, is_preset: true, user_id: true, created_at: true },
        });
        res.json({ templates });
    } catch (err) {
        next(err);
    }
}

export async function createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const parsed = createTemplateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ status: 'error', message: 'Invalid request' });
            return;
        }
        const { name, scene_json } = parsed.data;
        const template = await prisma.template.create({
            data: { name, scene_json: scene_json as object, user_id: req.user!.id, is_preset: false },
        });
        res.status(201).json({ template });
    } catch (err) {
        next(err);
    }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const template = await prisma.template.findUnique({ where: { id: String(id) } });
        if (!template) {
            res.status(404).json({ status: 'error', message: 'Template not found' });
            return;
        }
        if (template.is_preset || template.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Cannot delete this template' });
            return;
        }
        await prisma.template.delete({ where: { id: String(id) } });
        res.json({ status: 'ok' });
    } catch (err) {
        next(err);
    }
}
