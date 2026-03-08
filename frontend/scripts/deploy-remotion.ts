/**
 * Deploy Remotion Lambda bundle and update REMOTION_SERVE_URL.
 *
 * Usage (from frontend/):
 *   npx tsx scripts/deploy-remotion.ts
 *
 * Prerequisites:
 *   - AWS credentials configured (env vars or ~/.aws/credentials)
 *   - REMOTION_REGION, REMOTION_FUNCTION_NAME set in .env.local
 */

import { deploySite, getOrCreateBucket } from '@remotion/lambda';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const region = (process.env.REMOTION_REGION as 'us-east-1' | 'us-west-2' | 'eu-west-1') || 'us-east-1';

async function main() {
  console.log('Ensuring S3 bucket exists...');
  const { bucketName } = await getOrCreateBucket({ region });

  console.log('Bundling and deploying site to S3...');
  const { serveUrl } = await deploySite({
    bucketName,
    entryPoint: path.join(__dirname, '../src/remotion/Root.tsx'),
    region,
    siteName: 'morphix-remotion',
  });

  console.log('\n✅ Deploy complete!');
  console.log(`REMOTION_SERVE_URL=${serveUrl}`);
  console.log('\nAdd this to your frontend/.env.local');

  // Auto-update .env.local if it exists
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, 'utf-8');
    if (env.includes('REMOTION_SERVE_URL=')) {
      env = env.replace(/^REMOTION_SERVE_URL=.*/m, `REMOTION_SERVE_URL=${serveUrl}`);
    } else {
      env += `\nREMOTION_SERVE_URL=${serveUrl}`;
    }
    fs.writeFileSync(envPath, env);
    console.log('✅ Updated .env.local automatically');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
