import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createVideoSchema = z.object({
    app_name: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    audience: z.array(z.string()).min(1),
    cta_goal: z.string().min(1).max(200),
    features: z.string().max(2000).optional(),
    video_length: z.union([z.literal(30), z.literal(60), z.literal(90)]),
    tone: z.string().min(1).max(100),
    music_vibe: z.string().min(1).max(100),
});

export async function listVideos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const limit = 10;
        const cursor = req.query['cursor'] as string | undefined;
        const order = req.query['order'] === 'asc' ? 'asc' : 'desc';

        const videos = await prisma.videoJob.findMany({
            where: { user_id: req.user!.id },
            orderBy: { created_at: order },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: {
                id: true,
                app_name: true,
                status: true,
                source: true,
                credits_used: true,
                output_url: true,
                render_status: true,
                animation_code: true,
                production_doc: true,
                created_at: true,
            },
        });

        const hasMore = videos.length > limit;
        const page = videos.slice(0, limit);
        const nextCursor = hasMore ? page[page.length - 1]?.id : null;

        const result = page.map(v => {
            const doc = v.production_doc as Record<string, unknown> | null;
            return {
                ...v,
                has_code: v.animation_code !== null,
                animation_code: undefined,
                thumbnail: (doc?.thumbnail as string | undefined) ?? null,
                production_doc: undefined,
            };
        });

        res.json({ videos: result, nextCursor });
    } catch (err) {
        next(err);
    }
}

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [total, thisMonth, user] = await Promise.all([
            prisma.videoJob.count({ where: { user_id: userId } }),
            prisma.videoJob.count({
                where: { user_id: userId, created_at: { gte: startOfMonth } },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { credit_balance: true },
            }),
        ]);

        res.json({
            total_videos: total,
            this_month: thisMonth,
            credit_balance: user?.credit_balance ?? 0,
        });
    } catch (err) {
        next(err);
    }
}

export async function createVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const parsed = createVideoSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ status: 'error', message: parsed.error.issues[0].message });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user || user.credit_balance < 1) {
            res.status(402).json({ status: 'error', message: 'Insufficient credits' });
            return;
        }

        const [video] = await prisma.$transaction([
            prisma.videoJob.create({
                data: {
                    user_id: req.user!.id,
                    app_name: parsed.data.app_name,
                    description: parsed.data.description,
                    audience: parsed.data.audience,
                    cta_goal: parsed.data.cta_goal,
                    features: parsed.data.features,
                    video_length: parsed.data.video_length,
                    tone: parsed.data.tone,
                    music_vibe: parsed.data.music_vibe,
                    credits_used: 1,
                },
            }),
            prisma.user.update({
                where: { id: req.user!.id },
                data: { credit_balance: { decrement: 1 } },
            }),
        ]);

        res.status(201).json(video);
    } catch (err) {
        next(err);
    }
}

const createDraftSchema = z.object({
    title: z.string().min(1).max(200),
    animation_code: z.string().min(1),
    production_doc: z.any().optional(),
});

export async function createDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const parsed = createDraftSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ status: 'error', message: parsed.error.issues[0].message });
            return;
        }

        const video = await prisma.videoJob.create({
            data: {
                user_id: req.user!.id,
                app_name: parsed.data.title,
                source: 'editor',
                animation_code: parsed.data.animation_code,
                production_doc: parsed.data.production_doc ?? undefined,
                credits_used: 0,
                audience: [],
            },
        });

        res.status(201).json({ id: video.id });
    } catch (err) {
        next(err);
    }
}

const updateDraftCodeSchema = z.object({
    animation_code: z.string().min(1),
    production_doc: z.any().optional(),
});

export async function updateDraftCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const id = req.params['id'] as string;
        const parsed = updateDraftCodeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ status: 'error', message: parsed.error.issues[0].message });
            return;
        }

        const existing = await prisma.videoJob.findUnique({ where: { id }, select: { user_id: true, production_doc: true } });
        if (!existing) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }
        if (existing.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        // Deep-merge production_doc so nested objects (voiceState, musicState) preserve existing fields
        function mergeProductionDoc(
            existing: Record<string, unknown>,
            incoming: Record<string, unknown>,
        ): Record<string, unknown> {
            const result: Record<string, unknown> = { ...existing };
            for (const [key, value] of Object.entries(incoming)) {
                if (
                    value !== null &&
                    typeof value === 'object' &&
                    !Array.isArray(value) &&
                    result[key] !== null &&
                    typeof result[key] === 'object' &&
                    !Array.isArray(result[key])
                ) {
                    result[key] = mergeProductionDoc(
                        result[key] as Record<string, unknown>,
                        value as Record<string, unknown>,
                    );
                } else {
                    result[key] = value;
                }
            }
            return result;
        }

        const mergedDoc = parsed.data.production_doc
            ? mergeProductionDoc(
                (existing.production_doc as Record<string, unknown>) ?? {},
                parsed.data.production_doc as Record<string, unknown>,
            )
            : existing.production_doc ?? undefined;

        await prisma.videoJob.update({
            where: { id: id },
            data: {
                animation_code: parsed.data.animation_code,
                production_doc: mergedDoc,
            },
        });

        res.json({ status: 'ok' });
    } catch (err) {
        next(err);
    }
}

export async function deleteVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const id = req.params['id'] as string;

        const existing = await prisma.videoJob.findUnique({ where: { id }, select: { user_id: true } });
        if (!existing) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }
        if (existing.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        await prisma.videoJob.delete({ where: { id } });
        res.json({ status: 'ok' });
    } catch (err) {
        next(err);
    }
}

export async function getVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const id = req.params['id'] as string;

        const video = await prisma.videoJob.findUnique({ where: { id } });
        if (!video) {
            res.status(404).json({ status: 'error', message: 'Not found' });
            return;
        }
        if (video.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        res.json(video);
    } catch (err) {
        next(err);
    }
}
