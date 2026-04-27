import { openDetailModal } from "./modal.js";

const weatherResult  = document.getElementById("weatherResult");
const dashEmptyMain  = document.getElementById("dashEmptyMain");
const celestialBody  = document.getElementById("celestialBody");

export const ICONS = {
  SUN: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  CLOUD: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.8-4.3-4.2-4.5C17.4 6.9 14.5 4 11 4c-3.1 0-5.7 2.1-6.7 5C2.1 9.5 0 11.8 0 14.5 0 17 2 19 4.5 19h13z"/></svg>',
  RAIN: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
  SNOW: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/></svg>',
  STORM: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6"/></svg>',
  WIND: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.7 7.7A2.5 2.5 0 1 1 15.8 12H3M21 14a2.5 2.5 0 1 0-2.5-2.5H3M17.3 19.3A2.5 2.5 0 1 1 15.4 15H3"/></svg>',
  DROP: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  THERMOMETER: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/></svg>',
  SHIELD: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  VISIBILITY: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  PRESSURE: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  STAR: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  STAR_OUTLINE: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

// ─── CONDITION THEME MAP ─────────────────────────────────────
const CONDITION_THEMES = [
  { keywords: ["storm", "thunder", "tornado", "heavy rain", "violent"], cls: "condition-stormy", icon: ICONS.STORM, stripe: "stripe-storm"},
  { keywords: ["sun", "clear", "hot"],                 cls: "condition-sunny",  icon: ICONS.SUN,  stripe: "stripe-hot"  },
  { keywords: ["rain", "drizzle", "shower"],           cls: "condition-rainy",  icon: ICONS.RAIN,  stripe: "stripe-cool" },
  { keywords: ["cloud", "overcast", "partly"],         cls: "condition-cloudy", icon: ICONS.CLOUD,  stripe: "stripe-mild" },
  { keywords: ["snow", "sleet", "blizzard"],           cls: "condition-snowy",  icon: ICONS.SNOW,  stripe: "stripe-cold" },
  { keywords: ["mist", "fog", "haze"],                 cls: "condition-foggy",  icon: ICONS.CLOUD,  stripe: "stripe-mild" },
];

const COND_PILL_MAP = {
  storm:  "pill-stormy", thunder:"pill-stormy", "heavy rain": "pill-stormy", violent: "pill-stormy",
  sunny:  "pill-sunny",  clear: "pill-sunny",   hot:    "pill-sunny",
  rain:   "pill-rainy",  drizzle:"pill-rainy",  shower: "pill-rainy",
  cloud:  "pill-cloudy", overcast:"pill-cloudy", partly:"pill-cloudy",
  snow:   "pill-snowy",  sleet: "pill-snowy",
  mist:   "pill-foggy",  fog: "pill-foggy",     haze: "pill-foggy",
};

export function resolveCondition(str = "") {
  const lower = str.toLowerCase();
  for (const theme of CONDITION_THEMES) {
    if (theme.keywords.some(kw => lower.includes(kw))) return theme;
  }
  return { cls: "", icon: ICONS.THERMOMETER, stripe: "stripe-mild" };
}

export function resolvePillClass(str = "") {
  const lower = str.toLowerCase();
  for (const [kw, cls] of Object.entries(COND_PILL_MAP)) {
    if (lower.includes(kw)) return cls;
  }
  return "pill-cloudy";
}

export function escapeHTML(str) {
  if (!str) return "";
  return str.toString().replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

export function resolveAQI(val) {
  if (val === null || val === undefined) return { label: "N/A", cls: "aqi-na" };
  if (val <= 50) return { label: "Good", cls: "aqi-good" };
  if (val <= 100) return { label: "Moderate", cls: "aqi-moderate" };
  if (val <= 150) return { label: "Unhealthy for Sensitive Groups", cls: "aqi-unhealthy-sensitive" };
  if (val <= 200) return { label: "Unhealthy", cls: "aqi-unhealthy" };
  if (val <= 300) return { label: "Very Unhealthy", cls: "aqi-very-unhealthy" };
  return { label: "Hazardous", cls: "aqi-hazardous" };
}

export function toFahrenheit(c) {
  return +((c * 9) / 5 + 32).toFixed(1);
}

export function tempStr(c, useFahrenheit) {
  return useFahrenheit ? `${toFahrenheit(c)}°F` : `${c}°C`;
}

export function stripeClass(temp) {
  if (temp >= 35) return "stripe-hot";
  if (temp >= 20) return "stripe-warm";
  if (temp >= 10) return "stripe-mild";
  if (temp >= 0)  return "stripe-cool";
  return "stripe-cold";
}

/**
 * Updates the global background and celestial body (sun/moon)
 * @param {boolean} isDay 
 */
// ─── WEATHER SCENE ENGINE ────────────────────────────────────
let lightningInterval = null;

/**
 * Updates the global background, celestial body, and weather effects
 * @param {boolean} isDay 
 * @param {string} condition
 */
export function updateWeatherScene(isDay, condition = "") {
  // 1. Day / Night Theme
  if (isDay) {
    document.body.classList.add("day-theme");
    if (celestialBody) {
      celestialBody.classList.remove("moon");
      celestialBody.classList.add("sun", "active");
    }
  } else {
    document.body.classList.remove("day-theme");
    if (celestialBody) {
      celestialBody.classList.remove("sun");
      celestialBody.classList.add("moon", "active");
    }
  }

  // Dispatch a theme change event so 3D modules (like Planetary Globe) can sync
  document.body.dispatchEvent(new Event("themeChanged"));

  // 2. Weather Effects Cleanup
  clearWeatherParticles();

  // 3. Apply Condition Class & Particles
  const theme = resolveCondition(condition);
  const body = document.body;
  
  // Remove all previous weather bg classes
  body.classList.forEach(cls => {
    if (cls.startsWith("weather-bg-")) body.classList.remove(cls);
  });

  const sceneCls = theme.cls ? theme.cls.replace("condition-", "weather-bg-") : "weather-bg-cloudy";
  body.classList.add(sceneCls);

  // Toggle static layers
  document.getElementById("sunRaysLayer")?.classList.toggle("active", sceneCls === "weather-bg-sunny");
  document.getElementById("fogLayer")?.classList.toggle("active", sceneCls === "weather-bg-foggy");
  
  if (sceneCls === "weather-bg-foggy") {
    spawnFog();
  } else if (sceneCls === "weather-bg-rainy") {
    spawnParticles("rainLayer", "raindrop", 120);
  } else if (sceneCls === "weather-bg-stormy") {
    spawnParticles("rainLayer", "raindrop", 180);
    startLightning();
  } else if (sceneCls === "weather-bg-snowy") {
    spawnParticles("snowLayer", "snowflake", 150);
  }
}

function clearWeatherParticles() {
  document.getElementById("rainLayer")?.classList.remove("active");
  document.getElementById("snowLayer")?.classList.remove("active");
  document.getElementById("lightningLayer")?.classList.remove("active");
  
  const layers = ["rainLayer", "snowLayer", "fogLayer"];
  layers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });

  if (lightningInterval) {
    clearInterval(lightningInterval);
    lightningInterval = null;
  }
}

function spawnParticles(layerId, className, count) {
  spawnParticlesInNode(document.getElementById(layerId), className, count);
}

export function spawnParticlesInNode(layer, className, count) {
  if (!layer) return;
  layer.classList.add("active");
  
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = className;
    const left = Math.random() * 100;
    const duration = className === "raindrop" ? (0.5 + Math.random() * 0.5) : (5 + Math.random() * 10);
    const delay = Math.random() * 5;
    p.style.left = `${left}%`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;
    
    if (className === "snowflake") {
      const depth = Math.random();
      if (depth > 0.85) {
        // Foreground (large, fast, very blurry bokeh)
        const size = Math.random() * 20 + 15;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.opacity = (Math.random() * 0.3 + 0.1).toString();
        p.style.filter = `blur(${Math.random() * 4 + 3}px)`;
        p.style.animationDuration = `${Math.random() * 4 + 3}s`;
      } else if (depth > 0.6) {
        // Sharp Focus Layer (clear, completely unblurred snowflakes)
        const size = Math.random() * 5 + 4;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.opacity = (Math.random() * 0.2 + 0.8).toString();
        p.style.filter = `blur(0px)`;
        p.style.animationDuration = `${Math.random() * 5 + 4}s`;
      } else if (depth > 0.3) {
        // Midground (medium, slightly blurry)
        const size = Math.random() * 4 + 3;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.opacity = (Math.random() * 0.4 + 0.4).toString();
        p.style.filter = `blur(${Math.random() * 1.5 + 0.5}px)`;
        p.style.animationDuration = `${Math.random() * 6 + 4}s`;
      } else {
        // Background (small, sharp but dim, slow)
        const size = Math.random() * 3 + 1.5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.opacity = (Math.random() * 0.3 + 0.2).toString();
        p.style.filter = `blur(1px)`;
        p.style.animationDuration = `${Math.random() * 10 + 8}s`;
      }
    }
    
    fragment.appendChild(p);
  }
  layer.appendChild(fragment);
}

function spawnFog() {
  const layer = document.getElementById("fogLayer");
  if (!layer) return;
  layer.innerHTML = '<div class="fog-strip fs1"></div><div class="fog-strip fs2"></div>';
}

function startLightning() {
  const layer = document.getElementById("lightningLayer");
  if (!layer) return;
  layer.classList.add("active");
  
  if (!layer.querySelector(".lightning-flash")) {
    layer.innerHTML = '<div class="lightning-flash"></div>';
  }
  const flash = layer.querySelector(".lightning-flash");

  lightningInterval = setInterval(() => {
    if (Math.random() > 0.7) {
      flash.classList.remove("animate");
      void flash.offsetWidth; // Trigger reflow
      flash.classList.add("animate");
    }
  }, 3000);
}

// ─── SKELETON — inline inside weather panel ───────────────────
export function showSkeleton() {
  dashEmptyMain.classList.add("hidden");
  dashEmptyMain.style.display = "none";
  weatherResult.classList.remove("hidden");
  weatherResult.style.display = "block";
  weatherResult.className = "weather-panel";
  weatherResult.onclick = null;
  weatherResult.innerHTML = `
    <div class="wp-skeleton">
      <div class="wp-skel-line skel-city"></div>
      <div class="wp-skel-line skel-pill"></div>
      <div class="wp-skel-line skel-temp"></div>
      <div class="wp-skel-line skel-feels"></div>
      <div class="wp-skel-stats">
        <div class="wp-skel-line skel-stat"></div>
        <div class="wp-skel-line skel-stat"></div>
        <div class="wp-skel-line skel-stat"></div>
        <div class="wp-skel-line skel-stat"></div>
      </div>
      <div class="wp-skel-line skel-chart"></div>
    </div>
  `;
}

// ─── SPARKLINE ───────────────────────────────────────────────
const sparkCharts = {};

export function drawSparkline(canvasId, hourlyTemps, useFahrenheit, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  // Use theme colors if color not provided
  const style = getComputedStyle(document.body);
  const chartLine = color || style.getPropertyValue("--chart-line").trim() || "#7dd3fc";
  const chartAxis = style.getPropertyValue("--chart-axis").trim() || "#7c84c0";

  const temps = useFahrenheit
    ? hourlyTemps.map(t => Math.round(toFahrenheit(t)))
    : hourlyTemps;

  if (sparkCharts[canvasId]) {
    sparkCharts[canvasId].destroy();
    delete sparkCharts[canvasId];
  }

  sparkCharts[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
      labels: hourlyTemps.map((_, i) => `${(new Date().getHours() + i * 2) % 24}h`),
      datasets: [{
        data: temps,
        borderColor: chartLine,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        backgroundColor: chartLine.replace(")", ", 0.08)").replace("rgb", "rgba"),
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => useFahrenheit ? `${ctx.raw}°F` : `${ctx.raw}°C` },
          displayColors: false,
          padding: 6,
          bodyFont: { size: 11 },
        },
      },
      scales: {
        x: {
          display: true,
          ticks: { font: { size: 9 }, color: chartAxis, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          grid: { display: false },
          border: { display: false },
        },
        y: { display: false, grace: "15%" },
      },
      animation: { duration: 500 },
    },
  });
}

// ─── GENERATE HOURLY DATA ────────────────────────────────────
// (Removed generateHourly since we fetch real hourly data from the API)

// ─── COMFORT METRICS CALCULATORS ─────────────────────────────
/** Magnus formula dew point */
function calcDewPoint(T, RH) {
  const a = 17.625, b = 243.04;
  const gamma = (a * T) / (b + T) + Math.log(RH / 100);
  return +(b * gamma / (a - gamma)).toFixed(1);
}

/** NWS Rothfusz polynomial — applicable when T≥27°C and RH≥40% */
function calcHeatIndex(T, RH) {
  const HI = -8.78469475556 + 1.61139411*T + 2.33854883889*RH
    - 0.14611605*T*RH - 0.012308094*T*T
    - 0.0164248277778*RH*RH + 0.002211732*T*T*RH
    + 0.00072546*T*RH*RH - 0.000003582*T*T*RH*RH;
  return +HI.toFixed(1);
}

/** Environment Canada wind chill — applicable when T≤10°C and wind≥4.8 km/h */
function calcWindChill(T, windSpeedMs) {
  const V = windSpeedMs * 3.6; // m/s → km/h
  if (V < 4.8) return null;
  return +(13.12 + 0.6215*T - 11.37*Math.pow(V,0.16) + 0.3965*T*Math.pow(V,0.16)).toFixed(1);
}

// ─── MINI INSTRUMENT RENDERERS ────────────────────────────────
function drawMiniCompass(canvasId, deg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const size = 55;
  canvas.width  = size * devicePixelRatio;
  canvas.height = size * devicePixelRatio;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const cx = size / 2, cy = size / 2, r = 30;

  const accent = getComputedStyle(document.body).getPropertyValue('--chart-line').trim() || '#7dd3fc';

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cardinal labels
  ctx.font = '7px DM Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [['N',cx,cy-r+9],['E',cx+r-9,cy],['S',cx,cy+r-9],['W',cx-r+9,cy]]
    .forEach(([l,x,y]) => ctx.fillText(l, x, y));

  // Arrow
  const rad = (deg - 90) * Math.PI / 180;
  const len = r - 9;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.beginPath();
  ctx.moveTo(0, -len); ctx.lineTo(3.5, 0); ctx.lineTo(-3.5, 0);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 2); ctx.lineTo(0, len * 0.45);
  ctx.strokeStyle = 'rgba(125,211,252,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Centre dot
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();
}

function drawMiniSunArc(canvasId, sunrise, sunset, currentTime) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const W = canvas.offsetWidth || 80;
  const H = Math.round(W * 0.52);
  canvas.width  = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const toMins = s => { if (!s || !s.includes(':')) return 0; const [h,m] = s.split(':').map(Number); return h*60+(m||0); };
  const srMin = toMins(sunrise), ssMin = toMins(sunset);
  let nowMin;
  if (currentTime) {
    const tp = currentTime.includes('T') ? currentTime.split('T')[1] : currentTime;
    nowMin = toMins(tp.slice(0,5));
  } else { const n = new Date(); nowMin = n.getHours()*60+n.getMinutes(); }
  const progress = Math.min(1, Math.max(0, (nowMin - srMin) / (ssMin - srMin)));

  const cx = W/2, cy = H - 6, r = H - 14;
  const isDay = document.body.classList.contains('day-theme');

  // Track arc
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = isDay ? 'rgba(2,62,100,0.15)' : 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2; ctx.stroke();

  // Progress arc
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + progress * Math.PI);
  ctx.strokeStyle = isDay ? 'rgba(180,83,9,0.9)' : 'rgba(251,191,36,0.85)';
  ctx.lineWidth = 2.5; ctx.stroke();

  // Sun glow + dot
  const sa = Math.PI + progress * Math.PI;
  const sx = cx + r * Math.cos(sa), sy = cy + r * Math.sin(sa);
  const sunColor = isDay ? '180,83,9' : '251,191,36';
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
  glow.addColorStop(0, `rgba(${sunColor},0.5)`); glow.addColorStop(1, `rgba(${sunColor},0)`);
  ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill();
  ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI*2);
  ctx.fillStyle = isDay ? '#b45309' : '#fbbf24'; ctx.fill();

  // Horizon line
  ctx.beginPath(); ctx.moveTo(cx-r-3, cy); ctx.lineTo(cx+r+3, cy);
  ctx.strokeStyle = isDay ? 'rgba(2,62,100,0.18)' : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1; ctx.stroke();
}

// ─── RENDER WEATHER PANEL ────────────────────────────────────
export function renderWeather(data, useFahrenheit = false, bookmarked = false) {
  if (!data) return;

  // Update theme & weather scene based on API data
  updateWeatherScene(data.isDay, data.condition);

  dashEmptyMain.classList.add("hidden");
  dashEmptyMain.style.display = "none";
  weatherResult.classList.remove("hidden");
  weatherResult.style.display = "block";

  const { cls, icon } = resolveCondition(data.condition);
  const pillCls = resolvePillClass(data.condition);
  // Used real stats from API
  const feelsLike = data.feelsLike;
  const hi        = data.high;
  const lo        = data.low;

  // ── Comfort metrics ────────────────────────────────────────
  const dewPoint = calcDewPoint(data.temperature, data.humidity);
  const windDirs = ['N','NE','E','SE','S','SW','W','NW'];
  const windDir  = windDirs[Math.round((data.windDirDeg || 0) / 45) % 8];

  let comfortLabel = 'Comfort Index', comfortVal = null, comfortIcon = ICONS.THERMOMETER, comfortClass = 'mild';
  if (data.temperature >= 27 && data.humidity >= 40) {
    comfortVal   = calcHeatIndex(data.temperature, data.humidity);
    comfortLabel = 'Heat Index'; comfortIcon = ICONS.THERMOMETER; comfortClass = 'hot';
  } else if (data.temperature <= 10) {
    const wc = calcWindChill(data.temperature, data.windSpeed);
    if (wc !== null) { comfortVal = wc; comfortLabel = 'Wind Chill'; comfortIcon = ICONS.THERMOMETER; comfortClass = 'cold'; }
  }
  const comfortDisplay = comfortVal !== null ? `${comfortVal}°` : 'N/A';

  weatherResult.className = `weather-panel${cls ? " " + cls : ""}`;

  weatherResult.innerHTML = `
    <div class="wp-stripe ${stripeClass(data.temperature)}"></div>

    <div class="wp-top">
      <div class="wp-left">
        <div class="wp-city">
          ${escapeHTML(data.city)}
          ${data.provider === 'wttr.in' ? `<span class="resilience-badge" title="Resilience Mode: Primary service unreachable. Using high-reliability fallback.">${ICONS.SHIELD}</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="cond-pill ${pillCls}">${icon} ${escapeHTML(data.condition)}</span>
          ${data.aqi !== undefined ? `
            <div class="aqi-badge ${resolveAQI(data.aqi).cls}" title="Air Quality Index (US AQI)">
              <span class="aqi-val-num">${data.aqi}</span>
              <span class="aqi-label-text">${resolveAQI(data.aqi).label}</span>
            </div>
          ` : ''}
        </div>
        <div class="wp-temp">${tempStr(data.temperature, useFahrenheit)}</div>
        <div class="wp-feels">Feels like ${tempStr(feelsLike, useFahrenheit)}</div>
      </div>
      <div class="wp-right">
        <div class="wp-icon">${icon}</div>
        <button class="bookmark-btn${bookmarked ? " active" : ""}" id="bookmarkBtn">
          ${bookmarked ? ICONS.STAR + " Bookmarked" : ICONS.STAR_OUTLINE + " Bookmark"}
        </button>
      </div>
    </div>

    <!-- ── Stats + Comfort merged 3×2 grid ───────────────────────── -->
    <div class="wp-stats">
      <div class="wp-stat">
        <span class="wp-stat-label">${ICONS.DROP} Humidity</span>
        <span class="wp-stat-val">${data.humidity}%</span>
      </div>
      <div class="wp-stat">
        <span class="wp-stat-label">${ICONS.WIND} Wind</span>
        <span class="wp-stat-val">${data.windSpeed} m/s</span>
      </div>
      <div class="wp-stat">
        <span class="wp-stat-label">${ICONS.THERMOMETER} High / Low</span>
        <span class="wp-stat-val">${tempStr(hi, useFahrenheit)} · ${tempStr(lo, useFahrenheit)}</span>
      </div>
      <div class="wp-stat">
        <span class="wp-stat-label">${ICONS.DROP} Dew Point</span>
        <span class="wp-stat-val">${dewPoint}°</span>
      </div>
      <div class="wp-stat">
        <span class="wp-stat-label">${comfortIcon} ${comfortLabel}</span>
        <span class="wp-stat-val wp-comfort-${comfortClass}">${comfortDisplay}</span>
      </div>
      <div class="wp-stat">
        <span class="wp-stat-label">Feels Like</span>
        <span class="wp-stat-val">${tempStr(feelsLike, useFahrenheit)}</span>
      </div>
    </div>

    <!-- ── Compact Instrument Strip ──────────────────────────── -->
    <div class="wp-instruments">
      <div class="wp-instrument-card">
        <svg id='miniCompassSVG' class='wp-mini-compass' viewBox='0 0 80 80' width='70' height='70'>
          <!-- Ring -->
          <circle cx='40' cy='40' r='35' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.08)' stroke-width='1.5'/>
          <!-- Major ticks (N/E/S/W) -->
          <line x1='40' y1='6' x2='40' y2='14' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' transform='rotate(0 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='14' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' transform='rotate(90 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='14' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' transform='rotate(180 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='14' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' transform='rotate(270 40 40)'/>
          <!-- Minor ticks (NE/SE/SW/NW) -->
          <line x1='40' y1='6' x2='40' y2='11' stroke='rgba(255,255,255,0.12)' stroke-width='1' transform='rotate(45 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='11' stroke='rgba(255,255,255,0.12)' stroke-width='1' transform='rotate(135 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='11' stroke='rgba(255,255,255,0.12)' stroke-width='1' transform='rotate(225 40 40)'/>
          <line x1='40' y1='6' x2='40' y2='11' stroke='rgba(255,255,255,0.12)' stroke-width='1' transform='rotate(315 40 40)'/>
          <!-- Cardinal labels -->
          <text x='40' y='9' text-anchor='middle' fill='#7dd3fc' font-size='7' font-family='DM Sans,sans-serif' font-weight='700'>N</text>
          <text x='72' y='43' text-anchor='middle' fill='rgba(255,255,255,0.28)' font-size='6.5' font-family='DM Sans,sans-serif'>E</text>
          <text x='40' y='77' text-anchor='middle' fill='rgba(255,255,255,0.28)' font-size='6.5' font-family='DM Sans,sans-serif'>S</text>
          <text x='8' y='43' text-anchor='middle' fill='rgba(255,255,255,0.28)' font-size='6.5' font-family='DM Sans,sans-serif'>W</text>
          <!-- Animated needle -->
          <g id='compassNeedle' style='transform-origin:40px 40px;transform:rotate(0deg);transition:transform 1.4s cubic-bezier(0.34,1.56,0.64,1)'>
            <polygon points='40,15 44,39 36,39' fill='#7dd3fc'/>
            <polygon points='40,65 44,41 36,41' fill='rgba(125,211,252,0.2)'/>
            <circle cx='40' cy='40' r='3.5' fill='#a78bfa'/>
          </g>
        </svg>
        <div class="wp-instrument-info">
          <span class="wp-instrument-title">Wind</span>
          <span class="wp-instrument-sub">${windDir} · ${data.windDirDeg || 0}°</span>
          <span class="wp-instrument-speed">${data.windSpeed} m/s</span>
        </div>
      </div>
      <div class="wp-instrument-card">
        <canvas id="miniSunCanvas" class="wp-mini-sun"></canvas>
        <div class="wp-instrument-info">
          <span class="wp-instrument-title">Sun path</span>
          <span class="wp-instrument-sub">${ICONS.SUN} ${data.sunrise || '--:--'} · ${ICONS.CLOUD} ${data.sunset || '--:--'}</span>
        </div>
      </div>
    </div>

    <div class="wp-spark-wrap">
      <div class="wp-spark-label">24-hour temperature</div>
      <div class="wp-spark-chart">
        <canvas id="mainSparkCanvas"></canvas>
      </div>
    </div>

    <div class="wp-footer">
      <span class="expand-hint">Click card for full details ↗</span>
    </div>
  `;

  // Single delegated handler — survives re-renders
  weatherResult.onclick = (e) => {
    if (e.target.closest("#bookmarkBtn")) {
      e.stopPropagation();
      window.__toggleBookmark?.(data.city);
      return;
    }
    openDetailModal(data, useFahrenheit);
  };

  // Draw all canvases after paint
  requestAnimationFrame(() => {
    const sparklineData = data.hourly ? data.hourly.map(p => p.temp) : [];
    drawSparkline("mainSparkCanvas", sparklineData, useFahrenheit, "#7dd3fc");
    drawMiniSunArc("miniSunCanvas", data.sunrise, data.sunset, data.currentTime);
    // Animate compass needle with smooth spring transition
    setTimeout(() => {
      const needle = document.getElementById('compassNeedle');
      if (needle) needle.style.transform = `rotate(${data.windDirDeg || 0}deg)`;
    }, 80);
  });
}

// ─── SHOW ERROR ──────────────────────────────────────────────
export function showError(message) {
  dashEmptyMain.classList.add("hidden");
  dashEmptyMain.style.display = "none";
  weatherResult.classList.remove("hidden");
  weatherResult.style.display = "block";
  weatherResult.className = "weather-panel";
  weatherResult.onclick = null;
  weatherResult.innerHTML = `
    <div class="wp-error-container">
      <p class="wp-error-icon"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg></p>
      <p class="wp-error-msg">${message}</p>
      <button class="wp-retry-btn" onclick="location.reload()">Try Reconnecting</button>
    </div>
  `;
}
