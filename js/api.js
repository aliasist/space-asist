// ─── Space Dashboard — API Layer ───────────────────────
'use strict';

const NASA_KEY = 'DEMO_KEY';
const SPACEX   = 'https://api.spacexdata.com';
const NASA     = 'https://api.nasa.gov';
const WHERETHEISS = 'https://api.wheretheiss.at/v1/satellites/25544';
const EXO      = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_IMG = 'https://images-api.nasa.gov';

// ─── Cache ─────────────────────────────────────────────
// TTLs in milliseconds
const CACHE_TTL = {
  default: 5 * 60 * 1000,   // 5 min for most endpoints
  iss:     30 * 1000,        // 30 s for live ISS position
};

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem('sa_cache_' + key);
    if (!raw) return null;
    const { ts, data, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { sessionStorage.removeItem('sa_cache_' + key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data, ttl = CACHE_TTL.default) {
  try {
    sessionStorage.setItem('sa_cache_' + key, JSON.stringify({ ts: Date.now(), data, ttl }));
  } catch { /* quota exceeded — skip caching */ }
}

async function fetchJSON(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('Fetch failed:', url, e.message);
    return null;
  }
}

async function cachedFetch(key, url, ttl = CACHE_TTL.default) {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  const data = await fetchJSON(url);
  if (data !== null) cacheSet(key, data, ttl);
  return data;
}

const API = {

  // ─── NASA ──────────────────────────────────────────────

  async getAPOD() {
    const today = new Date().toISOString().slice(0, 10);
    return cachedFetch(`apod_${today}`, `${NASA}/planetary/apod?api_key=${NASA_KEY}&thumbs=true`);
  },

  async getNEO() {
    const today = new Date().toISOString().slice(0, 10);
    return cachedFetch(`neo_${today}`, `${NASA}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
  },

  async getNEOStats() {
    return cachedFetch('neo_stats', `${NASA}/neo/rest/v1/stats?api_key=${NASA_KEY}`);
  },

  async getMarsPhotos() {
    return cachedFetch('mars_photos', `${NASA}/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`);
  },

  async getNASAImages(query = 'hubble nebula galaxy') {
    return cachedFetch(`nasa_img_${query}`, `${NASA_IMG}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=12`);
  },

  async getNASAImagesJWST() {
    return cachedFetch('nasa_img_jwst', `${NASA_IMG}/search?q=james+webb+space+telescope+galaxy&media_type=image&page_size=8`);
  },

  // ─── ISS Position (wheretheiss.at) ────────────────────

  async getISSPosition() {
    // Short TTL — live position updates every 5 s in the UI
    return cachedFetch('iss_pos', WHERETHEISS, CACHE_TTL.iss);
  },

  async getAstronauts() {
    return cachedFetch('astronauts', 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json');
  },

  // ─── SpaceX ────────────────────────────────────────────

  async getSpaceXCompany() {
    return cachedFetch('sx_company', `${SPACEX}/v4/company`);
  },

  async getSpaceXLaunches() {
    return cachedFetch('sx_launches', `${SPACEX}/v5/launches`);
  },

  async getSpaceXUpcoming() {
    return cachedFetch('sx_upcoming', `${SPACEX}/v5/launches/upcoming`);
  },

  async getSpaceXRockets() {
    return cachedFetch('sx_rockets', `${SPACEX}/v4/rockets`);
  },

  async getSpaceXCores() {
    return cachedFetch('sx_cores', `${SPACEX}/v4/cores`);
  },

  async getSpaceXLandpads() {
    return cachedFetch('sx_landpads', `${SPACEX}/v4/landpads`);
  },

  async getSpaceXRoadster() {
    return cachedFetch('sx_roadster', `${SPACEX}/v4/roadster`);
  },

  async getSpaceXStarlink() {
    return cachedFetch('sx_starlink', `${SPACEX}/v4/starlink`);
  },

  // ─── Exoplanets ────────────────────────────────────────

  async getExoplanetCount() {
    return cachedFetch('exo_count', `${EXO}?query=select+count(*)+from+ps+where+default_flag=1&format=json`);
  },

  async getRecentExoplanets() {
    return cachedFetch('exo_recent', `${EXO}?query=select+pl_name,hostname,pl_orbper,pl_rade,pl_bmasse,disc_year,discoverymethod,sy_dist+from+ps+where+default_flag=1+order+by+disc_year+desc&format=json&maxrec=40`);
  },

  async getExoByMethod() {
    return cachedFetch('exo_methods', `${EXO}?query=select+discoverymethod,count(*)+as+count+from+ps+where+default_flag=1+group+by+discoverymethod&format=json`);
  },

};

window.API = API;
