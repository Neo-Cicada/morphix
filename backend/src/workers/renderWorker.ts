import path from 'path';
import os from 'os';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/prisma';
import type { Scene } from '../remotion/schema';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = 'renders';

export async function renderVideo(jobId: string, scene: Scene): Promise<void> {
    await prisma.videoJob.update({
        where: { id: jobId },
        data: { render_status: 'rendering', render_started_at: new Date() },
    });

    const outputPath = path.join(os.tmpdir(), `${jobId}.mp4`);

    try {
        // Bundle the Remotion composition
        const entryPoint = path.resolve(__dirname, '../remotion/index.tsx');
        const bundleLocation = await bundle(entryPoint);

        // Select the composition with the scene's dimensions/duration
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'MorphixVideo',
            inputProps: { scene },
        });

        // Override with actual scene dimensions
        composition.durationInFrames = scene.durationInFrames;
        composition.fps = scene.fps;
        composition.width = scene.width;
        composition.height = scene.height;

        // Render to MP4
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: { scene },
        });

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(outputPath);
        const storagePath = `${jobId}.mp4`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, {
                contentType: 'video/mp4',
                upsert: true,
            });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        // Get public URL
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        await prisma.videoJob.update({
            where: { id: jobId },
            data: {
                output_url: publicUrl,
                render_status: 'done',
                render_completed_at: new Date(),
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[renderWorker] job ${jobId} failed:`, message);

        await prisma.videoJob.update({
            where: { id: jobId },
            data: { render_status: 'failed', render_error: message },
        });
    } finally {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
}
