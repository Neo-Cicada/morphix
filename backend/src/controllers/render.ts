import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { renderVideo } from '../workers/renderWorker';

export async function startRender(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const id = req.params['id'] as string;
        const { scene } = req.body;

        if (!scene || typeof scene !== 'object') {
            res.status(400).json({ status: 'error', message: 'scene is required' });
            return;
        }

        // Find existing job or create a minimal one
        let job = await prisma.videoJob.findUnique({ where: { id } });

        if (job && job.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        if (!job) {
            // Auto-create a job on first render
            job = await prisma.videoJob.create({
                data: {
                    id,
                    user_id: req.user!.id,
                    app_name: scene.appName || 'Untitled',
                    description: '',
                    audience: [],
                    cta_goal: '',
                    video_length: Math.round(scene.durationInFrames / (scene.fps || 30)),
                    tone: '',
                    music_vibe: '',
                    production_doc: scene,
                    render_status: 'queued',
                },
            });
        } else {
            job = await prisma.videoJob.update({
                where: { id },
                data: {
                    production_doc: scene,
                    render_status: 'queued',
                    render_error: null,
                },
            });
        }

        // Fire-and-forget (code-based rendering)
        const code = typeof scene === 'string' ? scene : JSON.stringify(scene);
        const durationInFrames = req.body.durationInFrames ?? scene.durationInFrames ?? 150;
        const fps = req.body.fps ?? scene.fps ?? 30;
        setImmediate(() => renderVideo(id, code, durationInFrames, fps));

        res.json({ status: 'queued', jobId: id });
    } catch (err) {
        next(err);
    }
}

export async function getRenderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const id = req.params['id'] as string;

        const job = await prisma.videoJob.findUnique({
            where: { id },
            select: {
                user_id: true,
                render_status: true,
                render_error: true,
                output_url: true,
            },
        });

        if (!job) {
            res.status(404).json({ status: 'error', message: 'Job not found' });
            return;
        }

        if (job.user_id !== req.user!.id) {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        res.json({
            render_status: job.render_status,
            output_url: job.output_url,
            render_error: job.render_error,
        });
    } catch (err) {
        next(err);
    }
}
