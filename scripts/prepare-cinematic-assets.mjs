import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(root, 'public', 'cinematic');
mkdirSync(outputDir, { recursive: true });

const assets = [
  { output: 'sls-closed.jpg', file: 'Mercedes-AMG SLS.jpg' },
  { output: 'sls-open.jpg', file: 'Mercedes SLS AMG gullwing grey.jpg' },
];

const minimumBytes = 50_000;
const userAgent = 'DriftCarRental/1.0 (+https://github.com/ashleyscomputer/drift-car-rental)';

for (const asset of assets) {
  const destination = join(outputDir, asset.output);
  if (existsSync(destination) && statSync(destination).size >= minimumBytes) {
    console.log(`[cinematic-assets] reuse ${asset.output}`);
    continue;
  }

  const source = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(asset.file)}?width=2560`;
  console.log(`[cinematic-assets] download ${asset.output}`);
  const response = await fetch(source, {
    redirect: 'follow',
    headers: {
      'User-Agent': userAgent,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download ${asset.file}: HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unexpected content type for ${asset.file}: ${contentType || 'unknown'}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < minimumBytes) {
    throw new Error(`Downloaded asset ${asset.file} is unexpectedly small (${bytes.length} bytes)`);
  }
  writeFileSync(destination, bytes);
}

console.log(`[cinematic-assets] ${assets.length} licensed SLS campaign assets ready in public/cinematic`);
