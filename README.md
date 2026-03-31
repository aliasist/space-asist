# 🛸 Space-Asist

**Live space intelligence dashboard** pulling real-time data from NASA, SpaceX, ISS, and more.

🔗 **[Live Demo](https://www.perplexity.ai/computer/a/spacedata-live-space-intellige-XQ_9tQUkTCOHrggWRGuyDw)**

---

## Features

| Tab | Data Source | What it shows |
|-----|-------------|---------------|
| 🌌 **Astronomy Picture** | NASA APOD | Daily astronomy image with full description |
| 🛰️ **ISS Tracker** | Open Notify | Live ISS position (updates every 5s), crew list, orbital stats |
| 🚀 **SpaceX** | SpaceX REST API | 205 launches, success rate, rockets, boosters, Tesla Roadster position |
| ☄️ **Asteroids** | NASA NeoWs | Today's close-approach objects on radar canvas, 42,777+ NEO catalog |
| 🪐 **Exoplanets** | NASA IPAC | 6,153+ confirmed planets, discovery methods, recent finds table |
| 🔭 **Image Gallery** | NASA Images API | Hubble, JWST, Mars rover photos from NASA archives |

- **Live ticker** scrolling key stats across the top
- **Starfield canvas** animated background
- **Fully static** — pure HTML/CSS/JS, no backend, no build step

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

> **Note:** NASA `DEMO_KEY` is rate-limited to 30 requests/hour per IP. For heavier usage, get a free key at [api.nasa.gov](https://api.nasa.gov) and replace `DEMO_KEY` in `js/api.js`.

---

## Project Structure

```
space-asist/
├── index.html       # Full 6-tab dashboard HTML
├── css/
│   └── style.css    # Deep-space dark theme (601 lines)
└── js/
    ├── api.js       # All API endpoints abstracted into window.API
    └── main.js      # Dashboard logic — tabs, renderers, canvas, charts
```

---

## Running Locally

No build step needed — just serve the folder:

```bash
npx serve . -l 3000
# or
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

---

## Part of the Aliasist Project Bundle

Built by [Aliasist](https://github.com/aliasist) alongside:
- [stockmarket](https://github.com/aliasist/stockmarket) — Aliasist Pulse finance dashboard
- [datasist](https://github.com/aliasist/datasist) — AI data center intelligence map
