// EntraBuild website assistant (runs on Vercel as a serverless function at /api/chat).
// It answers questions about EntraBuild and this website using Groq's free API.
// The Groq key is NEVER put in the website code. Add it in Vercel:
//   Project -> Settings -> Environment Variables -> GROQ_API_KEY = <your key>  (then redeploy)
// Optional: GROQ_MODEL (default llama-3.1-8b-instant).
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const FACTS = `
ABOUT ENTRABUILD
- EntraBuild is a software company ("an Entraiot Solutions studio") that designs, codes and puts live websites, online stores, custom software and SaaS platforms, mobile apps (Android and iOS) and AI chatbots / automation, from one team.
- Offices: Chennai office at No. 11/608, Anna Nagar 1st Street, Kulathuvanchery, Paraniputhur PO, Iyyappanthangal Main Road, Chennai, Tamil Nadu 600122. Thanjavur branch at 9/148 Fathima Nagar, N.K. Road, Thanjavur, Tamil Nadu 613001. Also serves Bangalore, Tamil Nadu, India and clients worldwide (works fully in the cloud; built for clients in India and Sweden). Domestic and international.
- Contact: email reach@entrabuild.com. WhatsApp / call +91 99444 42061. Second number +91 81245 45524. The contact form on the site ("Tell us the idea. We'll ship it.") sends the enquiry to reach@entrabuild.com and opens WhatsApp.
- IoT wing: entraiot.com. The site also has "Entraiot Tech Daily" (news.html), a Portfolio page (portfolio.html), Team, Careers, studio notes and an FAQ. Languages: English, Tamil, Kannada, Malayalam, Telugu (language button in the header).
- Team: Salvin Jones (Founder & Director, leads strategy and architecture, still writes code); Shalini Loganathan (CEO & Managing Director, runs the company day to day); Balamurugan (Deep ASI Developer, narrow AI / chat assistants and automations); Priyadharshini (Deep ASI Developer, multi-agent systems).

PRICES AND PACKAGES
- Business website: from Rs 15,000, about 15 working days. Up to 6 pages built for phones first, WhatsApp button and contact form, domain + hosting + SSL set up, basic Google search setup.
- Online store: on quote after a short call. Product catalogue and collections, online payments or WhatsApp ordering, admin dashboard for orders, optional shopping chatbot.
- Custom platform / SaaS: on quote, built and paid in phases. A separate portal for each role, approvals, reports and exports, Android and iOS apps if needed, AI features in later phases.
- Monthly care: monthly plan on quote. Fixes and small changes, updates and backups, new features each month, social media handling on request.
- On custom projects the code and data belong to the client after the final payment of each phase; hosting can run on the client's own accounts.
- DIWALI SPECIAL OFFER: flat 70% off on all software products, offer ends near Diwali. To grab it, message WhatsApp +91 99444 42061.

VOXREL (EntraBuild's own product): platform for running freelance data teams (assign work, review submissions, handle payouts) with three apps: Freelancer https://voxrel-freelancer.entrabuilt.workers.dev , Admin https://voxrel-admin.entrabuilt.workers.dev , Super Admin https://voxrel-superadmin.entrabuilt.workers.dev . Landing page: https://inquisitive-mousse-bce04d.netlify.app/ . Early-access list form is on the home page.
ENTRA CONNECT: https://entraiot-connectmain1.vercel.app (listed in the portfolio).
`;

let cache = { at: 0, text: '' };
async function projectsText(host) {
  if (cache.text && Date.now() - cache.at < 30 * 60e3) return cache.text;
  try {
    const r = await fetch(`https://${host}/content/site.json`);
    const c = await r.json();
    const lines = [];
    for (const ind of c.industries || []) {
      for (const p of ind.projects || []) {
        lines.push(`- ${p.name} (${(ind.name && ind.name.en) || ''}): ${p.desc || ''}${p.link ? ' Live: ' + p.link : ''}`);
      }
    }
    cache = { at: Date.now(), text: 'PORTFOLIO PROJECTS (from the Portfolio page)\n' + lines.join('\n') };
  } catch (e) { /* keep old cache */ }
  return cache.text || '';
}

const hits = new Map(); // tiny per-instance rate limit
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60e3);
  a.push(now); hits.set(ip, a);
  if (hits.size > 500) hits.clear();
  return a.length > 12;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(503).json({ error: 'assistant not configured' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  if (limited(ip)) return res.status(429).json({ error: 'slow down' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const msgs = Array.isArray(body && body.messages) ? body.messages : [];
  const clean = msgs.slice(-8)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return res.status(400).json({ error: 'no question' });
  const lang = ({ ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', te: 'Telugu' })[body.lang] || 'English';
  const system = `You are "Build", the assistant on the EntraBuild website (entrabuild.com). Answer questions about EntraBuild, its services, prices, process, team, portfolio projects, locations, contact details and how to use this website, using ONLY the facts below. Be friendly, clear and short (2 to 5 sentences, plain text, no markdown headings). Reply in ${lang} unless the visitor writes in another language. If the answer is not in the facts, say you are not sure and suggest WhatsApp +91 99444 42061 or email reach@entrabuild.com. Never invent prices, dates, clients or promises. If someone wants a quote or to start a project, point them to the contact form on the home page ("Start a project") or WhatsApp +91 99444 42061. Politely decline questions unrelated to EntraBuild or its website.\n${FACTS}\n${await projectsText(req.headers.host)}`;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: MODEL, temperature: 0.3, max_tokens: 400, messages: [{ role: 'system', content: system }, ...clean] })
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const j = await r.json();
    const reply = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!reply) return res.status(502).json({ error: 'empty' });
    res.status(200).json({ reply: String(reply).trim().slice(0, 1500) });
  } catch (e) {
    res.status(502).json({ error: 'assistant unavailable' });
  }
};
