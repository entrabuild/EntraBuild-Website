// Takes a full-page screenshot of every project website listed in content/site.json,
// the way a visitor sees it on a normal laptop screen (1280 × 800), and saves them to images/screens/.
// The home page and portfolio scroll through these pictures slowly, from the top of each site to the end.
// Runs on GitHub Actions (see .github/workflows/screens.yml). Needs Playwright, which the workflow installs.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'images/screens');
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const MAX_H = 14000;            // stop very long pages here
const only = process.argv.slice(2);   // optional: node capture-screens.mjs <project-id> …

const projects = C.industries.flatMap(i => i.projects)
  .filter(p => /^https?:\/\//.test(p.link || '') && !/t\.me\//.test(p.link) && p.frame !== false)
  .filter(p => !only.length || only.includes(p.id));

fs.mkdirSync(OUT, { recursive: true });
const manifestFile = path.join(OUT, 'index.json');
let manifest = { items: {} };
try { manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); } catch {}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-IN',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 EntraBuildPreview/1.0' });

for (const p of projects) {
  const page = await ctx.newPage();
  try {
    await page.goto(p.link, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2500);
    // Scroll down like a reader so lazy images and scroll animations load, then return to the top.
    const total = await page.evaluate(() => Math.min(document.documentElement.scrollHeight, 14000));
    for (let y = 0; y < total; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(300); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    // Pause videos and animations so the picture is sharp.
    await page.evaluate(() => { document.querySelectorAll('video').forEach(v => { try { v.pause(); } catch {} }); });
    const h = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
    const height = Math.max(800, Math.min(h, MAX_H));
    const file = path.join(OUT, `${p.id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 72, fullPage: true, clip: { x: 0, y: 0, width: 1280, height } });
    manifest.items[p.id] = { w: 1280, h: height, v: Date.now(), url: p.link };
    console.log('✓', p.id, height + 'px');
  } catch (e) {
    console.log('✗', p.id, e.message.split('\n')[0]);
  } finally { await page.close(); }
}
await browser.close();

// Forget pictures of projects that no longer exist.
const ids = new Set(C.industries.flatMap(i => i.projects).map(p => p.id));
for (const id of Object.keys(manifest.items)) if (!ids.has(id)) { delete manifest.items[id]; fs.rmSync(path.join(OUT, `${id}.jpg`), { force: true }); }
manifest.updated = new Date().toISOString();
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
console.log(`Saved ${Object.keys(manifest.items).length} screenshots`);
