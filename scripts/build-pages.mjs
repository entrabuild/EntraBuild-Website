// Builds the search-engine pages from content/site.json:
//   services/*.html, locations/*.html, work/<project>.html, notes/<note>.html, sitemap.xml, robots.txt
// Run: node scripts/build-pages.mjs   (GitHub Actions runs it automatically when content/site.json changes)
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://entrabuild.com';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const S = C.settings;
const TODAY = new Date().toISOString().slice(0, 10);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const prettyWa = '+' + S.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
const waLink = t => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(t)}`;

const PROJECTS = {};
C.industries.forEach(ind => ind.projects.forEach(p => { PROJECTS[p.id] = { ...p, industry: ind.name.en }; }));
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const canFrame = p => p.link && !/t\.me\//.test(p.link) && p.frame !== false;

/* ---------- services and locations (edit the wording here) ---------- */
const SERVICES = [
  { slug: 'website-development', name: 'Website development',
    title: 'Website Development Company in Chennai, Tamil Nadu',
    h1: 'Website development that brings you customers',
    lead: 'Business websites built for phones first, fast to load and easy to find on Google. From ₹15,000, usually live in about 15 working days.',
    paras: ['Most customers judge your business by its website before they ever call. We design and build sites that load quickly on a phone, explain what you do in plain words, and make it easy to reach you on WhatsApp, by phone or through a form.',
            'Every site comes with your domain, hosting, SSL, basic Google search setup and a contact form that sends enquiries straight to your inbox. If you want to update it yourself later, we add a simple admin panel.'],
    includes: ['Up to 6 pages, designed for phones first', 'WhatsApp button, call button and contact form', 'Domain, hosting and SSL set up', 'Google search basics: titles, descriptions and a sitemap', 'Speed tuning so pages open fast on mobile data', 'Optional Tamil, Kannada, Malayalam or Telugu versions'],
    projects: ['pavana-silks', 'tnwla-madras', 'berserk-gym', 'good-icecreams', 'the-perch', 'solar-green'],
    faq: [['How much does a website cost in Chennai?', 'Our business websites start from ₹15,000 plus GST. The final price depends on the number of pages, languages and features such as booking or payments.'],
          ['Can you redesign my existing website?', 'Yes. We keep what works, move your content across, and rebuild the design and speed so it works properly on phones.'],
          ['Will my website show up on Google?', 'We set up the basics Google needs: page titles, descriptions, a sitemap and fast loading. Ranking also depends on your Google Business Profile, reviews and fresh content, and we guide you on those.']],
    keywords: 'website development Chennai, web design company Chennai, website designer Thanjavur, website development Bangalore, business website price' },
  { slug: 'ecommerce-development', name: 'E-commerce development',
    title: 'E-commerce Website Development in Chennai',
    h1: 'Online stores that sell, on WhatsApp and the web',
    lead: 'Product catalogues, online payments or WhatsApp ordering, and a dashboard to manage orders. Built for shoppers who buy on their phones.',
    paras: ['Many Indian shops already sell through WhatsApp and Instagram. We build stores that fit that habit: customers browse your collection, then pay online through Razorpay or send the order straight to your WhatsApp.',
            'Behind the store you get an admin dashboard for products, orders and customers, and we can add a shopping chatbot that answers questions about sizes, prices and delivery at any hour.'],
    includes: ['Product catalogue with collections and filters', 'Razorpay online payments or WhatsApp ordering', 'Admin dashboard for products and orders', 'Shopping chatbot (optional)', 'Instagram and WhatsApp links', 'Delivery and pin-code rules'],
    projects: ['bhuvannam-silks', 'pavana-silks', 'jeni', 'jpt-co'],
    faq: [['How much does an online store cost?', 'Online stores are quoted after a short call, because the price depends on the number of products, payment methods and extras like a chatbot. You always get a fixed quote before we start.'],
          ['Can customers order on WhatsApp instead of paying online?', 'Yes. Many of our clients prefer WhatsApp ordering. The store sends the full order to your WhatsApp and you confirm payment directly.'],
          ['Can I add products myself?', 'Yes. You get an admin dashboard where you can add products, change prices and see orders from your phone or computer.']],
    keywords: 'ecommerce website development Chennai, online store development, WhatsApp ordering website, Razorpay website, saree website development' },
  { slug: 'custom-software-development', name: 'Custom software & SaaS',
    title: 'Custom Software & SaaS Development, Chennai',
    h1: 'Custom software built around how your team works',
    lead: 'Portals for every role, approvals, reports and mobile apps. We replace spreadsheets, paper books and rented tools with software you own.',
    paras: ['Off-the-shelf tools make your team change how it works. We do the opposite: we study how work actually moves through your company, then build the software around it, with a separate portal for each role from field staff to head office.',
            'We have replaced a pharma company\'s rented sales tool with its own platform, turned a construction company\'s handwritten books into a billing and stock system, and built multi-portal platforms for speech data teams. Projects run in phases, so you start using the software early and pay as each phase is delivered.'],
    includes: ['Separate portals for each role (staff, managers, admin, super admin)', 'Approval flows, reports and Excel exports', 'Android and iOS apps when your team works in the field', 'Cloud hosting on accounts in your name', 'Code and data are yours after each phase is paid', 'AI features added in later phases'],
    projects: ['zivira-labs', 'rsa-construction', 'samhita-stotra', 'buildvaultry', 'voxrel', 'nordic-affairs-media'],
    faq: [['How much does custom software cost?', 'It depends on the number of roles, screens and integrations. We start with a requirements document and a phased proposal, so you know the cost of each phase before it starts.'],
          ['Can you replace software we pay for every month?', 'Often, yes. We map every screen you use today and rebuild what you need, so you stop paying per user and own the result.'],
          ['Who hosts the software?', 'It runs on cloud platforms such as Render, Vercel, Cloudflare or Google Cloud, preferably on accounts in your company\'s name.']],
    keywords: 'custom software development Chennai, SaaS development company India, ERP CRM development, sales force automation software, software company Thanjavur' },
  { slug: 'mobile-app-development', name: 'Mobile app development',
    title: 'Mobile App Development Company in Chennai',
    h1: 'Android and iOS apps for teams on the move',
    lead: 'Apps for field staff, site managers and customers, connected to the same system your office uses.',
    paras: ['When your people work on sites, in shops or on the road, your office system needs to go with them. We build Android and iOS apps that share one backend with your web portals, so a delivery note entered on site shows up at head office straight away.',
            'Apps can create PDFs, share them on WhatsApp, upload photos and handle simple forms, and we publish them to the Play Store and App Store under your company\'s account.'],
    includes: ['Android and iOS apps from one codebase', 'Same data as your web portals', 'PDF creation and WhatsApp sharing', 'Photo upload and simple forms', 'Play Store and App Store publishing', 'Updates and support after launch'],
    projects: ['rsa-construction', 'velankanni-madha', 'zivira-labs'],
    faq: [['Do you build both Android and iOS apps?', 'Yes. We usually build both from one codebase, which keeps the cost down and keeps both apps in step.'],
          ['Can the app work with our existing website or software?', 'Yes. The app talks to the same backend as your portals, or we connect it to your existing system.'],
          ['Who publishes the app to the stores?', 'We do, under your developer account, so the app belongs to your company.']],
    keywords: 'mobile app development Chennai, Android app development company, iOS app development India, field force app, construction app' },
  { slug: 'ai-chatbot-automation', name: 'AI chatbots & automation',
    title: 'AI Chatbot & Automation Development, Chennai',
    h1: 'AI chatbots and automation that save your team hours',
    lead: 'Chat assistants that answer customers and collect leads, and automation that does repetitive work for you.',
    paras: ['Most of the value of AI today comes from narrow AI (ANI): one assistant that answers questions about your products, or one bot that does a repetitive job well. We build those, connected to your website, WhatsApp and internal tools.',
            'Our own products show what this looks like: a deals bot that posts to Telegram around the clock, a sales engine that finds and scores leads, and a tool that makes PDFs readable for screen readers. Our Deep ASI developers also work on multi-agent systems, the next step toward more general AI (AGI).'],
    includes: ['Website and WhatsApp chat assistants', 'Leads sent straight to your inbox', 'Document reading and data extraction', 'Scheduled bots and automation', 'Multi-agent workflows for bigger jobs', 'Clear costs for any paid AI services'],
    projects: ['nordic-affairs-media', 'affiliated-factory', 'sales-engine', 'pdf-agi', 'bhuvannam-silks', 'viral-ai'],
    faq: [['Do I need to pay for ChatGPT or another AI service?', 'Not always. Some assistants run on built-in answers with no monthly AI bill. Where a paid AI service helps, we tell you the expected cost upfront.'],
          ['Can the chatbot speak Tamil or other Indian languages?', 'Yes. Assistants can greet and answer in Tamil, Kannada, Malayalam, Telugu and English.'],
          ['What is the difference between ANI, AGI and ASI?', 'ANI is AI that does one job well, which is what businesses use today. AGI would learn across many tasks like a person, and ASI would go beyond human ability. We ship ANI and research toward the others.']],
    keywords: 'AI chatbot development Chennai, WhatsApp chatbot, business automation India, AI agents, ANI AGI ASI' }
];
const office = n => S.offices.find(o => o.city === n);
const LOCATIONS = [
  { slug: 'chennai', city: 'Chennai', office: office('Chennai'),
    title: 'Software & Website Development Company in Chennai',
    lead: 'Websites, online stores, custom software, mobile apps and AI chatbots, from our office on Iyyappanthangal Main Road, Chennai.',
    paras: ['EntraBuild is the software studio of Entraiot Solutions. Our Chennai office is where we meet clients by appointment, but most of our work happens in the cloud, so you can start without leaving your own office.',
            'Chennai businesses we have built for include TNWLA Madras, Good Icecreams & Coffee in Teynampet, Berserk Gym in Palavakkam and The Perch.'],
    projects: ['tnwla-madras', 'good-icecreams', 'berserk-gym', 'the-perch', 'stand-firm', 'zivira-labs'] },
  { slug: 'bangalore', city: 'Bangalore', office: null,
    title: 'Software & App Development for Bangalore',
    lead: 'Custom platforms, SaaS products, mobile apps and AI automation for Bangalore companies, delivered fully online.',
    paras: ['We work with Bangalore businesses entirely in the cloud: video calls, demo links you can open every week, and deployment on cloud platforms. In-person meetings can be arranged by appointment.',
            'Bangalore companies come to us for the same work we deliver for clients in Chennai, Thanjavur and Sweden: multi-portal platforms, mobile apps for field teams, and practical AI.'],
    projects: ['zivira-labs', 'samhita-stotra', 'voxrel', 'buildvaultry', 'sales-engine', 'nordic-affairs-media'] },
  { slug: 'thanjavur', city: 'Thanjavur', office: office('Thanjavur'),
    title: 'Software & Website Development Company in Thanjavur',
    lead: 'Websites, online stores and custom software for Thanjavur and the delta region, from our branch on N.K. Road.',
    paras: ['Thanjavur is where EntraBuild\'s roots are. Our branch on N.K. Road helps local businesses move online, with websites that work on every phone and stores that take orders on WhatsApp.',
            'We have built for silk brands that weave Kancheepuram and Thanjavur sarees, for temple services such as eArchana, and for clients as far away as Sweden, all from here.'],
    projects: ['pavana-silks', 'bhuvannam-silks', 'earchana', 'rsa-construction', 'jeni', 'affiliated-factory'] }
];

/* ---------- page shell ---------- */
const ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3z"/></svg>';
function metaDesc(t) {
  let d = String(t || '').replace(/\s+/g, ' ').trim();
  if (d.length < 70) d = `${d.replace(/\.?$/, '.')} Built by EntraBuild, a software studio in Chennai and Bangalore for Tamil Nadu, India and other countries.`;
  if (d.length > 158) { d = d.slice(0, 155); d = d.slice(0, d.lastIndexOf(' ')).replace(/[,;:.\s—-]+$/, '') + '…'; }
  return d;
}
function shell({ depth, url, title, desc, keywords = '', jsonld = [], body, type = 'website' }) {
  const up = '../'.repeat(depth);
  desc = metaDesc(desc);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} | EntraBuild</title>
<meta name="description" content="${esc(desc)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<link rel="canonical" href="${SITE}/${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="EntraBuild"><meta property="og:url" content="${SITE}/${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${SITE}/og-image.png"><meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/og-image.png">
<meta name="theme-color" content="#F3F4F8">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="${up}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="${up}assets/site.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
<script>try{var t=sessionStorage.getItem('eb-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="${up}index.html"><b>&lt;/&gt;</b>EntraBuild</a>
  <nav class="nav" aria-label="Main"><a href="${up}portfolio.html">Portfolio</a><a href="${up}services/website-development.html">Services</a><a href="${up}news.html">Tech Daily</a><a href="https://entraiot.com" target="_blank" rel="noopener">IoT Wing</a>
  <button class="themeb" type="button" id="themeBtn" aria-label="Switch theme"></button><a class="cta" href="${up}index.html#contact">Start a project</a></nav>
</div></header>
<main>
<div class="wrap"><a class="backlink" href="${up}index.html" data-back>← Back</a></div>
${body}
<section class="cta-band"><div class="wrap"><h2>Tell us the idea. <em class="s">We'll ship it.</em></h2>
<div class="btns"><a class="btn solid" href="${up}index.html#contact">Start a project</a><a class="btn" href="${waLink('Hi EntraBuild, I saw ' + title + ' and would like to talk.')}" target="_blank" rel="noopener">WhatsApp ${esc(prettyWa)}</a></div></div></section>
</main>
<footer class="foot"><div class="wrap">
  <div class="cols">
    <div><b>Services</b>${SERVICES.map(s => `<a href="${up}services/${s.slug}.html">${esc(s.name)}</a>`).join('')}</div>
    <div><b>Locations</b>${LOCATIONS.map(l => `<a href="${up}locations/${l.slug}.html">Software company in ${l.city}</a>`).join('')}</div>
    <div><b>Read</b><a href="${up}news.html">Entraiot Tech Daily</a><a href="${up}portfolio.html">Portfolio</a><a href="${up}index.html#faq">Questions</a></div>
    <div><b>Contact</b><a href="mailto:${esc(S.email)}">${esc(S.email)}</a><a href="${waLink('Hi EntraBuild')}" target="_blank" rel="noopener">${esc(prettyWa)}</a><a href="https://entraiot.com" target="_blank" rel="noopener">IoT Wing</a></div>
  </div>
  <div class="legal"><span>© ${new Date().getFullYear()} EntraBuild · An Entraiot Solutions studio</span><span>Chennai · Bangalore · Tamil Nadu, India · Worldwide</span></div>
</div></footer>
<a class="wa" href="${waLink('Hi EntraBuild, I found you on entrabuild.com.')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON_WA}</a>
<script>
(function(){var b=document.getElementById('themeBtn'),r=document.documentElement;
var sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',moon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function dark(){return r.dataset.theme==='dark'}
function lbl(){b.innerHTML=dark()?sun:moon}lbl();
b.onclick=function(){var n=dark()?'light':'dark';r.dataset.theme=n;try{sessionStorage.setItem('eb-theme',n)}catch(e){}lbl()};
document.querySelectorAll('[data-back]').forEach(function(a){a.addEventListener('click',function(e){
  try{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1){e.preventDefault();history.back()}}catch(x){}})});
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,VH=800,FW=1280;
function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function humanY(t,dist){if(dist<=0)return 0;var step=VH*.7,P=1400,M=1100,E=2600,B=1800,T=1600,n=Math.ceil(dist/step),down=n*(P+M),c=T+down+E+B,x=t%c;
  if(x<T)return 0;x-=T;if(x<down){var i=Math.floor(x/(P+M)),r=x-i*(P+M),f=Math.min(dist,i*step),to=Math.min(dist,(i+1)*step);return r<P?f:f+(to-f)*ease((r-P)/M)}
  x-=down;if(x<E)return dist;x-=E;return dist*(1-ease(x/B))}
var screens=[].slice.call(document.querySelectorAll('.screen[data-src]'));
if(screens.length)fetch('${up}images/screens/index.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(j){
  var items=(j&&j.items)||{};
  screens.forEach(function(s){var shot=items[s.dataset.id],f=s.querySelector('iframe'),t0=performance.now();
    if(shot&&shot.h>0){f.remove();var img=document.createElement('img');img.className='shot';img.alt='';img.setAttribute('aria-hidden','true');s.appendChild(img);s.classList.add('has-shot');
      new IntersectionObserver(function(es){if(es[0].isIntersecting&&!img.src){img.onload=function(){s.classList.add('loaded')};img.src='${up}images/screens/'+s.dataset.id+'.jpg?v='+(shot.v||'')}}).observe(s);
      (function loop(now){if(s.classList.contains('loaded')&&img.naturalWidth){var w=s.clientWidth,sc=w/FW,full=img.naturalHeight*(w/img.naturalWidth),dist=Math.max(0,full-s.clientHeight);
        if(s.matches(':hover'))t0+=16;else img.style.transform=reduce?'none':'translateY('+(-humanY(now-t0,dist/sc)*sc)+'px)'}requestAnimationFrame(loop)})(t0);return}
    new IntersectionObserver(function(es){if(es[0].isIntersecting&&!f.src){f.onload=function(){s.classList.add('loaded')};f.src=s.dataset.src}}).observe(s);
    (function loop(){f.style.transform='scale('+(s.clientWidth/FW)+')';requestAnimationFrame(loop)})()})});
})();
</script>
</body>
</html>
`;
}
const crumbs = (depth, items) => `<div class="wrap crumbs"><a href="${'../'.repeat(depth)}index.html">Home</a>${items.map(([n, h]) => ` / ${h ? `<a href="${h}">${esc(n)}</a>` : esc(n)}`).join('')}</div>`;
const breadcrumbLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], ...items].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) });
const faqLd = faq => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = faq => `<div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const projCards = (ids, depth) => `<div class="cards">${ids.filter(id => PROJECTS[id]).map(id => { const p = PROJECTS[id]; return `<a class="card" href="${'../'.repeat(depth)}work/${p.id}.html"><small>${esc(p.industry)}</small><b>${esc(p.name)}</b><span>${esc(p.desc)}</span></a>`; }).join('')}</div>`;
const frame = p => `<div class="browser"><div class="bar"><i></i><i></i><i></i><span>${esc(host(p.link))}</span></div><div class="screen" data-id="${esc(p.id)}" data-src="${esc(p.link)}"><div class="fb">${esc(p.name)} · live preview</div><iframe title="${esc(p.name)} live preview" tabindex="-1" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div></div>`;
const orgRef = { '@type': 'Organization', name: 'EntraBuild', url: SITE, parentOrganization: { '@type': 'Organization', name: 'Entraiot Solutions', url: 'https://entraiot.com' } };

function write(rel, html) { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); urls.push(rel); }
const urls = [];

// clear old generated folders so deleted projects disappear
for (const d of ['services', 'locations', 'work', 'notes']) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });

/* services */
for (const s of SERVICES) {
  const url = `services/${s.slug}.html`;
  write(url, shell({ depth: 1, url, title: s.title, desc: s.lead, keywords: s.keywords,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.lead, provider: orgRef, areaServed: ['Chennai', 'Bangalore', 'Thanjavur', 'India'].map(n => ({ '@type': 'Place', name: n })), url: `${SITE}/${url}` },
             breadcrumbLd([['Services', `${SITE}/services/website-development.html`], [s.name, `${SITE}/${url}`]]), faqLd(s.faq)],
    body: `${crumbs(1, [['Services', 'website-development.html'], [s.name]])}
<section class="hero"><div class="wrap"><div class="eyebrow">${esc(s.name)} · Chennai · Bangalore · Tamil Nadu, India · Worldwide</div><h1>${esc(s.h1)}</h1><p class="lead">${esc(s.lead)}</p>
<div class="btns"><a class="btn solid" href="../index.html#contact">Get a quote</a><a class="btn" href="../index.html#pricing">See packages</a></div></div></section>
<section class="block"><div class="wrap prose">${s.paras.map(p => `<p>${esc(p)}</p>`).join('')}</div></section>
<section class="block"><div class="wrap"><h2>What you <em class="s">get</em></h2><ul class="ticks">${s.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div></section>
<section class="block"><div class="wrap"><h2>Projects we've <em class="s">built</em></h2>${projCards(s.projects, 1)}</div></section>
<section class="block"><div class="wrap"><h2>Questions</h2>${faqHtml(s.faq)}</div></section>
<section class="block"><div class="wrap"><h2>Other services</h2><div class="cards">${SERVICES.filter(x => x !== s).map(x => `<a class="card" href="${x.slug}.html"><small>Service</small><b>${esc(x.name)}</b><span>${esc(x.lead)}</span></a>`).join('')}</div></div></section>` }));
}

/* locations */
for (const l of LOCATIONS) {
  const url = `locations/${l.slug}.html`;
  const o = l.office;
  const faq = [[`Do you have an office in ${l.city}?`, o ? `Yes. Our ${o.name.toLowerCase()} is at ${o.lines.join(', ')}. Meetings are by appointment, and most work happens online.` : `We work with ${l.city} clients fully online, with in-person meetings by appointment. Our offices are in Chennai and Thanjavur.`],
               [`How much does a website cost in ${l.city}?`, 'Business websites start from ₹15,000 plus GST and usually take about 15 working days. Stores and custom software are quoted after a short call.'],
               ['Can we meet in person?', 'Yes, by appointment. Most clients start with a video call and see working demo links every week.']];
  const ld = [breadcrumbLd([['Locations', `${SITE}/${url}`], [l.city, `${SITE}/${url}`]]), faqLd(faq)];
  if (o) ld.push({ '@context': 'https://schema.org', '@type': 'ProfessionalService', name: `EntraBuild — ${o.name}`, url: `${SITE}/${url}`, image: `${SITE}/og-image.png`, telephone: '+' + S.whatsapp, email: S.email, priceRange: '₹₹',
    address: { '@type': 'PostalAddress', streetAddress: o.street, addressLocality: o.city, addressRegion: 'Tamil Nadu', postalCode: o.postal, addressCountry: 'IN' }, parentOrganization: orgRef });
  write(url, shell({ depth: 1, url, title: l.title, desc: l.lead, keywords: `software company ${l.city}, website development ${l.city}, app development ${l.city}, web design ${l.city}, IT company ${l.city}`, jsonld: ld,
    body: `${crumbs(1, [['Locations'], [l.city]])}
<section class="hero"><div class="wrap"><div class="eyebrow">EntraBuild in ${l.city}</div><h1>Software company in <em class="s">${l.city}</em></h1><p class="lead">${esc(l.lead)}</p>
<div class="btns"><a class="btn solid" href="../index.html#contact">Start a project</a><a class="btn" href="../portfolio.html">See our work</a></div></div></section>
<section class="block"><div class="wrap prose">${l.paras.map(p => `<p>${esc(p)}</p>`).join('')}
${o ? `<div class="office"><div class="eyebrow">${esc(o.name)}</div><address>${o.lines.map(esc).join('<br>')}</address><a href="${esc(/^https:\/\//.test(o.map||'')?o.map:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(o.lines.join(' ')))}" target="_blank" rel="noopener">Open in Maps ↗</a></div>` : ''}</div></section>
<section class="block"><div class="wrap"><h2>What we build in ${l.city}</h2><div class="cards">${SERVICES.map(x => `<a class="card" href="../services/${x.slug}.html"><small>Service</small><b>${esc(x.name)}</b><span>${esc(x.lead)}</span></a>`).join('')}</div></div></section>
<section class="block"><div class="wrap"><h2>Selected <em class="s">work</em></h2>${projCards(l.projects, 1)}</div></section>
<section class="block"><div class="wrap"><h2>Questions</h2>${faqHtml(faq)}</div></section>` }));
}

/* projects */
for (const ind of C.industries) for (const p of ind.projects) {
  const url = `work/${p.id}.html`;
  const related = ind.projects.filter(x => x.id !== p.id).map(x => x.id);
  const svc = SERVICES.filter(s => s.projects.includes(p.id));
  write(url, shell({ depth: 1, url, type: 'article', title: `${p.name} — ${ind.name.en} project`, desc: `${p.name}: ${p.desc}. ${p.built}`,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, about: ind.name.en, description: p.built, creator: orgRef, url: `${SITE}/${url}`, ...(p.link ? { sameAs: p.link } : {}), keywords: (p.tools || []).join(', ') },
             breadcrumbLd([['Portfolio', `${SITE}/portfolio.html`], [p.name, `${SITE}/${url}`]])],
    body: `${crumbs(1, [['Portfolio', '../portfolio.html'], [ind.name.en], [p.name]])}
<section class="hero"><div class="wrap"><div class="eyebrow">${esc(ind.name.en)}${p.tag ? ' · ' + esc(p.tag) : ''}</div><h1>${esc(p.name)}</h1><p class="lead">${esc(p.desc)}</p>
${p.link ? `<div class="btns"><a class="btn solid" href="${esc(p.link)}" target="_blank" rel="noopener">See it live ↗</a></div>` : ''}</div></section>
${canFrame(p) ? `<section class="block"><div class="wrap">${frame(p)}</div></section>` : ''}
${p.image ? `<section class="block"><div class="wrap"><img src="../${esc(p.image)}" alt="${esc(p.name)}" style="border-radius:16px;border:1px solid var(--line)"></div></section>` : ''}
<section class="block"><div class="wrap prose"><div class="eyebrow">What they needed</div><p>${esc(p.need)}</p><div class="eyebrow" style="margin-top:22px">What we built</div><p>${esc(p.built)}</p>
<div class="eyebrow" style="margin-top:22px">Built with</div><div class="tools" style="margin-top:8px">${(p.tools || []).map(t => `<span>${esc(t)}</span>`).join('')}</div></div></section>
${svc.length ? `<section class="block"><div class="wrap"><h2>Related services</h2><div class="cards">${svc.map(x => `<a class="card" href="../services/${x.slug}.html"><small>Service</small><b>${esc(x.name)}</b><span>${esc(x.lead)}</span></a>`).join('')}</div></div></section>` : ''}
${related.length ? `<section class="block"><div class="wrap"><h2>More in ${esc(ind.name.en)}</h2>${projCards(related, 1)}</div></section>` : ''}` }));
}

/* notes */
for (const n of C.notes || []) {
  const id = n.id.replace(/^n-/, '');
  const url = `notes/${id}.html`;
  write(url, shell({ depth: 1, url, type: 'article', title: n.h, desc: n.s,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: n.h, description: n.s, author: orgRef, publisher: orgRef, mainEntityOfPage: `${SITE}/${url}`, image: `${SITE}/og-image.png` }, breadcrumbLd([['Notes', `${SITE}/#notes`], [n.h, `${SITE}/${url}`]])],
    body: `${crumbs(1, [['Studio notes', '../index.html#notes'], [n.h]])}
<section class="hero"><div class="wrap"><div class="eyebrow">${esc(n.k)}</div><h1>${esc(n.h)}</h1><p class="lead">${esc(n.s)}</p></div></section>
<section class="block"><div class="wrap prose">${(n.body || []).map(p => `<p>${esc(p)}</p>`).join('')}</div></section>` }));
}

/* sitemap + robots */
const all = ['', 'portfolio.html', 'news.html', ...urls];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url><loc>${SITE}/${u}</loc><lastmod>${TODAY}</lastmod><changefreq>${u === 'news.html' ? 'hourly' : u === '' ? 'weekly' : 'monthly'}</changefreq><priority>${u === '' ? '1.0' : u.startsWith('services') || u.startsWith('locations') ? '0.9' : u === 'news.html' ? '0.8' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${urls.length} pages + sitemap.xml + robots.txt`);
