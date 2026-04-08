/**
 * Aero "Planetary View" Controller — Enhanced Edition
 * Powered by Globe.gl & Three.js
 */

import { fetchWeather } from './weatherService.js';

export class PlanetaryGlobe {
  constructor(containerId, state) {
    this.container = document.getElementById(containerId);
    this.state = state;
    this.globe = null;
    this.initialized = false;
    this.selectedCity = null;
    this._coordsTimer = null;

    // Temperature-based color coding
    this._tempColor = (temp) => {
      if (temp >= 38) return '#ef4444';   // scorching red
      if (temp >= 30) return '#f97316';   // hot orange
      if (temp >= 22) return '#fbbf24';   // warm yellow
      if (temp >= 14) return '#34d399';   // mild green
      if (temp >= 5)  return '#7dd3fc';   // cool blue
      return '#a5b4fc';                   // cold indigo
    };

    // Expanded world cities with full stats
    this.sampleSites = [
      { name: "New York",       lat: 40.71,  lng: -74.00,  temp: 18, cond: "Partly Cloudy", humidity: 62, windSpeed: 4.2, high: 21, low: 14 },
      { name: "London",         lat: 51.50,  lng: -0.12,   temp: 14, cond: "Overcast",       humidity: 78, windSpeed: 5.8, high: 16, low: 10 },
      { name: "Tokyo",          lat: 35.68,  lng: 139.65,  temp: 22, cond: "Clear",          humidity: 55, windSpeed: 3.1, high: 25, low: 18 },
      { name: "Mumbai",         lat: 19.07,  lng: 72.87,   temp: 33, cond: "Hazy & Hot",     humidity: 82, windSpeed: 6.4, high: 35, low: 29 },
      { name: "Sydney",         lat: -33.86, lng: 151.20,  temp: 19, cond: "Clear",          humidity: 60, windSpeed: 4.5, high: 22, low: 15 },
      { name: "Paris",          lat: 48.85,  lng: 2.35,    temp: 16, cond: "Cloudy",         humidity: 70, windSpeed: 4.0, high: 18, low: 12 },
      { name: "Rio de Janeiro", lat: -22.90, lng: -43.17,  temp: 28, cond: "Sunny",          humidity: 75, windSpeed: 3.8, high: 31, low: 24 },
      { name: "Cairo",          lat: 30.04,  lng: 31.23,   temp: 36, cond: "Dry & Sunny",    humidity: 20, windSpeed: 2.5, high: 38, low: 26 },
      { name: "Toronto",        lat: 43.65,  lng: -79.38,  temp: 12, cond: "Cloudy",         humidity: 68, windSpeed: 7.2, high: 14, low: 8  },
      { name: "Dubai",          lat: 25.20,  lng: 55.27,   temp: 39, cond: "Clear & Hot",    humidity: 35, windSpeed: 3.5, high: 41, low: 30 },
      { name: "Singapore",      lat: 1.35,   lng: 103.82,  temp: 30, cond: "Humid",          humidity: 85, windSpeed: 2.8, high: 32, low: 27 },
      { name: "Berlin",         lat: 52.52,  lng: 13.40,   temp: 10, cond: "Windy",          humidity: 65, windSpeed: 9.1, high: 13, low: 7  },
      { name: "Moscow",         lat: 55.75,  lng: 37.62,   temp: 2,  cond: "Snow Showers",   humidity: 80, windSpeed: 5.5, high: 4,  low: -2 },
      { name: "Los Angeles",    lat: 34.05,  lng: -118.24, temp: 24, cond: "Sunny",          humidity: 40, windSpeed: 3.0, high: 27, low: 18 },
      { name: "Jakarta",        lat: -6.21,  lng: 106.85,  temp: 31, cond: "Thunderstorm",   humidity: 90, windSpeed: 4.2, high: 33, low: 27 },
      { name: "Buenos Aires",   lat: -34.60, lng: -58.38,  temp: 20, cond: "Partly Cloudy",  humidity: 65, windSpeed: 5.0, high: 23, low: 16 },
    ];
  }

  // Map condition string to emoji icon
  _getConditionIcon(cond) {
    const c = (cond || '').toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) return '⛈';
    if (c.includes('snow')) return '❄️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌧';
    if (c.includes('overcast') || (c.includes('cloudy') && !c.includes('partly'))) return '☁️';
    if (c.includes('partly cloudy') || c.includes('partly')) return '⛅';
    if (c.includes('fog') || c.includes('hazy')) return '🌫';
    if (c.includes('windy')) return '💨';
    if (c.includes('sunny') || c.includes('clear')) return '☀️';
    if (c.includes('humid') || c.includes('hot')) return '🌡️';
    return '🌤';
  }

  init() {
    if (this.initialized) return;

    const loadingEl = document.getElementById('globeLoading');

    this.globe = Globe()
      (this.container)
      .globeImageUrl(this.getGlobeTexture())
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('rgba(110, 130, 255, 0.9)')
      .atmosphereAltitude(0.2)
      .enablePointerInteraction(true)

      // Animated ring pulse per city
      .ringsData(this.sampleSites)
      .ringColor(d => {
        const c = this._tempColor(d.temp);
        return `${c}99`;
      })
      .ringMaxRadius(4.5)
      .ringPropagationSpeed(1.8)
      .ringRepeatPeriod(1100)

      // Solid point dots at city locations
      .pointsData(this.sampleSites)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(d => this._tempColor(d.temp))
      .pointAltitude(0.012)
      .pointRadius(0.4)
      .pointsMerge(false)

      // Interactive HTML markers
      .htmlElementsData(this.sampleSites)
      .htmlElement(d => {
        const color = this._tempColor(d.temp);
        const icon  = this._getConditionIcon(d.cond);
        const el    = document.createElement('div');
        el.innerHTML = `
          <div class="globe-marker" style="--dot-color:${color}">
            <div class="marker-dot"></div>
            <div class="marker-label">
              <span class="m-city">${d.name}</span>
              <span class="m-temp" style="color:${color}">${d.temp}°</span>
              <span class="m-cond">${icon} ${d.cond}</span>
            </div>
          </div>
        `;
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.onclick = () => this.showCityDetail(d);
        return el;
      })
      .htmlLat('lat')
      .htmlLng('lng');

    // Smooth, damped controls
    const controls = this.globe.controls();
    if (controls) {
      controls.autoRotate      = true;
      controls.autoRotateSpeed = 0.2;
      controls.enableDamping   = true;
      controls.dampingFactor   = 0.06;
      controls.minDistance     = 150;
      controls.maxDistance     = 600;
    }

    // Initial orbital position — tilt toward populated landmasses
    this.globe.pointOfView({ lat: 20, lng: 15, altitude: 2.0 }, 0);

    // Fade out loading indicator
    setTimeout(() => {
      if (loadingEl) loadingEl.classList.add('hidden');
    }, 1400);

    // Live coordinate readout
    this._startCoordsDisplay();

    // Build HUD city strip + stats
    this._buildCityStrip();
    this._updateHudStats();

    // Responsive resize
    const resizeObs = new ResizeObserver(() => {
      if (this.globe) {
        this.globe.width(this.container.clientWidth);
        this.globe.height(this.container.clientHeight);
      }
    });
    resizeObs.observe(this.container);

    // Wire up detail-close button
    document.getElementById('detailCloseBtn')?.addEventListener('click', () => this.hideCityDetail());

    // ── Wheel-to-horizontal-scroll on city strip ──────────────────
    const strip = document.getElementById('hudCityStrip');
    if (strip) {
      let _scrollVelocity = 0;
      let _scrollRAF = null;

      const _animateScroll = () => {
        if (Math.abs(_scrollVelocity) < 0.5) { _scrollRAF = null; return; }
        strip.scrollLeft += _scrollVelocity;
        _scrollVelocity *= 0.80; // friction / deceleration (tighter = stops sooner)
        _scrollRAF = requestAnimationFrame(_animateScroll);
      };

      strip.addEventListener('wheel', (e) => {
        e.preventDefault(); // stop globe/page from reacting
        _scrollVelocity += e.deltaY * 0.15; // vertical delta → horizontal momentum (slow)
        if (!_scrollRAF) _scrollRAF = requestAnimationFrame(_animateScroll);
      }, { passive: false });
    }

    // Fetch live weather data iteratively to avoid rate-limits and force re-renders
    const updateSiteData = async () => {
      for (let i = 0; i < this.sampleSites.length; i++) {
        let site = this.sampleSites[i];
        try {
          const data = await fetchWeather(site.name, site.lat, site.lng);
          
          // CRITICAL: Replace the object with a NEW reference to force Globe.gl to re-render the HTML!
          this.sampleSites[i] = {
            ...site,
            temp: Math.round(data.temperature),
            cond: data.condition,
            humidity: data.humidity,
            windSpeed: data.windSpeed,
            high: data.high,
            low: data.low
          };
          
          if (this.globe) {
            this.globe.ringsData([...this.sampleSites]);
            this.globe.pointsData([...this.sampleSites]);
            this.globe.htmlElementsData([...this.sampleSites]);
          }
          
          this._buildCityStrip();
          this._updateHudStats();
          
          if (this.selectedCity && this.selectedCity.name === site.name) {
            this.showCityDetail(this.sampleSites[i]);
          }
          
          // Brief pause between requests to prevent backend/Open-Meteo rate limiting
          await new Promise(r => setTimeout(r, 250));
        } catch (err) {
          console.warn('Real-time scan failed for:', site.name);
        }
      }
    };
    updateSiteData();

    this.initialized = true;
    console.log('🌍 Planetary Globe: Orbital Scan Active.');
  }

  _startCoordsDisplay() {
    const coordsEl = document.getElementById('hudCoords');
    if (!coordsEl || !this.globe) return;
    this._coordsTimer = setInterval(() => {
      try {
        const pov    = this.globe.pointOfView();
        const lat    = parseFloat(pov.lat).toFixed(2);
        const lng    = parseFloat(pov.lng).toFixed(2);
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        coordsEl.textContent = `LAT ${Math.abs(lat)}° ${latDir}  ·  LON ${Math.abs(lng)}° ${lngDir}`;
      } catch {}
    }, 500);
  }

  _buildCityStrip() {
    const strip = document.getElementById('hudCityStrip');
    if (!strip) return;
    strip.innerHTML = '';
    this.sampleSites.forEach(d => {
      const color = this._tempColor(d.temp);
      const icon  = this._getConditionIcon(d.cond);
      const chip  = document.createElement('div');
      chip.className = 'hud-city-chip';
      chip.style.setProperty('--chip-color', color);
      chip.innerHTML = `
        <span class="hud-chip-city">${d.name}</span>
        <span class="hud-chip-temp" style="color:${color}">${d.temp}°</span>
        <span class="hud-chip-cond">${icon} ${d.cond}</span>
      `;
      chip.onclick = () => {
        this.globe.controls().autoRotate = false;
        this.globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 1400);
        setTimeout(() => { this.globe.controls().autoRotate = true; }, 4000);
        this.showCityDetail(d);
      };
      strip.appendChild(chip);
    });
  }

  _updateHudStats() {
    const countEl = document.getElementById('hudCityCount');
    const avgEl   = document.getElementById('hudAvgTemp');
    if (countEl) countEl.textContent = this.sampleSites.length;
    if (avgEl) {
      const avg = Math.round(this.sampleSites.reduce((s, d) => s + d.temp, 0) / this.sampleSites.length);
      avgEl.textContent = `${avg}°`;
    }
  }

  showCityDetail(d) {
    const panel = document.getElementById('hudCityDetail');
    if (!panel) return;
    const icon = this._getConditionIcon(d.cond);
    const color = this._tempColor(d.temp);
    document.getElementById('detailCityName').textContent  = d.name;
    document.getElementById('detailCondition').textContent  = `${icon} ${d.cond}`;
    document.getElementById('detailTemp').textContent       = `${d.temp}°`;
    document.getElementById('detailTemp').style.cssText     = `background:linear-gradient(135deg,#fff,${color});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;`;
    document.getElementById('detailHumidity').textContent   = `${d.humidity}%`;
    document.getElementById('detailWind').textContent       = `${d.windSpeed} m/s`;
    document.getElementById('detailHigh').textContent       = `${d.high}°C`;
    document.getElementById('detailLow').textContent        = `${d.low}°C`;
    panel.classList.add('visible');
    this.selectedCity = d;
  }

  hideCityDetail() {
    const panel = document.getElementById('hudCityDetail');
    if (panel) panel.classList.remove('visible');
    this.selectedCity = null;
  }

  getGlobeTexture() {
    const isDay = document.body.classList.contains('day-theme');
    return isDay
      ? 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
      : 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
  }

  updateTheme() {
    if (!this.globe) return;
    this.globe.globeImageUrl(this.getGlobeTexture());
  }

  pointTo(lat, lng, altitude = 2.0) {
    if (!this.globe) return;
    this.globe.pointOfView({ lat, lng, altitude }, 2000);
  }

  destroy() {
    if (this._coordsTimer) clearInterval(this._coordsTimer);
  }
}
