// ─── Space Dashboard — API Layer ───────────────────────
'use strict';

const NASA_KEY = (typeof window !== 'undefined' && window.SPACE_ASIST_NASA_KEY) || 'DEMO_KEY';
const SPACEX   = 'https://api.spacexdata.com';
const NASA     = 'https://api.nasa.gov';
const WHERETHEISS = 'https://api.wheretheiss.at/v1/satellites/25544';
const EXO      = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_IMG = 'https://images-api.nasa.gov';

const FALLBACK_APOD = {
  date: '2026-05-03',
  title: 'Pillars of Creation in Infrared',
  explanation: 'A fallback astronomy view shown when the NASA APOD API is rate-limited. The Eagle Nebula\'s iconic star-forming columns remain one of the most dramatic windows into stellar birth ever captured.',
  media_type: 'image',
  url: 'https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg',
  hdurl: 'https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg',
  copyright: 'NASA, ESA, and the Hubble Heritage Team',
};

const FALLBACK_NEO_FEED = {
  element_count: 11,
  near_earth_objects: {
    '2026-05-03': [
      { name: '2026 FN1', close_approach_data: [{ miss_distance: { kilometers: '3240000' }, relative_velocity: { kilometers_per_hour: '35628' } }], estimated_diameter: { meters: { estimated_diameter_min: 13, estimated_diameter_max: 30 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 FA4', close_approach_data: [{ miss_distance: { kilometers: '6260000' }, relative_velocity: { kilometers_per_hour: '41927' } }], estimated_diameter: { meters: { estimated_diameter_min: 16, estimated_diameter_max: 36 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 FF2', close_approach_data: [{ miss_distance: { kilometers: '12300000' }, relative_velocity: { kilometers_per_hour: '80024' } }], estimated_diameter: { meters: { estimated_diameter_min: 44, estimated_diameter_max: 98 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 DS11', close_approach_data: [{ miss_distance: { kilometers: '14280000' }, relative_velocity: { kilometers_per_hour: '25822' } }], estimated_diameter: { meters: { estimated_diameter_min: 48, estimated_diameter_max: 108 } }, is_potentially_hazardous_asteroid: false },
      { name: '2024 PP1', close_approach_data: [{ miss_distance: { kilometers: '16040000' }, relative_velocity: { kilometers_per_hour: '47389' } }], estimated_diameter: { meters: { estimated_diameter_min: 7, estimated_diameter_max: 16 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 EY1', close_approach_data: [{ miss_distance: { kilometers: '21770000' }, relative_velocity: { kilometers_per_hour: '29203' } }], estimated_diameter: { meters: { estimated_diameter_min: 139, estimated_diameter_max: 310 } }, is_potentially_hazardous_asteroid: false },
      { name: '2024 TT5', close_approach_data: [{ miss_distance: { kilometers: '23470000' }, relative_velocity: { kilometers_per_hour: '57195' } }], estimated_diameter: { meters: { estimated_diameter_min: 31, estimated_diameter_max: 70 } }, is_potentially_hazardous_asteroid: false },
      { name: '2023 GR1', close_approach_data: [{ miss_distance: { kilometers: '27530000' }, relative_velocity: { kilometers_per_hour: '21468' } }], estimated_diameter: { meters: { estimated_diameter_min: 22, estimated_diameter_max: 49 } }, is_potentially_hazardous_asteroid: false },
    ],
  },
};

const FALLBACK_NEO_STATS = {
  near_earth_object_count: 42777,
  close_approach_count: 913332,
  last_updated: 'Fallback snapshot',
};

const FALLBACK_MARS = {
  latest_photos: [
    {
      img_src: 'https://images-assets.nasa.gov/image/PIA23764/PIA23764~medium.jpg',
      sol: 4132,
      earth_date: '2026-04-28',
      rover: { name: 'Curiosity' },
      camera: { full_name: 'Mast Camera' },
    },
    {
      img_src: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~medium.jpg',
      sol: 4127,
      earth_date: '2026-04-21',
      rover: { name: 'Curiosity' },
      camera: { full_name: 'Front Hazard Avoidance Camera' },
    },
  ],
};

const FALLBACK_EXO_COUNT = [{ 'count(*)': 6153 }];
const FALLBACK_EXO_METHODS = [
  { discoverymethod: 'Transit', count: 4372 },
  { discoverymethod: 'Radial Velocity', count: 1099 },
  { discoverymethod: 'Microlensing', count: 230 },
  { discoverymethod: 'Imaging', count: 86 },
  { discoverymethod: 'Transit Timing Variations', count: 25 },
  { discoverymethod: 'Astrometry', count: 13 },
];
const FALLBACK_EXO_PLANETS = [
  { pl_name: 'TOI-715 b', hostname: 'TOI-715', pl_orbper: 19.29, pl_rade: 1.55, pl_bmasse: 3.02, disc_year: 2026, discoverymethod: 'Transit', sy_dist: 42.4 },
  { pl_name: 'HD 88986 c', hostname: 'HD 88986', pl_orbper: 146.1, pl_rade: null, pl_bmasse: 17.4, disc_year: 2026, discoverymethod: 'Radial Velocity', sy_dist: 33.8 },
  { pl_name: 'K2-415 b', hostname: 'K2-415', pl_orbper: 4.01, pl_rade: 1.02, pl_bmasse: 2.7, disc_year: 2025, discoverymethod: 'Transit', sy_dist: 64.7 },
  { pl_name: 'HIP 99770 b', hostname: 'HIP 99770', pl_orbper: null, pl_rade: null, pl_bmasse: 5040, disc_year: 2025, discoverymethod: 'Imaging', sy_dist: 41.9 },
  { pl_name: 'OGLE-2018-BLG-0677Lb', hostname: 'OGLE-2018-BLG-0677L', pl_orbper: null, pl_rade: null, pl_bmasse: 95.3, disc_year: 2025, discoverymethod: 'Microlensing', sy_dist: 2700 },
  { pl_name: 'Kepler-1649 c', hostname: 'Kepler-1649', pl_orbper: 19.54, pl_rade: 1.06, pl_bmasse: null, disc_year: 2020, discoverymethod: 'Transit', sy_dist: 92.4 },
];

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
    return (await fetchJSON(`${NASA}/planetary/apod?api_key=${NASA_KEY}&thumbs=true`)) || FALLBACK_APOD;
  },

  async getNEO() {
    const today = new Date().toISOString().slice(0, 10);
    const data = await fetchJSON(`${NASA}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
    if (data) return data;
    return { ...FALLBACK_NEO_FEED, near_earth_objects: { [today]: FALLBACK_NEO_FEED.near_earth_objects['2026-05-03'] } };
  },

  async getNEOStats() {
    return (await fetchJSON(`${NASA}/neo/rest/v1/stats?api_key=${NASA_KEY}`)) || FALLBACK_NEO_STATS;
  },

  async getMarsPhotos() {
    return (await fetchJSON(`${NASA}/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`)) || FALLBACK_MARS;
  },

  async getNASAImages(query = 'hubble nebula galaxy') {
    return fetchJSON(`${NASA_IMG}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=12`);
  },

  async getNASAImagesJWST() {
    return fetchJSON(`${NASA_IMG}/search?q=james+webb+space+telescope+galaxy&media_type=image&page_size=8`);
  },

  // ─── ISS Position (wheretheiss.at) ────────────────────

  async getISSPosition() {
    // Returns { latitude, longitude, altitude, velocity, timestamp, ... }
    return fetchJSON(WHERETHEISS);
  },

  async getAstronauts() {
    // open-notify /astros.json is still operational for crew data
    return fetchJSON('https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json');
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
    return (await fetchJSON(`${EXO}?query=select+count(*)+from+ps+where+default_flag=1&format=json`)) || FALLBACK_EXO_COUNT;
  },

  async getRecentExoplanets() {
    return (await fetchJSON(`${EXO}?query=select+pl_name,hostname,pl_orbper,pl_rade,pl_bmasse,disc_year,discoverymethod,sy_dist+from+ps+where+default_flag=1+order+by+disc_year+desc&format=json&maxrec=40`)) || FALLBACK_EXO_PLANETS;
  },

  async getExoByMethod() {
    return (await fetchJSON(`${EXO}?query=select+discoverymethod,count(*)+as+count+from+ps+where+default_flag=1+group+by+discoverymethod&format=json`)) || FALLBACK_EXO_METHODS;
  },

};

if (typeof window !== 'undefined') window.API = API;

// Allow Node.js / Jest to import for testing
if (typeof module !== 'undefined') module.exports = { fetchJSON, API };
