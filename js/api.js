// ─── Space Dashboard — API Layer ───────────────────────
'use strict';

const NASA_KEY = 'DEMO_KEY';
const SPACEX   = 'https://api.spacexdata.com';
const NASA     = 'https://api.nasa.gov';
const OPEN_N   = 'http://api.open-notify.org';
const EXO      = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_IMG = 'https://images-api.nasa.gov';

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

const API = {

  // ─── NASA ──────────────────────────────────────────────

  async getAPOD() {
    return fetchJSON(`${NASA}/planetary/apod?api_key=${NASA_KEY}&thumbs=true`);
  },

  async getNEO() {
    const today = new Date().toISOString().slice(0, 10);
    return fetchJSON(`${NASA}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
  },

  async getNEOStats() {
    return fetchJSON(`${NASA}/neo/rest/v1/stats?api_key=${NASA_KEY}`);
  },

  async getMarsPhotos() {
    return fetchJSON(`${NASA}/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`);
  },

  async getNASAImages(query = 'hubble nebula galaxy') {
    return fetchJSON(`${NASA_IMG}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=12`);
  },

  async getNASAImagesJWST() {
    return fetchJSON(`${NASA_IMG}/search?q=james+webb+space+telescope+galaxy&media_type=image&page_size=8`);
  },

  // ─── Open Notify (ISS) ─────────────────────────────────

  async getISSPosition() {
    return fetchJSON(`${OPEN_N}/iss-now.json`);
  },

  async getAstronauts() {
    return fetchJSON(`${OPEN_N}/astros.json`);
  },

  // ─── SpaceX ────────────────────────────────────────────

  async getSpaceXCompany() {
    return fetchJSON(`${SPACEX}/v4/company`);
  },

  async getSpaceXLaunches() {
    return fetchJSON(`${SPACEX}/v5/launches`);
  },

  async getSpaceXUpcoming() {
    return fetchJSON(`${SPACEX}/v5/launches/upcoming`);
  },

  async getSpaceXRockets() {
    return fetchJSON(`${SPACEX}/v4/rockets`);
  },

  async getSpaceXCores() {
    return fetchJSON(`${SPACEX}/v4/cores`);
  },

  async getSpaceXLandpads() {
    return fetchJSON(`${SPACEX}/v4/landpads`);
  },

  async getSpaceXRoadster() {
    return fetchJSON(`${SPACEX}/v4/roadster`);
  },

  async getSpaceXStarlink() {
    return fetchJSON(`${SPACEX}/v4/starlink`);
  },

  // ─── Exoplanets ────────────────────────────────────────

  async getExoplanetCount() {
    return fetchJSON(`${EXO}?query=select+count(*)+from+ps+where+default_flag=1&format=json`);
  },

  async getRecentExoplanets() {
    return fetchJSON(`${EXO}?query=select+pl_name,hostname,pl_orbper,pl_rade,pl_bmasse,disc_year,discoverymethod,sy_dist+from+ps+where+default_flag=1+order+by+disc_year+desc&format=json&maxrec=40`);
  },

  async getExoByMethod() {
    return fetchJSON(`${EXO}?query=select+discoverymethod,count(*)+as+count+from+ps+where+default_flag=1+group+by+discoverymethod&format=json`);
  },

};

window.API = API;
