// Live fallback for Entraiot Tech Daily (runs on Vercel as a serverless function at /api/news).
// news.html uses news/news.json first. When that file is empty or old (for example before the
// GitHub news job has run for the first time), it asks this function, which reads the same RSS
// feeds live. Results are cached at the edge for 30 minutes so the publishers are not hammered.
// Like the news job, it keeps only the headline, source, time and a short summary, and links to the original.
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
const words = (s, n) => { const w = s.split(' '); return w.length > n ? w.slice(0, n).join(' ') + '…' : s; };
const tag = (x, names) => { for (const n of names) { const m = x.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i')); if (m) return m[1]; } return ''; };

function parse(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 20).map(b => {
    const title = strip(tag(b, ['title']));
    let link = strip(tag(b, ['link']));
    if (!/^https?:/.test(link)) { const m = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i) || b.match(/<link[^>]*href=["']([^"']+)/i); link = m ? decode(m[1]) : ''; }
    if (!/^https?:/.test(link)) { const g = strip(tag(b, ['guid', 'id'])); if (/^https?:/.test(g)) link = g; }
    const date = new Date(strip(tag(b, ['pubDate', 'published', 'updated', 'dc:date'])));
    let cat = feed.cat;
    for (const [c, re] of RULES) if (re.test(title)) { cat = c; break; }
    return { title, link, source: feed.name, cat, date: isNaN(date) ? new Date().toISOString() : date.toISOString(), summary: words(strip(tag(b, ['description', 'summary', 'content:encoded', 'content'])), 30) };
  }).filter(i => i.title && /^https?:\/\//.test(i.link) && !SKIP.test(i.title));
}

async function get(feed) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(feed.url, { signal: ctl.signal, headers: { 'User-Agent': 'EntraiotTechDaily/1.0 (+https://entrabuild.com/news.html)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return parse(await r.text(), feed);
  } finally { clearTimeout(t); }
}

module.exports = async (req, res) => {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const cfg = await (await fetch(`${proto}://${req.headers.host}/content/feeds.json`)).json();
    const feeds = (cfg.feeds || []).filter(f => f.on !== false && /^https?:\/\//.test(f.url)).slice(0, 30);
    const results = await Promise.allSettled(feeds.map(get));
    const sources = [], all = [];
    results.forEach((r, i) => { if (r.status === 'fulfilled') { all.push(...r.value); sources.push({ name: feeds[i].name, ok: true, count: r.value.length }); } else sources.push({ name: feeds[i].name, ok: false, count: 0 }); });
    const now = Date.now(), seen = new Set(), norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const items = all
      .filter(i => now - new Date(i.date).getTime() < 72 * 3600e3 && new Date(i.date).getTime() < now + 3600e3)
      .filter(i => { const k = i.link.split('?')[0], t = norm(i.title); if (seen.has(k) || seen.has(t)) return false; seen.add(k); seen.add(t); return true; })
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 200);
    const start = new Date('2026-10-23T00:00:00+05:30').getTime();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.status(200).send(JSON.stringify({ updated: new Date(now).toISOString(), edition: Math.max(1, Math.floor((now - start) / 864e5) + 1), live: true, sections: cfg.sections, sources, items }));
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'news unavailable' });
  }
};
