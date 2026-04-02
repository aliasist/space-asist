# 🛸 SpaceSist by Aliasist

**Live space intelligence dashboard** pulling real-time data from NASA, SpaceX, ISS, and more.

🔗 **[space.aliasist.com](https://space.aliasist.com)** · [Live Demo](https://www.perplexity.ai/computer/a/spacedata-live-space-intellige-XQ_9tQUkTCOHrggWRGuyDw)

Part of the [Aliasist](https://www.aliasist.com) project suite.

---

## Features

| Tab | Data Source | What it shows |
|-----|-------------|---------------|
| 🌌 **Astronomy Picture** | NASA APOD | Daily astronomy image with full description |
| 🛰️ **ISS Tracker** | wheretheiss.at | Live ISS position (updates every 5s), crew list, orbital stats, copy-coords button |
| 🚀 **SpaceX** | SpaceX REST API | Launches, success rate, rockets, boosters, Next Launch countdown, Starlink constellation |
| ☄️ **Asteroids** | NASA NeoWs | Today's close-approach objects on radar canvas, 42,777+ NEO catalog |
| 🪐 **Exoplanets** | NASA IPAC | 6,153+ confirmed planets, discovery methods, recent finds table |
| 🔭 **Image Gallery** | NASA Images API | Hubble, JWST, Mars rover photos from NASA archives |

- **Live ticker** scrolling key stats across the top
- **Starfield canvas** animated background
- **Fully static** — pure HTML/CSS/JS, no backend, no build step
- **Session caching** — API responses cached (5 min default, 30 s for ISS) to conserve NASA rate limits
- **Error state UI** — per-section banners on API failure

---

## Deploy (Cloudflare Pages)

Pushes to `main` auto-deploy to Cloudflare Pages via GitHub Actions.

### First-time setup — add two repo secrets

Go to `github.com/aliasist/space-asist` → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Where to get it |
|-------------|-----------------|
| `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com](https://dash.cloudflare.com) → My Profile → API Tokens → Create Token → use the **"Edit Cloudflare Workers"** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on any zone page — labeled **Account ID** |

Once both secrets are added, push any commit to `main` and the action deploys automatically.

### Add the custom domain

After the first successful deploy, in Cloudflare Dashboard:
1. **Workers & Pages** → `space-asist` → **Custom domains** → Add `space.aliasist.com`
2. Cloudflare auto-creates the DNS record — done.

---

## APIs Used

| API | Endpoint | Auth |
|-----|----------|------|
| NASA APOD | `api.nasa.gov/planetary/apod` | `DEMO_KEY` |
| NASA NeoWs | `api.nasa.gov/neo/rest/v1/feed` | `DEMO_KEY` |
| NASA Images | `images-api.nasa.gov/search` | None |
| Open Notify ISS | `api.open-notify.org/iss-now.json` | None |
| SpaceX REST v4/v5 | `api.spacexdata.com` | None |
| NASA IPAC Exoplanets | `exoplanetarchive.ipac.caltech.edu/TAP/sync` | None |

> **NASA rate limits:** `DEMO_KEY` allows 30 req/hour per IP. For heavier use, get a free key at [api.nasa.gov](https://api.nasa.gov) and swap it in `js/api.js` line 4.

---

## Project Structure

```
space-asist/
├── index.html                   # Full 6-tab dashboard
├── css/style.css                # Deep-space dark theme
├── js/
│   ├── api.js                   # All API endpoints (window.API)
│   └── main.js                  # Dashboard logic, tabs, canvas, charts
└── .github/workflows/deploy.yml # Auto-deploy to Cloudflare Pages
```

---

## Running Locally

```bash
npx serve . -l 3000
# open http://localhost:3000
```

---

## Part of the Aliasist Suite

| App | URL |
|-----|-----|
| aliasist.com | [aliasist.com](https://www.aliasist.com) |
| PulseSist | [pulse.aliasist.com](https://pulse.aliasist.com) |
| DataSist | [datasist-frontend.pages.dev](https://datasist-frontend.pages.dev) |
| SpaceSist | [space.aliasist.com](https://space.aliasist.com) |
