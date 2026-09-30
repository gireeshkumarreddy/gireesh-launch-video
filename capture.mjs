import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('site');
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.woff':'font/woff'};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, {'content-type': types[path.extname(f)] || 'application/octet-stream'}); res.end(d); });
}).listen(8765);

const pages = process.argv[2] ? [process.argv[2]] : ['index', 'work', 'about', 'projects/forme', 'projects/sonar', 'projects/daylight'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.25 });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('gireesh-motion-paused', 'true'); } catch {} });
for (const name of pages) {
  await page.goto(`http://localhost:8765/${name}.html`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
  await page.addStyleTag({ content: 'html body.motion-paused *, html body.motion-paused *:before, html body.motion-paused *:after{animation-play-state:running!important}' }); await new Promise(r => setTimeout(r, 3500));
  const out = `public/shots/${name.replace('projects/', '')}.png`;
  await page.screenshot({ path: out, fullPage: true });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(out, h);
}
await browser.close(); server.close();
