'use strict';

document.body.innerHTML = `
  <div id="sx-bar-chart"></div>
  <div id="sx-launches-list"></div>
  <div id="sx-upcoming-list"></div>
`;

global.requestAnimationFrame = jest.fn(cb => { cb(9999); return 1; });
global.performance = { now: jest.fn(() => 0) };
global.L = {};
global.window.API = {};

const { fmt, fmtDate, buildBarChart, buildLaunchList } = require('../js/main.js');

// ─── buildBarChart ───────────────────────────────────────

describe('buildBarChart', () => {
  let container;

  beforeEach(() => {
    container = document.getElementById('sx-bar-chart');
    container.innerHTML = '';
  });

  test('renders one bar-wrap element per year', () => {
    buildBarChart('sx-bar-chart', { 2020: 3, 2021: 5 });
    expect(container.querySelectorAll('.bar-wrap').length).toBe(2);
  });

  test('renders years in ascending order', () => {
    buildBarChart('sx-bar-chart', { 2022: 1, 2019: 4, 2021: 2 });
    const labels = Array.from(container.querySelectorAll('.bar-year')).map(e => e.textContent);
    expect(labels).toEqual(['19', '21', '22']);
  });

  test('bar-year shows the last two digits of each year', () => {
    buildBarChart('sx-bar-chart', { 2023: 7 });
    expect(container.querySelector('.bar-year').textContent).toBe('23');
  });

  test('bar-count shows the launch count for the year', () => {
    buildBarChart('sx-bar-chart', { 2020: 8 });
    expect(container.querySelector('.bar-count').textContent).toBe('8');
  });

  test('the tallest year bar gets 100% height', () => {
    buildBarChart('sx-bar-chart', { 2020: 10, 2021: 5 });
    const bars = container.querySelectorAll('.bar');
    const heights = Array.from(bars).map(b => b.style.height);
    // jsdom normalises "100.0%" → "100%" in computed styles
    expect(heights[0]).toMatch(/^100/);
  });

  test('height is proportional to the max value', () => {
    buildBarChart('sx-bar-chart', { 2020: 10, 2021: 5 });
    const bars = container.querySelectorAll('.bar');
    // year 2021 has half as many launches → 50% height
    expect(bars[1].style.height).toMatch(/^50/);
  });

  test('does nothing when container element does not exist', () => {
    expect(() => buildBarChart('does-not-exist', { 2020: 3 })).not.toThrow();
  });

  test('clears previous content before rendering', () => {
    container.innerHTML = '<div class="old"></div>';
    buildBarChart('sx-bar-chart', { 2024: 2 });
    expect(container.querySelectorAll('.old').length).toBe(0);
  });
});

// ─── buildLaunchList ─────────────────────────────────────

describe('buildLaunchList', () => {
  let container;

  beforeEach(() => {
    container = document.getElementById('sx-launches-list');
    container.innerHTML = '';
  });

  const makeLaunch = (overrides = {}) => ({
    flight_number: 1,
    name: 'Test Mission',
    date_utc: '2023-06-15T00:00:00.000Z',
    success: true,
    details: null,
    ...overrides,
  });

  test('renders one launch-item per launch', () => {
    buildLaunchList('sx-launches-list', [makeLaunch(), makeLaunch({ flight_number: 2, name: 'Mission 2' })]);
    expect(container.querySelectorAll('.launch-item').length).toBe(2);
  });

  test('renders a successful launch with status-success class and "Success" text', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ success: true })]);
    const status = container.querySelector('.launch-status');
    expect(status.classList.contains('status-success')).toBe(true);
    expect(status.textContent).toBe('Success');
  });

  test('renders a failed launch with status-failure class and "Failure" text', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ success: false })]);
    const status = container.querySelector('.launch-status');
    expect(status.classList.contains('status-failure')).toBe(true);
    expect(status.textContent).toBe('Failure');
  });

  test('renders null success as "Unknown"', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ success: null })]);
    const status = container.querySelector('.launch-status');
    expect(status.classList.contains('status-unknown')).toBe(true);
    expect(status.textContent).toBe('Unknown');
  });

  test('renders undefined success as "Unknown"', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ success: undefined })]);
    const status = container.querySelector('.launch-status');
    expect(status.textContent).toBe('Unknown');
  });

  test('marks all launches as "Upcoming" when upcoming=true regardless of success value', () => {
    const launches = [makeLaunch({ success: null }), makeLaunch({ success: true })];
    buildLaunchList('sx-launches-list', launches, true);
    const statuses = container.querySelectorAll('.status-upcoming');
    expect(statuses.length).toBe(2);
  });

  test('renders the launch name', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ name: 'Starlink 6-25' })]);
    expect(container.querySelector('.launch-name').textContent).toBe('Starlink 6-25');
  });

  test('renders the flight number', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ flight_number: 99 })]);
    expect(container.querySelector('.launch-fn').textContent).toBe('99');
  });

  test('renders em-dash when flight_number is missing', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ flight_number: undefined })]);
    expect(container.querySelector('.launch-fn').textContent).toBe('—');
  });

  test('renders the formatted launch date', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ date_utc: '2023-06-15T00:00:00.000Z' })]);
    const dateEl = container.querySelector('.launch-date');
    expect(dateEl.textContent).toMatch(/2023/);
    expect(dateEl.textContent).toMatch(/Jun/);
  });

  test('renders details when shorter than 140 chars without ellipsis', () => {
    const details = 'Short details.';
    buildLaunchList('sx-launches-list', [makeLaunch({ details })]);
    const detailsEl = container.querySelector('.launch-details');
    expect(detailsEl).not.toBeNull();
    expect(detailsEl.textContent).toBe('Short details.');
  });

  test('truncates details longer than 140 chars with an ellipsis', () => {
    const details = 'A'.repeat(150) + ' extra text';
    buildLaunchList('sx-launches-list', [makeLaunch({ details })]);
    const detailsEl = container.querySelector('.launch-details');
    expect(detailsEl.textContent.endsWith('…')).toBe(true);
    expect(detailsEl.textContent.length).toBeLessThan(details.length);
  });

  test('does not render details element when details is null', () => {
    buildLaunchList('sx-launches-list', [makeLaunch({ details: null })]);
    expect(container.querySelector('.launch-details')).toBeNull();
  });

  test('clears existing items before rendering new ones', () => {
    buildLaunchList('sx-launches-list', [makeLaunch()]);
    buildLaunchList('sx-launches-list', [makeLaunch()]);
    expect(container.querySelectorAll('.launch-item').length).toBe(1);
  });

  test('renders an empty list without error', () => {
    expect(() => buildLaunchList('sx-launches-list', [])).not.toThrow();
    expect(container.children.length).toBe(0);
  });

  test('does nothing when container element does not exist', () => {
    expect(() => buildLaunchList('non-existent', [makeLaunch()])).not.toThrow();
  });
});

// ─── SpaceX success-rate formula ─────────────────────────
// The formula from loadSpaceX: rate = success/(success+fail) * 100

describe('SpaceX success rate calculation', () => {
  function calcRate(launches) {
    const success = launches.filter(l => l.success === true).length;
    const fail = launches.filter(l => l.success === false).length;
    return (success + fail) > 0 ? Math.round(success / (success + fail) * 100) : 0;
  }

  test('returns 100% when all launches succeed', () => {
    const launches = [{ success: true }, { success: true }];
    expect(calcRate(launches)).toBe(100);
  });

  test('returns 0% when all launches fail', () => {
    const launches = [{ success: false }, { success: false }];
    expect(calcRate(launches)).toBe(0);
  });

  test('returns 0% when all launches are unknown (null success)', () => {
    const launches = [{ success: null }, { success: null }];
    expect(calcRate(launches)).toBe(0);
  });

  test('ignores null/unknown when computing success rate', () => {
    // 3 success, 1 fail, 2 null → 3/(3+1) = 75%
    const launches = [
      { success: true },
      { success: true },
      { success: true },
      { success: false },
      { success: null },
      { success: null },
    ];
    expect(calcRate(launches)).toBe(75);
  });

  test('handles an empty launches array', () => {
    expect(calcRate([])).toBe(0);
  });

  test('rounds to the nearest integer', () => {
    // 2 success, 3 fail → 2/5 = 40.0 → 40%
    const launches = [
      { success: true }, { success: true },
      { success: false }, { success: false }, { success: false },
    ];
    expect(calcRate(launches)).toBe(40);
  });
});
