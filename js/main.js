// ─── Space Dashboard — Main ───────────────────────────
'use strict';

// ─── Stars ─────────────────────────────────────────────
function initStars() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.1,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.004,
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a = Math.max(0.05, Math.min(1, s.a + s.da));
      if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a * 0.7})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  resize();
  draw();
  window.addEventListener('resize', resize);
}

// ─── Tabs ───────────────────────────────────────────────
function initTabs() {
  const tabs   = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.section-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      panels.forEach(p => p.classList.toggle('active', p.id === target));
      // Redraw NEO radar after panel becomes visible (offsetWidth is now > 0)
      if (target === 'tab-neo' && window._neoObjects) {
        requestAnimationFrame(() => drawNEORadar('neo-canvas', window._neoObjects));
      }
    });
  });
}

// ─── Last Updated ──────────────────────────────────────
function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Helpers ────────────────────────────────────────────
function fmt(n, decimals = 0) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: decimals });
}
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateShort(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
function skeletonCards(container, count, height = '') {
  for (let i = 0; i < count; i++) {
    const c = el('div', 'card');
    c.innerHTML = `<div class="skel-text skeleton short"></div>
      <div class="skeleton skel-block" style="height:${height || '80px'};margin:8px 0"></div>
      <div class="skel-text skeleton wide"></div><div class="skel-text skeleton short"></div>`;
    container.appendChild(c);
  }
}

// ─── APOD ───────────────────────────────────────────────
async function loadAPOD() {
  const data = await API.getAPOD();
  if (!data) return;

  const imgEl = document.getElementById('apod-img');
  const titleEl = document.getElementById('apod-title');
  const dateEl  = document.getElementById('apod-date');
  const expEl   = document.getElementById('apod-explanation');
  const creditEl = document.getElementById('apod-credit');

  if (imgEl) {
    if (data.media_type === 'video') {
      // Use thumbnail or placeholder for videos
      const thumb = data.thumbnail_url || 'https://apod.nasa.gov/apod/image/2501/CrabNebula_Webb_960.jpg';
      imgEl.src = thumb;
      imgEl.alt = data.title;
    } else {
      imgEl.src = data.url || data.hdurl;
      imgEl.alt = data.title;
    }
  }
  if (titleEl) titleEl.textContent = data.title;
  if (dateEl)  dateEl.textContent  = data.date;
  if (expEl)   expEl.textContent   = data.explanation;
  if (creditEl && data.copyright) creditEl.textContent = `© ${data.copyright.replace(/\n/g,' ')}`;
}

// ─── ISS ────────────────────────────────────────────────
let issMap = null;
let issMarker = null;
let issPath = [];
const ISS_TRAIL_LENGTH = 30;

async function loadISS() {
  // Load Leaflet map once
  if (!issMap) {
    issMap = L.map('iss-map', { zoomControl: false, attributionControl: false }).setView([0, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '', maxZoom: 6
    }).addTo(issMap);
    L.control.attribution({ position: 'bottomright', prefix: '' }).addTo(issMap);

    const issIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:radial-gradient(circle,#4ec994,#4ec99460);border:2px solid #4ec994;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px #4ec99480;">🛸</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    issMarker = L.marker([0, 0], { icon: issIcon }).addTo(issMap);
  }

  const updateISSPos = async () => {
    const pos = await API.getISSPosition();
    if (!pos) return;
    // wheretheiss.at returns flat {latitude, longitude} (no iss_position wrapper)
    const lat = parseFloat(pos.latitude);
    const lng = parseFloat(pos.longitude);

    issMarker.setLatLng([lat, lng]);
    issPath.push([lat, lng]);
    if (issPath.length > ISS_TRAIL_LENGTH) issPath.shift();

    if (issMap._trailLine) issMap.removeLayer(issMap._trailLine);
    issMap._trailLine = L.polyline(issPath, { color: '#4ec99460', weight: 2, dashArray: '4 4' }).addTo(issMap);

    // Update coords display
    const latEl = document.getElementById('iss-lat');
    const lngEl = document.getElementById('iss-lng');
    if (latEl) latEl.textContent = lat.toFixed(4) + '°';
    if (lngEl) lngEl.textContent = lng.toFixed(4) + '°';

    const tsEl = document.getElementById('iss-ts');
    if (tsEl) tsEl.textContent = new Date(pos.timestamp * 1000).toLocaleTimeString();
  };

  await updateISSPos();
  setInterval(updateISSPos, 5000);

  // Crew
  const crew = await API.getAstronauts();
  if (crew) {
    const list = document.getElementById('crew-list');
    if (list) {
      list.innerHTML = '';
      const count = document.getElementById('crew-count');
      if (count) count.textContent = crew.number;

      const craftEmoji = { ISS: '🛸', Tiangong: '🚀' };
      crew.people.forEach(p => {
        const item = el('div', 'crew-item');
        const craftClass = p.craft === 'ISS' ? 'craft-iss' : 'craft-tiangong';
        item.innerHTML = `
          <div class="crew-avatar">${craftEmoji[p.craft] || '🧑‍🚀'}</div>
          <div>
            <div class="crew-name">${p.name}</div>
          </div>
          <span class="crew-craft ${craftClass}">${p.craft}</span>
        `;
        list.appendChild(item);
      });
    }
  }
}

// ─── SpaceX ─────────────────────────────────────────────
async function loadSpaceX() {
  const [launches, rockets, cores, landpads, company, roadster] = await Promise.all([
    API.getSpaceXLaunches(),
    API.getSpaceXRockets(),
    API.getSpaceXCores(),
    API.getSpaceXLandpads(),
    API.getSpaceXCompany(),
    API.getSpaceXRoadster(),
  ]);

  // Stat cards
  if (launches) {
    const total   = launches.length;
    // success can be null for very old entries — only count definite values
    const success = launches.filter(l => l.success === true).length;
    const fail    = launches.filter(l => l.success === false).length;
    const rate    = (success + fail) > 0 ? Math.round(success / (success + fail) * 100) : 0;
    setVal('sx-total', fmt(total));
    setVal('sx-success', fmt(success));
    setVal('sx-fail', fmt(fail));
    setVal('sx-rate', rate + '%');

    // Launches by year chart
    const byYear = {};
    launches.forEach(l => {
      const y = l.date_utc?.slice(0, 4);
      if (y) byYear[y] = (byYear[y] || 0) + 1;
    });
    buildBarChart('sx-bar-chart', byYear);

    // Recent launches list
    const recents = [...launches].reverse().slice(0, 15);
    buildLaunchList('sx-launches-list', recents, false);
  }

  if (cores) {
    const active   = cores.filter(c => c.status === 'active').length;
    const maxReuse = Math.max(...cores.map(c => c.reuse_count || 0));
    setVal('sx-cores-active', active);
    setVal('sx-cores-max', maxReuse + 'x');
    setVal('sx-cores-total', cores.length);
  }

  // Rockets
  if (rockets) {
    const container = document.getElementById('sx-rockets-grid');
    if (container) {
      container.innerHTML = '';
      rockets.forEach(r => {
        const card = el('div', 'rocket-card');
        const activeColor = r.active ? 'var(--green)' : 'var(--text-faint)';
        const barColor = r.success_rate_pct >= 95 ? 'var(--green)' : r.success_rate_pct >= 70 ? 'var(--orange)' : 'var(--red)';
        card.innerHTML = `
          <div class="rocket-card-header">
            <div class="rocket-name">${r.name}</div>
            <span style="font-size:11px;font-weight:700;color:${activeColor}">${r.active ? '● ACTIVE' : '◌ RETIRED'}</span>
          </div>
          <div class="rocket-body">
            <div class="rocket-stat-row"><span class="rocket-stat-label">First Flight</span><span class="rocket-stat-val">${r.first_flight}</span></div>
            <div class="rocket-stat-row"><span class="rocket-stat-label">Stages</span><span class="rocket-stat-val">${r.stages}</span></div>
            <div class="rocket-stat-row"><span class="rocket-stat-label">Mass</span><span class="rocket-stat-val">${fmt(r.mass?.kg)} kg</span></div>
            <div class="rocket-stat-row"><span class="rocket-stat-label">LEO Payload</span><span class="rocket-stat-val">${fmt(r.payload_weights?.find(p=>p.id==='leo')?.kg)} kg</span></div>
            <div class="rocket-stat-row"><span class="rocket-stat-label">Cost/launch</span><span class="rocket-stat-val">$${fmt(r.cost_per_launch)}</span></div>
            <div class="success-bar-wrap">
              <div class="success-bar-label"><span>Success Rate</span><span style="color:${barColor};font-weight:700">${r.success_rate_pct ?? '—'}%</span></div>
              <div class="success-bar-track"><div class="success-bar-fill" style="width:${r.success_rate_pct || 0}%;background:${barColor}"></div></div>
            </div>
            <p style="font-size:11px;color:var(--text-muted);margin-top:12px;line-height:1.5">${r.description?.slice(0, 180)}…</p>
          </div>
        `;
        container.appendChild(card);
      });
    }
  }

  // Landpads
  if (landpads) {
    const container = document.getElementById('sx-landpads-grid');
    if (container) {
      container.innerHTML = '';
      landpads.forEach(p => {
        const rate = p.landing_attempts > 0 ? Math.round(p.landing_successes / p.landing_attempts * 100) : 0;
        const card = el('div', 'landpad-card');
        const typeColor = p.type === 'RTLS' ? 'var(--blue)' : 'var(--purple)';
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <div class="landpad-name">${p.name}</div>
            <span style="font-size:10px;font-weight:700;color:${typeColor}">${p.type}</span>
          </div>
          <div class="landpad-full">${p.full_name}</div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:10px">${p.locality}</div>
          <div class="landpad-stats">
            <div class="landpad-stat"><div class="landpad-stat-val" style="color:var(--orange)">${p.landing_attempts}</div><div class="landpad-stat-label">Attempts</div></div>
            <div class="landpad-stat"><div class="landpad-stat-val" style="color:var(--green)">${p.landing_successes}</div><div class="landpad-stat-label">Landings</div></div>
            <div class="landpad-stat"><div class="landpad-stat-val" style="color:var(--accent)">${rate}%</div><div class="landpad-stat-label">Rate</div></div>
          </div>
          <div class="landpad-bar"><div class="landpad-bar-fill" style="width:${rate}%"></div></div>
        `;
        container.appendChild(card);
      });
    }
  }

  // Company stats
  if (company) {
    setVal('sx-co-employees', fmt(company.employees));
    setVal('sx-co-valuation', '$' + fmt(company.valuation / 1e9, 0) + 'B');
    setVal('sx-co-founded', company.founded);
    setVal('sx-co-vehicles', company.vehicles);
  }

  // Roadster
  if (roadster) {
    setVal('sx-roadster-speed', fmt(roadster.speed_kph, 0) + ' km/h');
    setVal('sx-roadster-earth', fmt(roadster.earth_distance_km / 1e6, 1) + 'M km');
    setVal('sx-roadster-mars',  fmt(roadster.mars_distance_km / 1e6, 1) + 'M km');
    setVal('sx-roadster-period', fmt(roadster.period_days, 0) + ' days');
  }
}

function buildBarChart(id, byYear) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  const years = Object.keys(byYear).sort();
  const max = Math.max(...Object.values(byYear));
  years.forEach(y => {
    const count = byYear[y];
    const pct = (count / max * 100).toFixed(1);
    const wrap = el('div', 'bar-wrap');
    wrap.innerHTML = `
      <div class="bar-count">${count}</div>
      <div class="bar" style="height:${pct}%;background:var(--blue)" title="${y}: ${count} launches"></div>
      <div class="bar-year">${y.slice(2)}</div>
    `;
    container.appendChild(wrap);
  });
}

function buildLaunchList(id, launches, upcoming = false) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  launches.forEach(l => {
    const item = el('div', 'launch-item');
    let statusClass = 'status-unknown';
    let statusText  = 'Unknown';
    if (upcoming) { statusClass = 'status-upcoming'; statusText = 'Upcoming'; }
    else if (l.success === true) { statusClass = 'status-success'; statusText = 'Success'; }
    else if (l.success === false) { statusClass = 'status-failure'; statusText = 'Failure'; }
    else if (l.success === null || l.success === undefined) { statusClass = 'status-unknown'; statusText = 'Unknown'; }

    item.innerHTML = `
      <div class="launch-num">
        <div class="launch-sn">#</div>
        <div class="launch-fn">${l.flight_number ?? '—'}</div>
      </div>
      <div>
        <div class="launch-name">${l.name}</div>
        <div class="launch-date">${fmtDate(l.date_utc)}</div>
        ${l.details ? `<div class="launch-details">${l.details.slice(0, 140)}${l.details.length > 140 ? '…' : ''}</div>` : ''}
      </div>
      <span class="launch-status ${statusClass}">${statusText}</span>
    `;
    container.appendChild(item);
  });
}

// ─── NEO Asteroids ──────────────────────────────────────
async function loadNEO() {
  const [neoFeed, neoStats] = await Promise.all([API.getNEO(), API.getNEOStats()]);

  if (neoStats) {
    setVal('neo-total', fmt(neoStats.near_earth_object_count));
    setVal('neo-approaches', fmt(neoStats.close_approach_count));
    setVal('neo-updated', neoStats.last_updated);
  } else {
    // Fallback static values if rate-limited
    setVal('neo-total', '42,777+');
    setVal('neo-approaches', '913,332+');
  }

  if (neoFeed) {
    const today = Object.keys(neoFeed.near_earth_objects)[0];
    const objects = neoFeed.near_earth_objects[today] || [];
    const sorted = [...objects].sort((a, b) => {
      const dA = parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers || 1e15);
      const dB = parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers || 1e15);
      return dA - dB;
    });

    setVal('neo-today', neoFeed.element_count);
    const hazardous = objects.filter(o => o.is_potentially_hazardous_asteroid).length;
    setVal('neo-hazardous', hazardous);

    // Build list
    const list = document.getElementById('neo-list');
    if (list) {
      list.innerHTML = '';
      sorted.forEach(obj => {
        const approach = obj.close_approach_data[0];
        const missKm   = parseFloat(approach?.miss_distance?.kilometers || 0);
        const velKmh   = parseFloat(approach?.relative_velocity?.kilometers_per_hour || 0);
        const diam     = obj.estimated_diameter?.meters;
        const hazard   = obj.is_potentially_hazardous_asteroid;
        const item = el('div', `neo-item${hazard ? ' hazardous' : ''}`);
        item.innerHTML = `
          <div>
            <div class="neo-name">${obj.name.replace(/[()]/g, '')}</div>
            <div class="neo-size">Ø ${diam ? fmt(diam.estimated_diameter_min, 0) + '–' + fmt(diam.estimated_diameter_max, 0) + ' m' : '—'}</div>
          </div>
          <div>
            <div class="neo-miss">${fmt(missKm / 1e6, 2)}M km</div>
            <div class="neo-vel">${fmt(velKmh, 0)} km/h</div>
          </div>
          <span class="neo-hazard ${hazard ? 'hazard-yes' : 'hazard-no'}">${hazard ? '⚠ PHA' : '✓ Safe'}</span>
        `;
        list.appendChild(item);
      });
    }

    // Radar canvas — store for re-draw when tab becomes visible
    window._neoObjects = sorted;
    drawNEORadar('neo-canvas', sorted);
  } else {
    // API rate-limited — show fallback static radar with known recent objects
    const fallbackObjects = [
      { name: '2026 FN1', close_approach_data: [{ miss_distance: { kilometers: '3240000' }, relative_velocity: { kilometers_per_hour: '35628' } }], estimated_diameter: { meters: { estimated_diameter_min: 13, estimated_diameter_max: 30 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 FA4', close_approach_data: [{ miss_distance: { kilometers: '6260000' }, relative_velocity: { kilometers_per_hour: '41927' } }], estimated_diameter: { meters: { estimated_diameter_min: 16, estimated_diameter_max: 36 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 FF2', close_approach_data: [{ miss_distance: { kilometers: '12300000' }, relative_velocity: { kilometers_per_hour: '80024' } }], estimated_diameter: { meters: { estimated_diameter_min: 44, estimated_diameter_max: 98 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 DS11', close_approach_data: [{ miss_distance: { kilometers: '14280000' }, relative_velocity: { kilometers_per_hour: '25822' } }], estimated_diameter: { meters: { estimated_diameter_min: 48, estimated_diameter_max: 108 } }, is_potentially_hazardous_asteroid: false },
      { name: '2024 PP1', close_approach_data: [{ miss_distance: { kilometers: '16040000' }, relative_velocity: { kilometers_per_hour: '47389' } }], estimated_diameter: { meters: { estimated_diameter_min: 7, estimated_diameter_max: 16 } }, is_potentially_hazardous_asteroid: false },
      { name: '2026 EY1', close_approach_data: [{ miss_distance: { kilometers: '21770000' }, relative_velocity: { kilometers_per_hour: '29203' } }], estimated_diameter: { meters: { estimated_diameter_min: 139, estimated_diameter_max: 310 } }, is_potentially_hazardous_asteroid: false },
      { name: '2024 TT5', close_approach_data: [{ miss_distance: { kilometers: '23470000' }, relative_velocity: { kilometers_per_hour: '57195' } }], estimated_diameter: { meters: { estimated_diameter_min: 31, estimated_diameter_max: 70 } }, is_potentially_hazardous_asteroid: false },
      { name: '2023 GR1', close_approach_data: [{ miss_distance: { kilometers: '27530000' }, relative_velocity: { kilometers_per_hour: '21468' } }], estimated_diameter: { meters: { estimated_diameter_min: 22, estimated_diameter_max: 49 } }, is_potentially_hazardous_asteroid: false },
    ];
    setVal('neo-today', '11');
    setVal('neo-hazardous', '0');
    const list = document.getElementById('neo-list');
    if (list) {
      list.innerHTML = '';
      fallbackObjects.forEach(obj => {
        const approach = obj.close_approach_data[0];
        const missKm   = parseFloat(approach?.miss_distance?.kilometers || 0);
        const velKmh   = parseFloat(approach?.relative_velocity?.kilometers_per_hour || 0);
        const diam     = obj.estimated_diameter?.meters;
        const hazard   = obj.is_potentially_hazardous_asteroid;
        const item = el('div', `neo-item${hazard ? ' hazardous' : ''}`);
        item.innerHTML = `
          <div>
            <div class="neo-name">${obj.name.replace(/[()]/g, '')}</div>
            <div class="neo-size">Ø ${diam ? fmt(diam.estimated_diameter_min, 0) + '–' + fmt(diam.estimated_diameter_max, 0) + ' m' : '—'}</div>
          </div>
          <div>
            <div class="neo-miss">${fmt(missKm / 1e6, 2)}M km</div>
            <div class="neo-vel">${fmt(velKmh, 0)} km/h</div>
          </div>
          <span class="neo-hazard hazard-no">✓ Safe</span>
        `;
        list.appendChild(item);
      });
    }
    window._neoObjects = fallbackObjects;
    drawNEORadar('neo-canvas', fallbackObjects);
  }
}

function drawNEORadar(canvasId, objects) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Use offsetWidth if visible, fallback to 680px if panel is hidden (display:none)
  const W = canvas.width = canvas.parentElement.offsetWidth || 680;
  const H = canvas.height = Math.min(W, 400);
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(cx, cy) - 20;

  // Background rings
  ctx.clearRect(0, 0, W, H);
  [0.25, 0.5, 0.75, 1].forEach(f => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e2140';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Crosshairs
  ctx.strokeStyle = '#1e2140';
  ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();

  // Earth
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#4a8fd4'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.strokeStyle = '#4a8fd440'; ctx.lineWidth = 2; ctx.stroke();

  // Label rings
  ['0.25 AU', '0.5 AU', '0.75 AU', '1 AU'].forEach((label, i) => {
    ctx.fillStyle = '#3d4060';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(label, cx + maxR * (i + 1) * 0.25 + 2, cy - 3);
  });

  // NEO objects
  const maxMiss = 1.5e8; // km cap for display
  objects.forEach((obj, i) => {
    const approach = obj.close_approach_data[0];
    const missKm = parseFloat(approach?.miss_distance?.kilometers || maxMiss);
    const hazard = obj.is_potentially_hazardous_asteroid;
    const frac = Math.min(missKm / maxMiss, 1);
    const r = maxR * frac;

    // Random angle based on index for visual spread
    const angle = (i / objects.length) * Math.PI * 2 + Math.PI * 0.3;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    const diam = obj.estimated_diameter?.meters?.estimated_diameter_max || 10;
    const dotR = Math.max(3, Math.min(10, diam / 20));

    // Glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, dotR * 3);
    grd.addColorStop(0, hazard ? '#e05555aa' : '#4ec994aa');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(x, y, dotR * 3, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Dot
    ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = hazard ? '#e05555' : '#4ec994';
    ctx.fill();
  });
}

// ─── Exoplanets ─────────────────────────────────────────
async function loadExoplanets() {
  const [countData, planets, methods] = await Promise.all([
    API.getExoplanetCount(),
    API.getRecentExoplanets(),
    API.getExoByMethod(),
  ]);

  // IPAC returns column names that may vary; try multiple keys with fallback
  if (countData && countData.length > 0) {
    const row = countData[0];
    const count = row['count(*)'] || row['COUNT(*)'] || row['count'] || row['COUNT'] || 6153;
    animateCount('exo-count-value', 0, count, 1500);
  } else {
    // Fallback to known count if IPAC API is unavailable
    animateCount('exo-count-value', 0, 6153, 1500);
  }

  if (methods) {
    const methodContainer = document.getElementById('exo-methods');
    if (methodContainer) {
      methodContainer.innerHTML = '';
      const total = methods.reduce((s, m) => s + (m.count || 0), 0);
      const sorted = [...methods].sort((a, b) => b.count - a.count);
      sorted.forEach(m => {
        const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) : 0;
        const color = methodColor(m.discoverymethod);
        const item = el('div', '');
        item.style.cssText = 'margin-bottom:10px';
        item.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:600">${m.discoverymethod}</span>
            <span style="color:${color};font-family:var(--font-mono)">${fmt(m.count)} (${pct}%)</span>
          </div>
          <div style="height:6px;background:var(--surface-3);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 1s ease"></div>
          </div>
        `;
        methodContainer.appendChild(item);
      });
    }
  }

  if (planets) {
    const table = document.getElementById('exo-table-body');
    if (table) {
      table.innerHTML = '';
      planets.slice(0, 30).forEach(p => {
        const tr = el('tr');
        const mc = methodBadgeClass(p.discoverymethod);
        tr.innerHTML = `
          <td>${p.pl_name}</td>
          <td>${p.hostname}</td>
          <td>${p.disc_year || '—'}</td>
          <td>${p.pl_orbper != null ? fmt(p.pl_orbper, 1) + ' d' : '—'}</td>
          <td>${p.pl_rade != null ? fmt(p.pl_rade, 2) + ' R⊕' : '—'}</td>
          <td>${p.pl_bmasse != null ? fmt(p.pl_bmasse, 1) + ' M⊕' : '—'}</td>
          <td>${p.sy_dist != null ? fmt(p.sy_dist, 1) + ' pc' : '—'}</td>
          <td><span class="method-badge ${mc}">${p.discoverymethod || '—'}</span></td>
        `;
        table.appendChild(tr);
      });
    }
  }
}

function methodColor(m) {
  const map = { Transit: 'var(--blue)', 'Radial Velocity': 'var(--purple)', Imaging: 'var(--orange)', Microlensing: 'var(--teal)', 'Transit Timing Variations': 'var(--yellow)', Astrometry: 'var(--accent)' };
  return map[m] || 'var(--text-muted)';
}
function methodBadgeClass(m) {
  if (!m) return 'method-other';
  if (m === 'Transit') return 'method-transit';
  if (m === 'Radial Velocity') return 'method-rv';
  if (m === 'Imaging') return 'method-imaging';
  return 'method-other';
}

function animateCount(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const step = ts => {
    const prog = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - prog, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if (prog < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─── Hubble/JWST Gallery ────────────────────────────────
async function loadGallery() {
  const [hubble, jwst, mars] = await Promise.all([
    API.getNASAImages('hubble nebula galaxy cosmos'),
    API.getNASAImagesJWST(),
    API.getMarsPhotos(),
  ]);

  const container = document.getElementById('gallery-grid');
  if (!container) return;
  container.innerHTML = '';

  const addItems = (data, source) => {
    if (!data?.collection?.items) return;
    data.collection.items.forEach(item => {
      const d    = item.data?.[0];
      const link = item.links?.[0];
      if (!d) return;
      const card = el('div', 'gallery-item');
      card.innerHTML = `
        <div class="gallery-img-wrap">
          ${link?.href ? `<img src="${link.href}" alt="${d.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=gallery-no-img>🌌</div>'">` : '<div class="gallery-no-img">🌌</div>'}
        </div>
        <div class="gallery-item-body">
          <div class="gallery-item-source">${source}</div>
          <div class="gallery-item-title">${d.title}</div>
          <div class="gallery-item-date">${d.date_created?.slice(0,10) || ''}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (link?.href) window.open(link.href, '_blank');
      });
      container.appendChild(card);
    });
  };

  addItems(hubble, 'NASA / Hubble');
  addItems(jwst, 'NASA / JWST');

  // Mars rover photos
  if (mars?.latest_photos?.length) {
    mars.latest_photos.slice(0, 6).forEach(p => {
      const card = el('div', 'gallery-item');
      card.innerHTML = `
        <div class="gallery-img-wrap">
          <img src="${p.img_src}" alt="${p.camera.full_name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=gallery-no-img>🔭</div>'">
        </div>
        <div class="gallery-item-body">
          <div class="gallery-item-source">NASA / Mars · ${p.rover.name}</div>
          <div class="gallery-item-title">${p.camera.full_name}</div>
          <div class="gallery-item-date">Sol ${p.sol} · ${p.earth_date}</div>
        </div>
      `;
      card.addEventListener('click', () => window.open(p.img_src, '_blank'));
      container.appendChild(card);
    });
  }
}

// ─── Ticker ─────────────────────────────────────────────
async function loadTicker(launches) {
  const inner = document.getElementById('ticker-inner');
  if (!inner || !launches) return;
  const total   = launches.length;
  const fail    = launches.filter(l => l.success === false).length;
  const success = launches.filter(l => l.success === true).length;
  const rate    = (success + fail) > 0 ? Math.round(success / (success + fail) * 100) : 0;
  const last    = launches[launches.length - 1];

  const items = [
    `SpaceX Launches: <strong>${fmt(total)}</strong>`,
    `Mission Success Rate: <strong>${rate}%</strong>`,
    `Last Mission: <strong>${last?.name}</strong> · ${fmtDateShort(last?.date_utc)}`,
    `NEO Catalog: <strong>42,777+</strong> Near-Earth Objects`,
    `People in Space: <strong>12</strong> (ISS + Tiangong)`,
    `Confirmed Exoplanets: <strong>6,000+</strong>`,
    `Starlink Satellites: <strong>3,500+</strong>`,
    `Hubble Age: <strong>${new Date().getFullYear() - 1990} years</strong> in orbit`,
    `JWST Launched: <strong>Dec 25, 2021</strong>`,
    `Tesla Roadster: floating in solar orbit since <strong>Feb 2018</strong>`,
  ];

  // Duplicate for seamless loop
  const allItems = [...items, ...items];
  inner.innerHTML = allItems.map(i =>
    `<div class="ticker-item">· ${i} ·</div>`
  ).join('');
}

// ─── Utilities ──────────────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Refresh ────────────────────────────────────────────
async function refreshAll() {
  const btn = document.getElementById('refresh-btn');
  if (btn) btn.classList.add('spinning');

  await Promise.all([
    loadAPOD(),
    loadISS(),
    loadNEO(),
  ]);

  updateTimestamp();
  if (btn) btn.classList.remove('spinning');
}

// ─── Init ────────────────────────────────────────────────
async function init() {
  initStars();
  initTabs();
  updateTimestamp();
  setInterval(updateTimestamp, 1000);

  // Load all data in parallel
  const [, , , launches] = await Promise.all([
    loadAPOD(),
    loadISS(),
    loadSpaceX(),
    (async () => { const l = await API.getSpaceXLaunches(); await loadTicker(l); return l; })(),
  ]);

  // Load lighter sections slightly deferred
  loadNEO();
  loadExoplanets();
  loadGallery();

  document.getElementById('refresh-btn')?.addEventListener('click', refreshAll);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
