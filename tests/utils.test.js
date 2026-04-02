'use strict';

// main.js reads the DOM at module scope — provide stubs before requiring.
document.body.innerHTML = `
  <canvas id="star-canvas"></canvas>
  <span id="last-updated"></span>
`;

// Stub browser-only globals not provided by jsdom
global.requestAnimationFrame = jest.fn(cb => { cb(9999); return 1; });
global.performance = { now: jest.fn(() => 0) };
global.L = {};   // Leaflet stub — not exercised by utility tests
global.window.API = {};   // API stub — not called by utility tests

const {
  fmt,
  fmtDate,
  fmtDateShort,
  el,
  skeletonCards,
  setVal,
} = require('../js/main.js');

// ─── fmt ────────────────────────────────────────────────

describe('fmt', () => {
  test('returns em-dash for null', () => {
    expect(fmt(null)).toBe('—');
  });

  test('returns em-dash for undefined', () => {
    expect(fmt(undefined)).toBe('—');
  });

  test('formats an integer without decimals by default', () => {
    expect(fmt(1234567)).toBe('1,234,567');
  });

  test('formats zero', () => {
    expect(fmt(0)).toBe('0');
  });

  test('rounds to the specified number of decimal places', () => {
    expect(fmt(3.14159, 2)).toBe('3.14');
  });

  test('formats a decimal with 0 decimals (default rounding)', () => {
    expect(fmt(3.7)).toBe('4');
  });

  test('accepts a numeric string', () => {
    expect(fmt('9999')).toBe('9,999');
  });

  test('formats large numbers with commas', () => {
    expect(fmt(1000000)).toBe('1,000,000');
  });

  test('formats negative numbers', () => {
    expect(fmt(-42)).toBe('-42');
  });
});

// ─── fmtDate ────────────────────────────────────────────

describe('fmtDate', () => {
  test('returns em-dash for empty string', () => {
    expect(fmtDate('')).toBe('—');
  });

  test('returns em-dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });

  test('returns em-dash for undefined', () => {
    expect(fmtDate(undefined)).toBe('—');
  });

  test('formats an ISO date string to a human-readable date', () => {
    const result = fmtDate('2024-03-15');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
  });

  test('includes day, month abbreviation, and year', () => {
    const result = fmtDate('2021-12-25');
    expect(result).toContain('2021');
    expect(result).toMatch(/Dec/);
    expect(result).toMatch(/25/);
  });
});

// ─── fmtDateShort ────────────────────────────────────────

describe('fmtDateShort', () => {
  test('returns em-dash for empty string', () => {
    expect(fmtDateShort('')).toBe('—');
  });

  test('returns em-dash for null', () => {
    expect(fmtDateShort(null)).toBe('—');
  });

  test('formats to month abbreviation and year only', () => {
    const result = fmtDateShort('2024-07-04');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Jul/);
    // Should NOT include the day number
    expect(result).not.toMatch(/\b4\b/);
  });
});

// ─── el ─────────────────────────────────────────────────

describe('el', () => {
  test('creates an element with the given tag', () => {
    const div = el('div');
    expect(div.tagName).toBe('DIV');
  });

  test('applies a className when provided', () => {
    const span = el('span', 'my-class another');
    expect(span.className).toBe('my-class another');
  });

  test('sets innerHTML when html is provided', () => {
    const p = el('p', '', '<strong>hello</strong>');
    expect(p.innerHTML).toBe('<strong>hello</strong>');
  });

  test('creates a paragraph with class and content', () => {
    const p = el('p', 'card', 'Content');
    expect(p.tagName).toBe('P');
    expect(p.className).toBe('card');
    expect(p.textContent).toBe('Content');
  });

  test('works without class or html arguments', () => {
    const div = el('div');
    expect(div.className).toBe('');
    expect(div.innerHTML).toBe('');
  });

  test('can create a table row', () => {
    const tr = el('tr');
    expect(tr.tagName).toBe('TR');
  });
});

// ─── skeletonCards ──────────────────────────────────────

describe('skeletonCards', () => {
  test('appends the specified number of card children to a container', () => {
    const container = document.createElement('div');
    skeletonCards(container, 3);
    expect(container.children.length).toBe(3);
  });

  test('each child has the "card" class', () => {
    const container = document.createElement('div');
    skeletonCards(container, 2);
    Array.from(container.children).forEach(child => {
      expect(child.className).toBe('card');
    });
  });

  test('appends zero cards when count is 0', () => {
    const container = document.createElement('div');
    skeletonCards(container, 0);
    expect(container.children.length).toBe(0);
  });

  test('uses a custom height in the skeleton block style', () => {
    const container = document.createElement('div');
    skeletonCards(container, 1, '200px');
    expect(container.innerHTML).toContain('200px');
  });

  test('falls back to 80px height when none is provided', () => {
    const container = document.createElement('div');
    skeletonCards(container, 1);
    expect(container.innerHTML).toContain('80px');
  });

  test('contains skeleton class elements inside each card', () => {
    const container = document.createElement('div');
    skeletonCards(container, 1);
    expect(container.innerHTML).toContain('skeleton');
  });
});

// ─── setVal ─────────────────────────────────────────────

describe('setVal', () => {
  test('sets the textContent of an existing element by id', () => {
    document.body.innerHTML += '<span id="test-target"></span>';
    setVal('test-target', 'hello world');
    expect(document.getElementById('test-target').textContent).toBe('hello world');
  });

  test('does not throw when element id does not exist', () => {
    expect(() => setVal('non-existent', 'value')).not.toThrow();
  });

  test('updates an element to a numeric value coerced to string', () => {
    document.body.innerHTML += '<span id="num-target"></span>';
    setVal('num-target', 42);
    expect(document.getElementById('num-target').textContent).toBe('42');
  });

  test('overwrites previous content', () => {
    document.body.innerHTML += '<span id="overwrite-target">old</span>';
    setVal('overwrite-target', 'new');
    expect(document.getElementById('overwrite-target').textContent).toBe('new');
  });
});
