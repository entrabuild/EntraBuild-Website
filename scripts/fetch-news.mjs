// Entraiot Tech Daily — collects technology & IT headlines from the RSS feeds in content/feeds.json
// and writes news/news.json (read by news.html) and news/feed.xml (our own RSS feed).
// Runs on GitHub Actions several times a day. No packages needed (Node 18+).
// We store only the headline, the source, the time and a short summary (max ~30 words), and always link to the original article.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/feeds.json'), 'utf8'));
const OUT = path.join(ROOT, 'news/news.json');
const KEEP_HOURS = 72, MAX_ITEMS = 240, PER_SOURCE = 25;

const RULES = [
  ['AI', /\b(AI|A\.I\.|artificial intelligence|machine learning|LLMs?|GPT-?\d*|ChatGPT|OpenAI|Gemini|Claude|Anthropic|Copilot|neural|deep learning|chatbot|agents?)\b/i],
  ['Security', /\b(security|vulnerab\w*|exploit\w*|malware|ransomware|breach\w*|hack(ed|ers?|ing)?|phishing|zero-day|CVE-\d+|patch(ed)? (flaw|bug))\b/i],
  ['Mobile', /\b(Android|iPhone|iOS|iPad|Pixel|Galaxy|OnePlus|Xiaomi|smartphones?|phones?|WhatsApp|Play Store|App Store|One UI|HyperOS)\b/i],
  ['Electronics', /\b(chips?|CPU|GPU|processor|semiconductor|Snapdragon|MediaTek|Nvidia|AMD|Intel|RTX|Raspberry Pi|Arduino|laptop|monitor|wearables?|smartwatch|earbuds|battery|USB-C|PCB)\b/i]
];
const SKIP = /\b(movie|film review|TV show|episode|box office|celebrit\w+|recipe|horoscope|NFL|NBA|cricket score|deal of the day|coupon|promo code|best deals?)\b/i;

const decode = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => decode(decode(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const hn = s => { const m = s.match(/Points:\s*(\d+)\s*#?\s*Comments:\s*(\d+)/i); return (m || /Article URL:|Comments URL:/i.test(s)) ? (m ? `${m[1]} points · ${m[2]} comments on Hacker News` : '') : s.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim(); };
const words = (s, n) => { const w = s.split(' '); return w.length > n ? w.slice(0, n).join(' ') + '…' : s; };
const tag = (x, names) => { for (const n of names) { const m = x.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i')); if (m) return m[1]; } return ''; };

function parse(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(b => {
    const title = strip(tag(b, ['title']));
    let link = strip(tag(b, ['link']));
    if (!/^https?:/.test(link)) { const m = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i) || b.match(/<link[^>]*href=["']([^"']+)/i); link = m ? decode(m[1]) : ''; }
    if (!/^https?:/.test(link)) { const g = strip(tag(b, ['guid', 'id'])); if (/^https?:/.test(g)) link = g; }
    const when = strip(tag(b, ['pubDate', 'published', 'updated', 'dc:date']));
    const date = new Date(when);
    const summary = words(hn(strip(tag(b, ['description', 'summary', 'content:encoded', 'content']))), 30);
    let cat = feed.cat;
    for (const [c, re] of RULES) if (re.test(title)) { cat = c; break; }
    return { title, link, source: feed.name, cat, date: isNaN(date) ? null : date.toISOString(), summary };
  }).filter(i => i.title && i.link && !SKIP.test(i.title));
}

async function get(feed) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(feed.url, { signal: ctl.signal, headers: { 'User-Agent': 'EntraiotTechDaily/1.0 (+https://entrabuild.com/news.html)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return parse(await r.text(), feed);
  } finally { clearTimeout(t); }
}

const now = Date.now();
let previous = [];
try { previous = JSON.parse(fs.readFileSync(OUT, 'utf8')).items || []; } catch {}

const sources = [];
const fresh = [];
for (const feed of CFG.feeds.filter(f => f.on !== false)) {
  try { const items = (await get(feed)).slice(0, PER_SOURCE); fresh.push(...items); sources.push({ name: feed.name, ok: true, count: items.length }); console.log('✓', feed.name, items.length); }
  catch (e) { sources.push({ name: feed.name, ok: false, count: 0 }); console.log('✗', feed.name, e.message); }
}

const firstSeen = new Map(previous.map(i => [String(i.link).split('?')[0], i.date]));
for (const i of fresh) if (!i.date) i.date = firstSeen.get(i.link.split('?')[0]) || null;
const seen = new Set();
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const items = [...fresh, ...previous]
  .map(i => ({ ...i, date: i.date || new Date(now).toISOString() }))
  .filter(i => now - new Date(i.date).getTime() < KEEP_HOURS * 3600e3 && new Date(i.date).getTime() < now + 3600e3)
  .filter(i => { const k = i.link.split('?')[0]; const t = norm(i.title); if (seen.has(k) || seen.has(t)) return false; seen.add(k); seen.add(t); return true; })
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, MAX_ITEMS);

const start = new Date('2026-10-23T00:00:00+05:30').getTime();
const edition = Math.max(1, Math.floor((now - start) / 864e5) + 1);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date(now).toISOString(), edition, sections: CFG.sections, sources, items }, null, 1));

const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
fs.writeFileSync(path.join(ROOT, 'news/feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Entraiot Tech Daily</title><link>https://entrabuild.com/news.html</link>
<description>Technology and IT headlines, collected every few hours by Entraiot Solutions.</description>
<lastBuildDate>${new Date(now).toUTCString()}</lastBuildDate>
${items.slice(0, 60).map(i => `<item><title>${x(i.title)}</title><link>${x(i.link)}</link><guid>${x(i.link)}</guid><category>${x(i.cat)}</category><source url="${x(i.link)}">${x(i.source)}</source><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${x(i.summary)}</description></item>`).join('\n')}
</channel></rss>
`);
console.log(`Saved ${items.length} stories from ${sources.filter(s => s.ok).length}/${sources.length} sources`);
