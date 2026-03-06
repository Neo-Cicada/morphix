import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';
import type { AwsRegion } from '@remotion/lambda';
import { prisma } from '../lib/prisma';
import type { Scene } from '../remotion/schema';

export async function renderVideo(jobId: string, scene: Scene): Promise<void> {
    await prisma.videoJob.update({
        where: { id: jobId },
        data: { render_status: 'rendering', render_started_at: new Date() },
    });

    try {
        const { renderId, bucketName } = await renderMediaOnLambda({
            region: process.env.AWS_REGION as AwsRegion,
            functionName: process.env.REMOTION_FUNCTION_NAME!,
            serveUrl: process.env.REMOTION_SITE_URL!,
            composition: 'MorphixVideo',
            inputProps: { scene },
            codec: 'h264',
            imageFormat: 'jpeg',
            maxRetries: 1,
            framesPerLambda: 20,
            privacy: 'public',
        });

        while (true) {
            const progress = await getRenderProgress({
                renderId,
                bucketName,
                functionName: process.env.REMOTION_FUNCTION_NAME!,
                region: process.env.AWS_REGION as AwsRegion,
            });

            if (progress.done) {
                await prisma.videoJob.update({
                    where: { id: jobId },
                    data: {
                        output_url: progress.outputFile!,
                        render_status: 'done',
                        render_completed_at: new Date(),
                    },
                });
                break;
            }

            if (progress.fatalErrorEncountered) {
                throw new Error(progress.errors[0]?.message ?? 'Lambda render failed');
            }

            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[renderWorker] job ${jobId} failed:`, message);
        await prisma.videoJob.update({
            where: { id: jobId },
            data: { render_status: 'failed', render_error: message },
        });
    }
}
