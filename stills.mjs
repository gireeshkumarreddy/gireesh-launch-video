import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Launch' });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `stills/f${String(frame).padStart(3, '0')}.jpg`, imageFormat: 'jpeg', scale: 0.5 });
  console.log('done', frame);
}
