'use strict';

document.body.innerHTML = `
  <span id="exo-count-value"></span>
  <div id="exo-methods"></div>
  <table><tbody id="exo-table-body"></tbody></table>
`;

global.requestAnimationFrame = jest.fn(cb => { cb(9999); return 1; });
global.performance = { now: jest.fn(() => 0) };
global.L = {};

const mockAPI = {
  getExoplanetCount: jest.fn().mockResolvedValue(null),
  getRecentExoplanets: jest.fn().mockResolvedValue(null),
  getExoByMethod: jest.fn().mockResolvedValue(null),
};
global.window.API = mockAPI;

const { methodColor, methodBadgeClass, loadExoplanets } = require('../js/main.js');

// ─── methodColor ─────────────────────────────────────────

describe('methodColor', () => {
  test('returns the blue variable for Transit', () => {
    expect(methodColor('Transit')).toBe('var(--blue)');
  });

  test('returns the purple variable for Radial Velocity', () => {
    expect(methodColor('Radial Velocity')).toBe('var(--purple)');
  });

  test('returns the orange variable for Imaging', () => {
    expect(methodColor('Imaging')).toBe('var(--orange)');
  });

  test('returns the teal variable for Microlensing', () => {
    expect(methodColor('Microlensing')).toBe('var(--teal)');
  });

  test('returns the yellow variable for Transit Timing Variations', () => {
    expect(methodColor('Transit Timing Variations')).toBe('var(--yellow)');
  });

  test('returns the accent variable for Astrometry', () => {
    expect(methodColor('Astrometry')).toBe('var(--accent)');
  });

  test('returns the text-muted fallback for an unknown method', () => {
    expect(methodColor('Unknown Technique')).toBe('var(--text-muted)');
  });

  test('returns text-muted for an empty string', () => {
    expect(methodColor('')).toBe('var(--text-muted)');
  });

  test('is case-sensitive — wrong case returns the fallback', () => {
    expect(methodColor('transit')).toBe('var(--text-muted)');
  });
});

// ─── methodBadgeClass ────────────────────────────────────

describe('methodBadgeClass', () => {
  test('returns method-transit for Transit', () => {
    expect(methodBadgeClass('Transit')).toBe('method-transit');
  });

  test('returns method-rv for Radial Velocity', () => {
    expect(methodBadgeClass('Radial Velocity')).toBe('method-rv');
  });

  test('returns method-imaging for Imaging', () => {
    expect(methodBadgeClass('Imaging')).toBe('method-imaging');
  });

  test('returns method-other for any other known method (Microlensing)', () => {
    expect(methodBadgeClass('Microlensing')).toBe('method-other');
  });

  test('returns method-other for an unknown string', () => {
    expect(methodBadgeClass('Future Method')).toBe('method-other');
  });

  test('returns method-other for null', () => {
    expect(methodBadgeClass(null)).toBe('method-other');
  });

  test('returns method-other for undefined', () => {
    expect(methodBadgeClass(undefined)).toBe('method-other');
  });

  test('returns method-other for an empty string', () => {
    expect(methodBadgeClass('')).toBe('method-other');
  });
});

// ─── loadExoplanets — IPAC count column name variations ───

describe('loadExoplanets — IPAC column name tolerance', () => {
  const makePlanet = (n = 1) =>
    Array.from({ length: n }, (_, i) => ({
      pl_name: `Planet ${i}`,
      hostname: `Star ${i}`,
      disc_year: 2020 + i,
      pl_orbper: 365.25,
      pl_rade: 1.0,
      pl_bmasse: 1.0,
      sy_dist: 10.5,
      discoverymethod: 'Transit',
    }));

  beforeEach(() => {
    document.getElementById('exo-table-body').innerHTML = '';
    document.getElementById('exo-methods').innerHTML = '';
    mockAPI.getRecentExoplanets.mockResolvedValue(makePlanet(3));
    mockAPI.getExoByMethod.mockResolvedValue([
      { discoverymethod: 'Transit', count: 4000 },
    ]);
  });

  test('reads count from lowercase "count(*)" key', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue([{ 'count(*)': 6100 }]);
    await loadExoplanets();
    // animateCount calls requestAnimationFrame which we've mocked to fire immediately
    expect(document.getElementById('exo-count-value').textContent).toBe('6,100');
  });

  test('reads count from uppercase "COUNT(*)" key', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue([{ 'COUNT(*)': 6200 }]);
    await loadExoplanets();
    expect(document.getElementById('exo-count-value').textContent).toBe('6,200');
  });

  test('reads count from "count" key', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue([{ count: 6300 }]);
    await loadExoplanets();
    expect(document.getElementById('exo-count-value').textContent).toBe('6,300');
  });

  test('reads count from "COUNT" key', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue([{ COUNT: 6400 }]);
    await loadExoplanets();
    expect(document.getElementById('exo-count-value').textContent).toBe('6,400');
  });

  test('falls back to 6153 when countData is null', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue(null);
    await loadExoplanets();
    expect(document.getElementById('exo-count-value').textContent).toBe('6,153');
  });

  test('falls back to 6153 when countData is empty array', async () => {
    mockAPI.getExoplanetCount.mockResolvedValue([]);
    await loadExoplanets();
    expect(document.getElementById('exo-count-value').textContent).toBe('6,153');
  });
});

// ─── loadExoplanets — table rendering ─────────────────────

describe('loadExoplanets — table rendering', () => {
  beforeEach(() => {
    document.getElementById('exo-table-body').innerHTML = '';
    document.getElementById('exo-methods').innerHTML = '';
    mockAPI.getExoplanetCount.mockResolvedValue([{ 'count(*)': 6000 }]);
    mockAPI.getExoByMethod.mockResolvedValue([]);
  });

  test('renders up to 30 rows in the table', async () => {
    const planets = Array.from({ length: 40 }, (_, i) => ({
      pl_name: `P${i}`, hostname: `S${i}`, disc_year: 2020, pl_orbper: 100,
      pl_rade: 1, pl_bmasse: 1, sy_dist: 10, discoverymethod: 'Transit',
    }));
    mockAPI.getRecentExoplanets.mockResolvedValue(planets);

    await loadExoplanets();

    expect(document.getElementById('exo-table-body').querySelectorAll('tr').length).toBe(30);
  });

  test('renders em-dash for missing orbital period', async () => {
    mockAPI.getRecentExoplanets.mockResolvedValue([{
      pl_name: 'P1', hostname: 'S1', disc_year: 2020,
      pl_orbper: null, pl_rade: null, pl_bmasse: null, sy_dist: null,
      discoverymethod: 'Transit',
    }]);

    await loadExoplanets();

    const cells = document.querySelectorAll('#exo-table-body td');
    // columns: name, host, year, orbper, rade, bmasse, dist, method
    expect(cells[3].textContent).toBe('—');
    expect(cells[4].textContent).toBe('—');
    expect(cells[5].textContent).toBe('—');
    expect(cells[6].textContent).toBe('—');
  });

  test('renders discovery method badge with the correct class', async () => {
    mockAPI.getRecentExoplanets.mockResolvedValue([{
      pl_name: 'P1', hostname: 'S1', disc_year: 2020,
      pl_orbper: 365, pl_rade: 1, pl_bmasse: 1, sy_dist: 10,
      discoverymethod: 'Transit',
    }]);

    await loadExoplanets();

    const badge = document.querySelector('.method-badge');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('method-transit')).toBe(true);
    expect(badge.textContent).toBe('Transit');
  });

  test('renders em-dash in method column when discoverymethod is missing', async () => {
    mockAPI.getRecentExoplanets.mockResolvedValue([{
      pl_name: 'P1', hostname: 'S1', disc_year: 2020,
      pl_orbper: 365, pl_rade: 1, pl_bmasse: 1, sy_dist: 10,
      discoverymethod: null,
    }]);

    await loadExoplanets();

    const badge = document.querySelector('.method-badge');
    expect(badge.textContent).toBe('—');
  });
});

// ─── loadExoplanets — discovery methods bar ───────────────

describe('loadExoplanets — discovery methods bar', () => {
  beforeEach(() => {
    document.getElementById('exo-methods').innerHTML = '';
    mockAPI.getExoplanetCount.mockResolvedValue([{ 'count(*)': 6000 }]);
    mockAPI.getRecentExoplanets.mockResolvedValue([]);
  });

  test('renders one bar item per discovery method', async () => {
    mockAPI.getExoByMethod.mockResolvedValue([
      { discoverymethod: 'Transit', count: 4000 },
      { discoverymethod: 'Radial Velocity', count: 1000 },
    ]);

    await loadExoplanets();

    const container = document.getElementById('exo-methods');
    // Each method is wrapped in a div with style="margin-bottom:10px"
    const items = Array.from(container.children).filter(c => c.style.marginBottom === '10px');
    expect(items.length).toBe(2);
  });

  test('sorts methods by count descending', async () => {
    mockAPI.getExoByMethod.mockResolvedValue([
      { discoverymethod: 'Imaging', count: 100 },
      { discoverymethod: 'Transit', count: 4000 },
      { discoverymethod: 'Radial Velocity', count: 1000 },
    ]);

    await loadExoplanets();

    const container = document.getElementById('exo-methods');
    const methodNames = Array.from(container.querySelectorAll('span[style*="font-weight"]')).map(s => s.textContent);
    expect(methodNames[0]).toBe('Transit');
    expect(methodNames[methodNames.length - 1]).toBe('Imaging');
  });

  test('does not render methods section when API returns null', async () => {
    mockAPI.getExoByMethod.mockResolvedValue(null);

    await loadExoplanets();

    expect(document.getElementById('exo-methods').children.length).toBe(0);
  });
});
