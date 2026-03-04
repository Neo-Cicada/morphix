import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let user = await prisma.user.findUnique({ where: { id: req.user!.id } });

        // Auto-provision user row on first login
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: req.user!.id,
                    email: req.user!.email,
                },
            });
        }

        res.json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            credit_balance: user.credit_balance,
        });
    } catch (err) {
        next(err);
    }
}

const updateMeSchema = z.object({
    full_name: z.string().min(1).max(100).optional(),
});

export async function updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const parsed = updateMeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ status: 'error', message: parsed.error.issues[0].message });
            return;
        }

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: parsed.data,
        });

        res.json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            credit_balance: user.credit_balance,
        });
    } catch (err) {
        next(err);
    }
}
