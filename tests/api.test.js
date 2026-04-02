'use strict';

// Provide a minimal window.API placeholder so the module doesn't crash before assignment
global.window = global.window || global;

const { fetchJSON, API } = require('../js/api.js');

// ─── fetchJSON ──────────────────────────────────────────

describe('fetchJSON', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  test('returns parsed JSON on a successful response', async () => {
    const payload = { foo: 'bar' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    });

    const result = await fetchJSON('https://example.com/data');
    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/data', {});
  });

  test('returns null and warns when HTTP status is not OK (404)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    const result = await fetchJSON('https://example.com/missing');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Fetch failed:',
      'https://example.com/missing',
      'HTTP 404',
    );
  });

  test('returns null and warns when HTTP status is 500', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await fetchJSON('https://example.com/error');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  test('returns null and warns on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchJSON('https://example.com/offline');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Fetch failed:',
      'https://example.com/offline',
      'Network error',
    );
  });

  test('passes through opts to fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const opts = { headers: { Authorization: 'Bearer token' } };
    await fetchJSON('https://example.com/secure', opts);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/secure', opts);
  });
});

// ─── API URL construction ───────────────────────────────

describe('API methods — URL construction', () => {
  let capturedUrl;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockImplementation(url => {
      capturedUrl = url;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  test('getAPOD calls the NASA APOD endpoint with api_key and thumbs', async () => {
    await API.getAPOD();
    expect(capturedUrl).toMatch(/api\.nasa\.gov\/planetary\/apod/);
    expect(capturedUrl).toMatch(/api_key=/);
    expect(capturedUrl).toMatch(/thumbs=true/);
  });

  test('getNEO calls the NASA NeoWs feed with today\'s date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await API.getNEO();
    expect(capturedUrl).toMatch(/api\.nasa\.gov\/neo\/rest\/v1\/feed/);
    expect(capturedUrl).toContain(`start_date=${today}`);
    expect(capturedUrl).toContain(`end_date=${today}`);
  });

  test('getNEOStats calls the NASA NeoWs stats endpoint', async () => {
    await API.getNEOStats();
    expect(capturedUrl).toMatch(/api\.nasa\.gov\/neo\/rest\/v1\/stats/);
  });

  test('getMarsPhotos calls the Mars rover curiosity endpoint', async () => {
    await API.getMarsPhotos();
    expect(capturedUrl).toMatch(/mars-photos.*curiosity\/latest_photos/);
    expect(capturedUrl).toMatch(/api_key=/);
  });

  test('getNASAImages URL-encodes the query and targets images', async () => {
    await API.getNASAImages('hubble nebula');
    expect(capturedUrl).toMatch(/images-api\.nasa\.gov\/search/);
    expect(capturedUrl).toContain('hubble%20nebula');
    expect(capturedUrl).toContain('media_type=image');
  });

  test('getNASAImages uses default query when none provided', async () => {
    await API.getNASAImages();
    expect(capturedUrl).toContain('hubble');
  });

  test('getNASAImagesJWST targets the JWST query', async () => {
    await API.getNASAImagesJWST();
    expect(capturedUrl).toMatch(/images-api\.nasa\.gov\/search/);
    expect(capturedUrl).toMatch(/james\+webb/i);
    expect(capturedUrl).toContain('media_type=image');
  });

  test('getISSPosition calls wheretheiss.at for satellite 25544', async () => {
    await API.getISSPosition();
    expect(capturedUrl).toMatch(/wheretheiss\.at\/v1\/satellites\/25544/);
  });

  test('getAstronauts calls the people-in-space JSON feed', async () => {
    await API.getAstronauts();
    expect(capturedUrl).toMatch(/people-in-space\.json/);
  });

  test('getSpaceXCompany calls the v4 company endpoint', async () => {
    await API.getSpaceXCompany();
    expect(capturedUrl).toMatch(/spacexdata\.com\/v4\/company/);
  });

  test('getSpaceXLaunches calls the v5 launches endpoint', async () => {
    await API.getSpaceXLaunches();
    expect(capturedUrl).toMatch(/spacexdata\.com\/v5\/launches$/);
  });

  test('getSpaceXUpcoming calls the v5 upcoming launches endpoint', async () => {
    await API.getSpaceXUpcoming();
    expect(capturedUrl).toMatch(/v5\/launches\/upcoming/);
  });

  test('getSpaceXRockets calls the v4 rockets endpoint', async () => {
    await API.getSpaceXRockets();
    expect(capturedUrl).toMatch(/v4\/rockets/);
  });

  test('getSpaceXCores calls the v4 cores endpoint', async () => {
    await API.getSpaceXCores();
    expect(capturedUrl).toMatch(/v4\/cores/);
  });

  test('getSpaceXLandpads calls the v4 landpads endpoint', async () => {
    await API.getSpaceXLandpads();
    expect(capturedUrl).toMatch(/v4\/landpads/);
  });

  test('getSpaceXRoadster calls the v4 roadster endpoint', async () => {
    await API.getSpaceXRoadster();
    expect(capturedUrl).toMatch(/v4\/roadster/);
  });

  test('getSpaceXStarlink calls the v4 starlink endpoint', async () => {
    await API.getSpaceXStarlink();
    expect(capturedUrl).toMatch(/v4\/starlink/);
  });

  test('getExoplanetCount queries ps with default_flag=1', async () => {
    await API.getExoplanetCount();
    expect(capturedUrl).toMatch(/exoplanetarchive/);
    expect(capturedUrl).toMatch(/count/i);
    expect(capturedUrl).toMatch(/default_flag=1/);
  });

  test('getRecentExoplanets requests planet columns ordered by disc_year desc', async () => {
    await API.getRecentExoplanets();
    expect(capturedUrl).toMatch(/exoplanetarchive/);
    expect(capturedUrl).toMatch(/pl_name/);
    expect(capturedUrl).toMatch(/disc_year.*desc/i);
  });

  test('getExoByMethod groups by discoverymethod', async () => {
    await API.getExoByMethod();
    expect(capturedUrl).toMatch(/exoplanetarchive/);
    expect(capturedUrl).toMatch(/discoverymethod/i);
    expect(capturedUrl).toMatch(/group.*by/i);
  });
});
