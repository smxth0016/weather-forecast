// ══════════════════════════════════════════════════════════════
//  modal.js  —  Full-detail weather modal with charts
// ══════════════════════════════════════════════════════════════

// (Removed fake data generators)
function uvLabel(v) {
  if (v <= 2) return "Low";
  if (v <= 5) return "Moderate";
  if (v <= 7) return "High";
  if (v <= 10) return "Very High";
  return "Extreme";
}

// ── HOURLY CHART (pure canvas) ────────────────────────────────
function drawHourlyChart(canvas, hourly, useFahrenheit) {
  const ctx    = canvas.getContext("2d");
  const W      = canvas.width  = canvas.offsetWidth  * devicePixelRatio;
  const H      = canvas.height = 140 * devicePixelRatio;
  canvas.style.height = "140px";
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.offsetWidth, h = 140;

  // Use theme colors
  const style = getComputedStyle(document.body);
  const chartLine = style.getPropertyValue("--chart-line").trim() || "#7dd3fc";
  const textDim   = style.getPropertyValue("--text-dim").trim() || "#7c84c0";
  const statVal   = style.getPropertyValue("--stat-val").trim() || "#dde0ff";

  const temps = hourly.map(p => useFahrenheit ? +(p.temp * 9/5 + 32).toFixed(1) : p.temp);
  const min = Math.min(...temps) - 2;
  const max = Math.max(...temps) + 2;
  const toY = v => h - 30 - ((v - min) / (max - min)) * (h - 50);

  const padL = 12, padR = 12;
  const step = (w - padL - padR) / (temps.length - 1);
  const pts  = temps.map((t, i) => ({ x: padL + i * step, y: toY(t), t }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, chartLine.replace(")", ", 0.25)").replace("rgb", "rgba"));
  grad.addColorStop(1, chartLine.replace(")", ", 0)").replace("rgb", "rgba"));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h - 22);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h - 22);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i-1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cp1x, pts[i-1].y, cp1x, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = chartLine;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Dots + labels
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = chartLine;
    ctx.fill();

    // temp value above dot
    ctx.fillStyle = statVal;
    ctx.font = `${10 * devicePixelRatio / devicePixelRatio}px DM Sans`;
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(p.t)}°`, p.x, p.y - 8);

    // hour label below
    ctx.fillStyle = textDim;
    ctx.fillText(hourly[i].hour.slice(0, 5), p.x, h - 6);
  });
}


// ── SUN ARC (canvas) ──────────────────────────────────────────
function drawSunArc(canvas, sunrise, sunset, cityCurrentTime) {
  // Use the actual rendered width so the arc fills its flex container
  const W = canvas.offsetWidth || 300;
  const H = Math.round(W * 0.5); // maintain a nice 2:1 aspect ratio
  canvas.width  = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width  = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const style = getComputedStyle(document.body);
  const textDim = style.getPropertyValue("--text-dim").trim() || "rgba(255,255,255,0.07)";

  const toMinutes = str => {
    if (!str || !str.includes(":")) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const srMin = toMinutes(sunrise);
  const ssMin = toMinutes(sunset);

  // Use city's local time from API instead of user's browser time
  let nowMin;
  if (cityCurrentTime) {
    // Format: "2024-04-02T16:43" — slice the time part
    const timePart = cityCurrentTime.includes("T") ? cityCurrentTime.split("T")[1] : cityCurrentTime;
    nowMin = toMinutes(timePart.slice(0, 5));
  } else {
    const now = new Date();
    nowMin = now.getHours() * 60 + now.getMinutes();
  }

  const progress = Math.min(1, Math.max(0, (nowMin - srMin) / (ssMin - srMin)));
  const isDay = document.body.classList.contains('day-theme');

  const cx = W / 2, cy = H - 12, r = H - 22;

  // Track arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.strokeStyle = isDay ? 'rgba(2,62,100,0.12)' : 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Progress arc
  const startAngle = Math.PI;
  const endAngle   = Math.PI + progress * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle, false);
  const progressGrad = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
  if (isDay) {
    progressGrad.addColorStop(0, 'rgba(154,52,18,0.3)');
    progressGrad.addColorStop(1, 'rgba(180,83,9,0.9)');
  } else {
    progressGrad.addColorStop(0, 'rgba(251,191,36,0.3)');
    progressGrad.addColorStop(1, 'rgba(251,191,36,0.85)');
  }
  ctx.strokeStyle = progressGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sun dot position
  const sunAngle = Math.PI + progress * Math.PI;
  const sx = cx + r * Math.cos(sunAngle);
  const sy = cy + r * Math.sin(sunAngle);

  // Glow
  const sunColorRGB = isDay ? '154,52,18' : '251,191,36';
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
  glow.addColorStop(0, `rgba(${sunColorRGB},0.4)`);
  glow.addColorStop(1, `rgba(${sunColorRGB},0)`);
  ctx.beginPath();
  ctx.arc(sx, sy, 12, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Sun dot
  ctx.beginPath();
  ctx.arc(sx, sy, 5, 0, Math.PI * 2);
  ctx.fillStyle = isDay ? '#b45309' : '#fbbf24';
  ctx.fill();

  // Horizon line
  ctx.beginPath();
  ctx.moveTo(cx - r - 6, cy);
  ctx.lineTo(cx + r + 6, cy);
  ctx.strokeStyle = isDay ? 'rgba(2,62,100,0.18)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Day length label
  if (srMin > 0 && ssMin > srMin) {
    const totalMins = ssMin - srMin;
    const hrs  = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    ctx.font = "10px DM Sans";
    ctx.fillStyle = document.body.classList.contains("day-theme") ? "#b45309" : "rgba(255,200,60,0.55)";
    ctx.textAlign = "center";
    ctx.fillText(`${hrs}h ${mins}m daylight`, cx, cy - 6);
  }
}

// ── CLOSE MODAL ──────────────────────────────────────────────
function closeModal() {
  document.getElementById("weatherModalOverlay")?.classList.remove("open");
  document.getElementById("weatherModalPanel")?.classList.remove("open");
  document.body.style.overflow = "";
}

// Wire listeners once on load — modal HTML already exists in index.html
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("weatherModalOverlay")
    ?.addEventListener("click", closeModal);
  document.getElementById("weatherModalPanel")
    ?.addEventListener("click", e => e.stopPropagation());
  document.getElementById("modalCloseBtn")
    ?.addEventListener("click", closeModal);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
});

// ── OPEN MODAL ────────────────────────────────────────────────
export function openDetailModal(data, useFahrenheit = false) {

  const toT = c => useFahrenheit ? +(c * 9/5 + 32).toFixed(1) : c;
  const unit = useFahrenheit ? "°F" : "°C";

  const condIcons = {
    sunny:"☀️",clear:"☀️",hot:"☀️",rain:"🌧️",drizzle:"🌧️",shower:"🌦️",
    cloud:"☁️",overcast:"☁️",mist:"☁️",partly:"⛅",snow:"❄️",sleet:"❄️",
    storm:"⛈️",thunder:"⛈️"
  };
  const getIcon = (condString) => {
    let icon = "☁️";
    const lc = (condString || "").toLowerCase();
    for (const [kw, em] of Object.entries(condIcons)) {
      if (lc.includes(kw)) { icon = em; break; }
    }
    return icon;
  };
  const icon = getIcon(data.condition);

  const uvColor = data.uvIndex <= 2 ? "#10b981" : data.uvIndex <= 5 ? "#f59e0b" : data.uvIndex <= 7 ? "#f97316" : "#ef4444";
  const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const windDir = windDirs[Math.round((data.windDirDeg || 0) / 45) % 8];

  document.getElementById("modalBody").innerHTML = `
    <!-- HERO -->
    <div class="modal-hero">
      <span class="modal-hero-icon">${icon}</span>
      <div class="modal-hero-info">
        <div class="modal-hero-city">${data.city}</div>
        <div class="modal-hero-temp">${toT(data.temperature)}${unit}</div>
        <div class="modal-hero-condition">${data.condition}</div>
        <div class="modal-hero-feels">Feels like ${toT(data.feelsLike)}${unit}</div>
      </div>
    </div>

    <!-- STAT PILLS -->
    <p class="modal-section-label">At a glance</p>
    <div class="modal-stats">
      <div class="stat-pill">
        <span class="stat-pill-icon">💧</span>
        <span class="stat-pill-val">${data.humidity}%</span>
        <span class="stat-pill-label">Humidity</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill-icon">🌬</span>
        <span class="stat-pill-val">${data.windSpeed} m/s</span>
        <span class="stat-pill-label">Wind ${windDir}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill-icon">👁</span>
        <span class="stat-pill-val">${data.visibility} km</span>
        <span class="stat-pill-label">Visibility</span>
      </div>
      <div class="stat-pill">
        <span class="stat-pill-icon">📊</span>
        <span class="stat-pill-val">${data.pressure} hPa</span>
        <span class="stat-pill-label">Pressure</span>
      </div>
    </div>

    <!-- HOURLY CHART -->
    <p class="modal-section-label">24-hour temperature</p>
    <div class="hourly-chart-wrap">
      <canvas id="hourlyCanvas"></canvas>
    </div>

    <!-- 7-DAY FORECAST -->
    <p class="modal-section-label">7-day forecast</p>
    <div class="forecast-row" id="forecastRow"></div>

    <!-- SUN + WIND -->
    <p class="modal-section-label">Sun & Wind</p>
    <div class="modal-two-col">
      <div class="sun-arc-wrap">
        <div class="sun-times">
          <div class="sun-time-item">
            <span class="sun-time-icon">🌅</span>
            <span class="sun-time-val">${data.sunrise}</span>
            <span class="sun-time-label">Sunrise</span>
          </div>
          <div class="sun-time-item">
            <span class="sun-time-icon">🌇</span>
            <span class="sun-time-val">${data.sunset}</span>
            <span class="sun-time-label">Sunset</span>
          </div>
        </div>
        <canvas id="sunArcCanvas"></canvas>
      </div>
      <div class="wind-compass-wrap">
        <svg id='modalCompassSVG' class='modal-compass-svg' viewBox='0 0 110 110' width='110' height='110'>
          <!-- Ring -->
          <circle cx='55' cy='55' r='48' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.08)' stroke-width='1.5'/>
          <!-- Major ticks (N/E/S/W) -->
          <line x1='55' y1='9'  x2='55' y2='20' stroke='rgba(255,255,255,0.3)'  stroke-width='2'   transform='rotate(0   55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='20' stroke='rgba(255,255,255,0.3)'  stroke-width='2'   transform='rotate(90  55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='20' stroke='rgba(255,255,255,0.3)'  stroke-width='2'   transform='rotate(180 55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='20' stroke='rgba(255,255,255,0.3)'  stroke-width='2'   transform='rotate(270 55 55)'/>
          <!-- Minor ticks (NE/SE/SW/NW) -->
          <line x1='55' y1='9'  x2='55' y2='16' stroke='rgba(255,255,255,0.14)' stroke-width='1.2' transform='rotate(45  55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='16' stroke='rgba(255,255,255,0.14)' stroke-width='1.2' transform='rotate(135 55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='16' stroke='rgba(255,255,255,0.14)' stroke-width='1.2' transform='rotate(225 55 55)'/>
          <line x1='55' y1='9'  x2='55' y2='16' stroke='rgba(255,255,255,0.14)' stroke-width='1.2' transform='rotate(315 55 55)'/>
          <!-- Cardinal labels -->
          <text x='55' y='13'  text-anchor='middle' fill='#7dd3fc'               font-size='10' font-family='DM Sans,sans-serif' font-weight='700'>N</text>
          <text x='98' y='58'  text-anchor='middle' fill='rgba(255,255,255,0.3)' font-size='9'  font-family='DM Sans,sans-serif'>E</text>
          <text x='55' y='103' text-anchor='middle' fill='rgba(255,255,255,0.3)' font-size='9'  font-family='DM Sans,sans-serif'>S</text>
          <text x='12' y='58'  text-anchor='middle' fill='rgba(255,255,255,0.3)' font-size='9'  font-family='DM Sans,sans-serif'>W</text>
          <!-- Animated needle -->
          <g id='modalCompassNeedle' style='transform-origin:55px 55px;transform:rotate(0deg);transition:transform 1.4s cubic-bezier(0.34,1.56,0.64,1)'>
            <polygon points='55,22 60,53 50,53' fill='#7dd3fc'/>
            <polygon points='55,88 60,57 50,57' fill='rgba(125,211,252,0.2)'/>
            <circle cx='55' cy='55' r='4.5' fill='#a78bfa'/>
          </g>
        </svg>
        <span class="wind-speed-label">${data.windSpeed} m/s</span>
        <span class="wind-dir-label">${windDir} · ${data.windDirDeg}°</span>
      </div>
    </div>

    <!-- DETAIL BARS -->
    <p class="modal-section-label">Conditions detail</p>
    <div class="bar-stat-list">
      <div class="bar-stat">
        <div class="bar-stat-header">
          <span class="bar-stat-name">💧 Humidity</span>
          <span class="bar-stat-value">${data.humidity}%</span>
        </div>
        <div class="bar-track"><div class="bar-fill humidity" data-w="${data.humidity}"></div></div>
      </div>
      <div class="bar-stat">
        <div class="bar-stat-header">
          <span class="bar-stat-name">☀️ UV Index</span>
          <span class="bar-stat-value" style="color:${uvColor}">${data.uvIndex} — ${uvLabel(data.uvIndex)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill uv" data-w="${(data.uvIndex / 11 * 100).toFixed(0)}"></div></div>
      </div>
      <div class="bar-stat">
        <div class="bar-stat-header">
          <span class="bar-stat-name">📊 Pressure</span>
          <span class="bar-stat-value">${data.pressure} hPa</span>
        </div>
        <div class="bar-track"><div class="bar-fill pressure" data-w="${((data.pressure - 980) / 60 * 100).toFixed(0)}"></div></div>
      </div>
      <div class="bar-stat">
        <div class="bar-stat-header">
          <span class="bar-stat-name">👁 Visibility</span>
          <span class="bar-stat-value">${data.visibility} km</span>
        </div>
        <div class="bar-track"><div class="bar-fill visibility" data-w="${Math.min(100,(data.visibility / 20 * 100).toFixed(0))}"></div></div>
      </div>
    </div>
  `;

  // 7-day forecast cards
  const forecastRow = document.getElementById("forecastRow");
  data.forecast.forEach((d, i) => {
    const hi = toT(d.hi), lo = toT(d.lo);
    const el = document.createElement("div");
    el.className = "forecast-day" + (i === 0 ? " today" : "");
    el.innerHTML = `
      <div class="forecast-day-name">${d.day}</div>
      <span class="forecast-day-icon">${getIcon(d.condition)}</span>
      <div class="forecast-day-hi">${hi}${unit}</div>
      <div class="forecast-day-lo">${lo}${unit}</div>
    `;
    forecastRow.appendChild(el);
  });

  // Open modal
  const overlay = document.getElementById("weatherModalOverlay");
  const panel   = document.getElementById("weatherModalPanel");
  overlay.classList.add("open");
  panel.classList.add("open");
  document.body.style.overflow = "hidden";

  // Draw canvases after paint
  requestAnimationFrame(() => {
    const hourlyCanvas = document.getElementById("hourlyCanvas");
    if (hourlyCanvas) drawHourlyChart(hourlyCanvas, data.hourly, useFahrenheit);

    const sunCanvas = document.getElementById("sunArcCanvas");
    if (sunCanvas) drawSunArc(sunCanvas, data.sunrise, data.sunset, data.currentTime);

    // Animate modal compass needle with same spring transition as dashboard card
    setTimeout(() => {
      const needle = document.getElementById('modalCompassNeedle');
      if (needle) needle.style.transform = `rotate(${data.windDirDeg || 0}deg)`;
    }, 120);

    // Animate bars
    setTimeout(() => {
      document.querySelectorAll(".bar-fill").forEach(el => {
        el.style.width = el.dataset.w + "%";
      });
    }, 80);
  });
}
