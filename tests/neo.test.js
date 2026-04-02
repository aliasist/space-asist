'use strict';

document.body.innerHTML = `
  <span id="neo-total"></span>
  <span id="neo-approaches"></span>
  <span id="neo-today"></span>
  <span id="neo-hazardous"></span>
  <div id="neo-list"></div>
  <canvas id="neo-canvas"></canvas>
`;

// jsdom doesn't implement the Canvas 2D API — provide a minimal stub
const mockCtx = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  fillText: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  font: '',
};
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx);

global.requestAnimationFrame = jest.fn(cb => { cb(9999); return 1; });
global.performance = { now: jest.fn(() => 0) };
global.L = {};

// Mock API — individual tests will override what they need
const mockAPI = {
  getNEO: jest.fn().mockResolvedValue(null),
  getNEOStats: jest.fn().mockResolvedValue(null),
};
global.window.API = mockAPI;

const { fmt, loadNEO } = require('../js/main.js');

// ─── NEO sorting helper (mirrors loadNEO sort logic) ─────

function sortByDistance(objects) {
  return [...objects].sort((a, b) => {
    const dA = parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers || 1e15);
    const dB = parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers || 1e15);
    return dA - dB;
  });
}

function makeNEO(name, distanceKm, hazardous = false, diamMin = 10, diamMax = 20) {
  return {
    name,
    close_approach_data: [
      {
        miss_distance: { kilometers: String(distanceKm) },
        relative_velocity: { kilometers_per_hour: '30000' },
      },
    ],
    estimated_diameter: {
      meters: { estimated_diameter_min: diamMin, estimated_diameter_max: diamMax },
    },
    is_potentially_hazardous_asteroid: hazardous,
  };
}

// ─── NEO sort order ───────────────────────────────────────

describe('NEO sort by miss distance', () => {
  test('sorts objects closest first', () => {
    const objects = [makeNEO('Far', 5000000), makeNEO('Close', 1000000), makeNEO('Mid', 3000000)];
    const sorted = sortByDistance(objects);
    expect(sorted.map(o => o.name)).toEqual(['Close', 'Mid', 'Far']);
  });

  test('objects without close_approach_data distance are sorted last', () => {
    const noData = {
      name: 'MissingData',
      close_approach_data: [{}],
      estimated_diameter: { meters: { estimated_diameter_min: 5, estimated_diameter_max: 10 } },
      is_potentially_hazardous_asteroid: false,
    };
    const near = makeNEO('Near', 100000);
    const sorted = sortByDistance([noData, near]);
    expect(sorted[0].name).toBe('Near');
    expect(sorted[1].name).toBe('MissingData');
  });

  test('handles a single-item array', () => {
    const objects = [makeNEO('Solo', 2000000)];
    const sorted = sortByDistance(objects);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].name).toBe('Solo');
  });

  test('handles an empty array', () => {
    expect(sortByDistance([])).toEqual([]);
  });

  test('does not mutate the original array', () => {
    const objects = [makeNEO('B', 2000000), makeNEO('A', 1000000)];
    const original = [...objects];
    sortByDistance(objects);
    expect(objects[0].name).toBe(original[0].name);
  });
});

// ─── NEO hazard counting ──────────────────────────────────

describe('NEO hazard detection', () => {
  test('correctly counts hazardous objects', () => {
    const objects = [
      makeNEO('PHA1', 1000000, true),
      makeNEO('Safe1', 2000000, false),
      makeNEO('PHA2', 3000000, true),
    ];
    const count = objects.filter(o => o.is_potentially_hazardous_asteroid).length;
    expect(count).toBe(2);
  });

  test('returns zero when no hazardous objects', () => {
    const objects = [makeNEO('A', 1e6, false), makeNEO('B', 2e6, false)];
    expect(objects.filter(o => o.is_potentially_hazardous_asteroid).length).toBe(0);
  });

  test('returns correct count when all are hazardous', () => {
    const objects = [makeNEO('X', 1e6, true), makeNEO('Y', 2e6, true)];
    expect(objects.filter(o => o.is_potentially_hazardous_asteroid).length).toBe(2);
  });
});

// ─── NEO list rendering via loadNEO ──────────────────────

describe('loadNEO — live feed rendering', () => {
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    document.getElementById('neo-list').innerHTML = '';
    document.getElementById('neo-today').textContent = '';
    document.getElementById('neo-hazardous').textContent = '';
    mockAPI.getNEOStats.mockResolvedValue({
      near_earth_object_count: 42000,
      close_approach_count: 900000,
      last_updated: '2024-01-01',
    });
  });

  test('renders NEO items in the list sorted closest first', async () => {
    const far = makeNEO('Far Asteroid', 9000000);
    const close = makeNEO('Close Asteroid', 1000000);
    mockAPI.getNEO.mockResolvedValue({
      element_count: 2,
      near_earth_objects: { [today]: [far, close] },
    });

    await loadNEO();

    const items = document.querySelectorAll('.neo-item');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.neo-name').textContent).toBe('Close Asteroid');
    expect(items[1].querySelector('.neo-name').textContent).toBe('Far Asteroid');
  });

  test('sets neo-today to the element count from feed', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 7,
      near_earth_objects: { [today]: [makeNEO('X', 1e6)] },
    });

    await loadNEO();

    expect(document.getElementById('neo-today').textContent).toBe('7');
  });

  test('sets neo-hazardous count correctly', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 3,
      near_earth_objects: {
        [today]: [
          makeNEO('PHA', 1e6, true),
          makeNEO('Safe', 2e6, false),
          makeNEO('Safe2', 3e6, false),
        ],
      },
    });

    await loadNEO();

    expect(document.getElementById('neo-hazardous').textContent).toBe('1');
  });

  test('adds "hazardous" class to PHA items', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('Danger', 1e6, true)] },
    });

    await loadNEO();

    const item = document.querySelector('.neo-item');
    expect(item.classList.contains('hazardous')).toBe(true);
  });

  test('shows ⚠ PHA badge for hazardous objects', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('Danger', 1e6, true)] },
    });

    await loadNEO();

    expect(document.querySelector('.hazard-yes').textContent).toContain('PHA');
  });

  test('shows ✓ Safe badge for non-hazardous objects', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('Benign', 1e6, false)] },
    });

    await loadNEO();

    expect(document.querySelector('.hazard-no').textContent).toContain('Safe');
  });

  test('strips parentheses from asteroid names', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('(2024 AB1)', 1e6)] },
    });

    await loadNEO();

    expect(document.querySelector('.neo-name').textContent).toBe('2024 AB1');
  });

  test('displays the miss distance in M km', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('Rock', 3500000)] },
    });

    await loadNEO();

    const missEl = document.querySelector('.neo-miss');
    expect(missEl.textContent).toContain('M km');
    expect(missEl.textContent).toContain('3.5');
  });

  test('renders diameter range when data is present', async () => {
    mockAPI.getNEO.mockResolvedValue({
      element_count: 1,
      near_earth_objects: { [today]: [makeNEO('Rock', 1e6, false, 50, 100)] },
    });

    await loadNEO();

    const sizeEl = document.querySelector('.neo-size');
    expect(sizeEl.textContent).toContain('50');
    expect(sizeEl.textContent).toContain('100');
    expect(sizeEl.textContent).toContain('m');
  });
});

// ─── loadNEO — fallback path (API returns null) ───────────

describe('loadNEO — fallback when API is unavailable', () => {
  beforeEach(() => {
    document.getElementById('neo-list').innerHTML = '';
    mockAPI.getNEO.mockResolvedValue(null);
    mockAPI.getNEOStats.mockResolvedValue(null);
  });

  test('renders the static fallback objects in the list', async () => {
    await loadNEO();
    const items = document.querySelectorAll('.neo-item');
    expect(items.length).toBeGreaterThan(0);
  });

  test('sets static fallback values for neo-today and neo-hazardous', async () => {
    await loadNEO();
    expect(document.getElementById('neo-today').textContent).toBe('11');
    expect(document.getElementById('neo-hazardous').textContent).toBe('0');
  });

  test('uses static fallback text for neo-total when stats also unavailable', async () => {
    await loadNEO();
    expect(document.getElementById('neo-total').textContent).toBe('42,777+');
  });

  test('uses live stats values when stats API returns data', async () => {
    mockAPI.getNEOStats.mockResolvedValue({
      near_earth_object_count: 43000,
      close_approach_count: 920000,
      last_updated: '2024-06-01',
    });
    await loadNEO();
    expect(document.getElementById('neo-total').textContent).toBe('43,000');
  });
});
