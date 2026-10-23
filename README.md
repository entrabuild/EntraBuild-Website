# EntraBuild website

The website for **entrabuild.com**, the software studio of Entraiot Solutions.
Leadership: **Salvin Jones** (Founder & Director) and **Shalini L** (CEO & Managing Director).

There is nothing to build or install for the main site. GitHub Actions does the two automatic jobs: the daily news and the Google pages.

## What's in this repository

| Path | What it is |
|---|---|
| `index.html` | Home page: hero, industries (projects open in place with live frames), portfolio, how we build, packages, Voxrel, team, ANI · AGI · ASI, studio notes, careers, FAQ, contact, chat assistant, WhatsApp, five languages, light/dark |
| `portfolio.html` | **Portfolio**: every project on one wall, filtered by industry. Opens from the Portfolio tab after Careers |
| `news.html` | **Entraiot Tech Daily**: AI, mobile, electronics, software, security and India tech headlines |
| `admin/` | **Master admin panel** for projects, industries, portfolio images, news posts, news sources, team, notes, clients, FAQ and settings |
| `content/site.json` | All website content. The admin panel edits this file |
| `content/feeds.json` | The news sources for Tech Daily |
| `news/news.json`, `news/feed.xml` | Today's edition and our RSS feed. Written by the news job |
| `services/`, `locations/`, `work/`, `notes/` | Google-friendly pages: 5 services, 3 cities, one page per project, one per note. **Generated, don't edit by hand** |
| `sitemap.xml`, `robots.txt` | For Google and Bing. Generated |
| `scripts/build-pages.mjs` | Builds the Google pages and sitemap from `content/site.json` |
| `scripts/fetch-news.mjs` | Collects the news |
| `scripts/capture-screens.mjs`, `images/screens/` | Full-page pictures of every project website. The frames scroll through them from top to bottom like a visitor would |
| `api/news.js` | On Vercel: reads the news live if the saved edition is empty or older than 12 hours, so Tech Daily is never blank |
| `.github/workflows/` | `tech-daily.yml` runs 4 times a day; `build-pages.yml` runs whenever content changes; `screens.yml` takes the website pictures whenever projects change and every Monday |
| `assets/site.css`, `favicon.svg`, `og-image.png` | Shared styles, icon and the image shown when the link is shared on WhatsApp, LinkedIn etc. |
| `logo.png`, `apple-touch-icon.png` | Logo for Google results and the icon when someone saves the site to their phone's home screen |
| `404.html` | The page people see on a broken link, with routes back into the site |
| `_headers` (Netlify), `vercel.json` (Vercel) | Security headers, keep `/admin` out of Google, and always serve fresh news and content |

## 1. Put it live (once)

1. Push this folder to a GitHub repository, for example `entrabuild/entrabuild-website`.
2. In the repository go to **Settings → Actions → General → Workflow permissions** and choose **Read and write permissions**. Save. (The news and page jobs need this to save their results.)
3. Connect the repository to **Vercel** or **Netlify**: framework "Other", no build command, output folder = repository root. Every save in the admin redeploys the site by itself.
4. Point **entrabuild.com** to it in Cloudflare DNS.
5. The news job runs by itself the first time you push. If Tech Daily still says "on its way", go to **Actions → Entraiot Tech Daily → Run workflow**. On Vercel the page also reads the news live in the meantime.

## 2. The master admin panel

Open **entrabuild.com/admin/**.

1. On GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: only this repository.
   - Permissions: **Contents: Read and write** and **Actions: Read and write**.
2. In the admin, open **Connect to GitHub** and enter the owner, repository, branch (`main`) and the token.
3. Edit anything, then press **Save & publish**. The live site updates in about a minute, and the service, city and project pages plus the sitemap rebuild automatically.

What you can do there:
- **Projects**: add, edit, move between industries, reorder, delete. Each project gets its own page at `work/<name>.html`.
- **Industries**: add or rename industries, with names and headline words in Tamil, Kannada, Malayalam and Telugu.
- **Portfolio**: upload a screenshot for each project and mark favourites as featured.
- **News posts**: your own announcements, shown as "From Entraiot Solutions" on Tech Daily. **Run news update now** refreshes the newspaper immediately.
- **News sources**: add or switch off RSS feeds.
- **Team**: photos (upload straight from the admin), roles, LinkedIn links, translations.
- **Studio notes**: write articles. Each becomes its own Google-friendly page.
- **Clients & quotes**, **FAQ**, **Settings** (email, WhatsApp, prices, Google Analytics ID, office addresses).

The admin page is hidden from Google (`noindex`) and cannot change anything without a token. Don't share the token. If it leaks, delete it on GitHub and make a new one.

## 3. Entraiot Tech Daily

- Runs at about 06:15, 12:15, 18:15 and 00:15 India time. To change this, edit the `cron` line in `.github/workflows/tech-daily.yml`.
- Collects from XDA Developers, Android Authority, 9to5Google, 9to5Mac, The Verge, TechCrunch, Ars Technica, Wired, Hacker News, MIT Technology Review, Google AI Blog, OpenAI News, Engadget, Tom's Hardware, Hackaday, BleepingComputer, The Hacker News, The Hindu Technology and ET Tech.
- Keeps the last 72 hours. Sorts stories into AI, Mobile, Electronics, Software & IT, Security and India Tech, and skips film, sports and deal posts.
- Stores only the headline, source, time and a short summary of up to 30 words, and links every story to the original article. Please keep it that way: copying full articles from other publishers is not allowed.
- A source that is down is skipped and shown as "offline" at the bottom of the page.

## 4. Getting found on Google (do these after launch)

The site now has what Google needs: titles and descriptions on every page, structured data (organisation, both offices, services, FAQ, breadcrumbs, articles), a sitemap, share images, and 45+ pages that each target a real search ("website development Chennai", "software company Thanjavur", "AI chatbot development"…). Ranking also depends on things only you can do:

1. **Google Search Console**: add `entrabuild.com` (verify via Cloudflare DNS) and submit `https://entrabuild.com/sitemap.xml`.
2. **Google Business Profile** for both the Chennai office and the Thanjavur branch, with the website link, photos, opening hours and the category "Software company". This is the biggest single step for local searches.
3. **Reviews**: ask every happy client for a Google review. Reviews move local rankings more than anything else.
4. **Bing Webmaster Tools**: import from Search Console in one click.
5. **Listings**: Justdial, IndiaMART, Clutch, GoodFirms and LinkedIn company page, all linking to entrabuild.com.
6. **Share regularly**: post each new project and studio note on LinkedIn, Instagram and WhatsApp with the link. Every share brings visitors and helps Google trust the site.
7. **Google Analytics**: create a GA4 property and paste the `G-…` ID in Admin → Settings.

Nobody can promise first place on Google. These steps are what actually moves rankings over the following weeks.

## 5. Settings to check before launch

- WhatsApp **+91 99444 42061** and email **reach@entrabuild.com** (Admin → Settings).
- Forms send through FormSubmit. The first enquiry triggers an activation email to reach@entrabuild.com, so click the link in it once.
- Prices: only the ₹15,000 website price is set. The others say "On quote".
- Studio notes name real clients (Zivira, RSA, Pavana). Please confirm they're happy with that.
- Translations (Tamil, Kannada, Malayalam, Telugu) should be checked by native speakers.
- Project frames: after you push, the **Website screenshots** job (Actions tab) takes a full-page picture of each project website, usually within 10 minutes. Until a picture exists, the frame shows the real site at normal size, and visitors on a computer can scroll it themselves. To refresh the pictures after a client changes their site, go to **Actions → Website screenshots → Run workflow**.
- If a project's frame stays blank, untick **Live frame** for that project in Admin → Projects.

## Running things on your computer

```
npx serve .                      # preview the site
node scripts/build-pages.mjs     # rebuild Google pages after editing content/site.json by hand
node scripts/fetch-news.mjs      # collect the news now
```
