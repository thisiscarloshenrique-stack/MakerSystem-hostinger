// Renderiza index.html quadro a quadro e gera o MP4 vertical (1080x1920) com ffmpeg.
//   node render.mjs                 -> geovana-paz-stories.mp4
//   node render.mjs --stills 1,5,9  -> PNGs desses segundos em ./stills (pré-visualização)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const out = path.join(dir, 'geovana-paz-stories.mp4');

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.evaluate(() => window.ready);
await page.addStyleTag({ content: 'body{display:block;min-height:0}' });
const stage = await page.$('#stage');
const { DURATION, FPS } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));

const shot = async t => {
  await page.evaluate(t => window.render(t), t);
  return stage.screenshot({ type: 'png' });
};

if (stillsArg) {
  const sd = path.join(dir, 'stills');
  mkdirSync(sd, { recursive: true });
  for (const s of stillsArg.split(',').map(Number)) {
    const buf = await shot(s);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(path.join(sd, `t${String(s).padStart(5, '0')}.png`), buf);
  }
  await browser.close();
  process.exit(0);
}

const ff = spawn('ffmpeg', [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(DURATION * FPS);
for (let f = 0; f < total; f++) {
  const buf = await shot(f / FPS);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stderr.write(`quadro ${f}/${total}\n`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('ok ->', out);
