import { fetchWeather } from "./weatherService.js";
import { predictWeather } from "./predictorService.js";
import {
  renderWeather, showError, showSkeleton,
  resolveCondition, resolvePillClass, stripeClass,
  tempStr, drawSparkline, updateWeatherScene, spawnParticlesInNode
} from "./ui.js";

import { PlanetaryGlobe } from "./globe.js";
import { VantaManager } from "./vantaManager.js";

// ─── ELEMENTS ────────────────────────────────────────────────
const searchBtn  = document.getElementById("searchBtn");
const cityInput  = document.getElementById("cityInput");
const unitToggle = document.getElementById("unitToggle");
const suggestionsContainer = document.getElementById("suggestionsContainer");

// ─── KEYS ────────────────────────────────────────────────────
const HISTORY_KEY  = "weather_search_history";
const BOOKMARK_KEY = "weather_bookmarks";

// ─── STATE ───────────────────────────────────────────────────
const STATE = {
  lastData:      null,
  useFahrenheit: false,
  bookmarks:     [],
  history:       [],
  sortMode:      "recent",
};

// ─── PERSIST ─────────────────────────────────────────────────
function loadState() {
  try { STATE.bookmarks = JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || []; } catch { STATE.bookmarks = []; }
  try { STATE.history   = JSON.parse(localStorage.getItem(HISTORY_KEY))  || []; } catch { STATE.history = []; }
  if (!STATE.history.length)
    STATE.history = ["London", "New York", "Tokyo", "Mumbai", "Paris"];
}
function saveBookmarks() { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(STATE.bookmarks)); }
function saveHistory()   { localStorage.setItem(HISTORY_KEY,  JSON.stringify(STATE.history));  }

// ─── MASTER RENDER ───────────────────────────────────────────
function renderAll() {
  renderWeather(STATE.lastData, STATE.useFahrenheit, isBookmarked(STATE.lastData?.city));
  renderBookmarksList();
  renderHistoryChips();
}

// ─── BOOKMARK HELPERS ────────────────────────────────────────
function isBookmarked(city) {
  if (!city) return false;
  return STATE.bookmarks.some(c => c.toLowerCase() === city.toLowerCase());
}

function toggleBookmark(city) {
  const was = isBookmarked(city);
  if (was) {
    STATE.bookmarks = STATE.bookmarks.filter(c => c.toLowerCase() !== city.toLowerCase());
  } else {
    STATE.bookmarks.unshift(city);
  }
  saveBookmarks();
  showBookmarkToast(city, !was);
  renderAll();
}

function showBookmarkToast(city, added) {
  const existing = document.getElementById("bookmarkToast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "bookmarkToast";
  toast.innerHTML = added
    ? `🔖 <strong>${city}</strong> added to bookmarks`
    : `🗑 <strong>${city}</strong> removed from bookmarks`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visible"));
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ─── SORT ────────────────────────────────────────────────────
window.__sortBookmarks = function(mode, btn) {
  STATE.sortMode = mode;
  document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderBookmarksList();
};

function getSortedBookmarks() {
  const list = [...STATE.bookmarks];
  if (STATE.sortMode === "name") return list.sort((a, b) => a.localeCompare(b));
  if (STATE.sortMode === "temp") return list.sort((a, b) => {
    const da = getCityData(a), db = getCityData(b);
    return (db?.temperature ?? 0) - (da?.temperature ?? 0);
  });
  return list;
}

// ─── DATA LOOKUP & CACHE ─────────────────────────────────────
const WEATHER_CACHE = {};

function getCityData(city) {
  const key = city.toLowerCase().trim();
  return WEATHER_CACHE[key] || null;
}

async function preloadCityData(cities) {
  const needsFetch = [...new Set(cities)].filter(c => !WEATHER_CACHE[c.toLowerCase().trim()]);
  if (!needsFetch.length) return;
  await Promise.allSettled(needsFetch.map(async city => {
    try {
      WEATHER_CACHE[city.toLowerCase().trim()] = await fetchWeather(city);
    } catch (e) { console.warn("Background fetch failed for", city); }
  }));
  renderAll(); // Re-render once data is loaded
}

// (RNG function removed, replaced by real API data)

// ─── BOOKMARK LIST RENDERER ──────────────────────────────────
function renderBookmarksList() {
  const list    = document.getElementById("bookmarksList");
  const empty   = document.getElementById("bookmarksEmpty");
  const countEl = document.getElementById("sidebarCount");
  const sorted  = getSortedBookmarks();

  countEl.textContent = sorted.length;

  if (!sorted.length) {
    list.innerHTML = "";
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";
  list.innerHTML = "";

  sorted.forEach((city, idx) => {
    const data       = getCityData(city);
    const isViewing  = STATE.lastData?.city?.toLowerCase() === city.toLowerCase();
    const isFeatured = idx === 0 && STATE.sortMode === "recent";
    const hourlyData = data?.hourly ? data.hourly.map(p => p.temp) : null;
    const { cls: condThemeClass, icon } = resolveCondition(data?.condition || "");
    const pillCls    = resolvePillClass(data?.condition || "");
    const stripe     = data ? stripeClass(data.temperature) : "stripe-mild";

    const tempDisplay  = data ? tempStr(data.temperature, STATE.useFahrenheit) : "—";
    const feelsDisplay = data ? tempStr(data.feelsLike, STATE.useFahrenheit) : "—";
    const hiDisplay    = data ? tempStr(data.high, STATE.useFahrenheit) : "—";
    const loDisplay    = data ? tempStr(data.low, STATE.useFahrenheit) : "—";

    const sparkId = `spark_${city.replace(/\s+/g, "_")}`;

    const card = document.createElement("div");
    card.className = ["bm-card", isFeatured ? "bm-featured" : "", isViewing ? "bm-viewing" : "", condThemeClass]
      .filter(Boolean).join(" ");

    if (isFeatured) {
      card.innerHTML = `
        <div class="bm-weather-layer"></div>
        <div class="bm-stripe ${stripe}"></div>
        ${isViewing ? '<span class="bm-viewing-badge">Viewing</span>' : ""}
        <div class="bm-feat-top" style="align-items:center; justify-content: space-between;">
          <div class="bm-feat-left" style="display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="bm-feat-city">${city}</span>
              <span class="cond-pill ${pillCls} bm-row-pill" style="margin:0;">${data?.condition || ""}</span>
            </div>
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span class="bm-feat-temp">${tempDisplay}</span>
              <span style="font-size:11px; color:var(--text-dim);">H:${hiDisplay} &middot; L:${loDisplay}</span>
            </div>
          </div>
          <div class="bm-feat-right" style="display:flex; align-items:center; gap:8px;">
            <button class="bm-remove" title="Remove">×</button>
            <span class="bm-feat-badge">Most recent</span>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="bm-weather-layer"></div>
        <div class="bm-stripe ${stripe}"></div>
        ${isViewing ? '<span class="bm-viewing-badge">Viewing</span>' : ""}
        <button class="bm-remove" title="Remove">×</button>
        <div class="bm-row-main">
          <span class="bm-row-icon">${icon}</span>
          <div class="bm-row-info">
            <span class="bm-row-city">${city}</span>
            <span class="cond-pill ${pillCls} bm-row-pill">${data?.condition || "Unknown"}</span>
          </div>
          <div class="bm-row-right">
            <span class="bm-row-temp">${tempDisplay}</span>
            <span class="bm-row-meta">${data?.humidity ?? "—"}% &middot; ${data?.windSpeed ?? "—"}m/s</span>
          </div>
        </div>
      `;
    }

    // Add particle effects inside card
    const weatherLayer = card.querySelector(".bm-weather-layer");
    if (condThemeClass === "condition-rainy") {
      spawnParticlesInNode(weatherLayer, "raindrop", 8);
    } else if (condThemeClass === "condition-stormy") {
      spawnParticlesInNode(weatherLayer, "raindrop", 12);
    } else if (condThemeClass === "condition-snowy") {
      spawnParticlesInNode(weatherLayer, "snowflake", 10);
    } else if (condThemeClass === "condition-foggy") {
      weatherLayer.innerHTML = '<div class="fog-strip fs1"></div><div class="fog-strip fs2"></div>';
    }

    card.onclick = (e) => {
      if (e.target.classList.contains("bm-remove")) {
        e.stopPropagation();
        toggleBookmark(city);
        return;
      }
      handleSearch(city);
    };

    list.appendChild(card);
  });
}

// ─── HISTORY CHIPS ───────────────────────────────────────────
function renderHistoryChips() {
  const section = document.getElementById("historySection");
  const chips   = document.getElementById("historyChips");
  if (!STATE.history.length) { section.style.display = "none"; return; }
  section.style.display = "block";
  chips.innerHTML = "";
  STATE.history.forEach(city => {
    const data = getCityData(city);
    const { icon } = resolveCondition(data?.condition || "");
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.innerHTML = `${icon} ${city}`;
    chip.onclick = () => handleSearch(city);
    chips.appendChild(chip);
  });
}

// ─── URL HELPERS ─────────────────────────────────────────────
function getCityFromURL() {
  return new URLSearchParams(window.location.search).get("city") || "";
}
function pushCityToURL(city) {
  const url = new URL(window.location.href);
  url.searchParams.set("city", city);
  window.history.pushState({ city }, "", url.toString());
}
function clearCityFromURL() {
  const url = new URL(window.location.href);
  url.searchParams.delete("city");
  window.history.replaceState({}, "", url.toString());
}

// ─── SEARCH HANDLER ──────────────────────────────────────────
async function handleSearch(city = cityInput.value.trim(), lat = null, lon = null, pushURL = true) {
  if (!city) { showError("Please enter a city name"); return; }
  cityInput.value = city;
  hideSuggestions();

  // Show inline skeleton inside weather panel
  showSkeleton();
  
  // Add loading state to both buttons
  const searchBtn = document.getElementById("searchBtn");
  const islandBtn = document.getElementById("islandSearchToggle");
  if (searchBtn) searchBtn.classList.add("loading");
  if (islandBtn) islandBtn.classList.add("loading");

  try {
    const weatherData = await fetchWeather(city, lat, lon);
    const resolvedName = weatherData.city;
    
    // Update input to the exact name returned by the service
    cityInput.value = resolvedName;
    
    const cacheKey = resolvedName.toLowerCase().trim();
    WEATHER_CACHE[cacheKey] = weatherData;
    STATE.lastData = weatherData;
    
    STATE.history = [resolvedName, ...STATE.history.filter(c => c.toLowerCase() !== resolvedName.toLowerCase())].slice(0, 5);
    saveHistory();
    renderHistoryChips();

    if (pushURL) pushCityToURL(resolvedName);
    renderAll();
  } catch (err) {
    console.error("Search failed:", err);
    clearCityFromURL();
    showError(`Failed to fetch weather for "${city}". ${err.message}`);
  } finally {
    // Remove loading state
    const searchBtn = document.getElementById("searchBtn");
    const islandBtn = document.getElementById("islandSearchToggle");
    if (searchBtn) searchBtn.classList.remove("loading");
    if (islandBtn) islandBtn.classList.remove("loading");
  }
}

// ─── AUTOCOMPLETE LOGIC ──────────────────────────────────────
let suggestionTimeout = null;
let selectedIndex = -1;

async function fetchCitySuggestions(query) {
  if (!query || query.length < 2) return [];
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=15&language=en&format=json`);
    const geoData = await geoResponse.json();
    const candidates = geoData.results || [];
    if (!candidates.length) return [];

    // Filter by relevance (populated places, valid IDs)
    const filteredCandidates = candidates.filter(res => {
      const isPopulated = res.population !== undefined && res.population > 0;
      const isGeoFeature = !res.admin1 && !res.admin2 && !isPopulated;
      return res.id && !isGeoFeature;
    }).slice(0, 10);

    if (filteredCandidates.length === 0) return [];

    // SECOND LAYER: Live Validation via our backend batch check
    const validationResp = await fetch('/api/validate-cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: filteredCandidates.map(c => ({ lat: c.latitude, lon: c.longitude }))
      })
    });

    if (validationResp.ok) {
      const { validations } = await validationResp.json();
      return filteredCandidates.filter((_, idx) => validations[idx]);
    }

    return filteredCandidates; // Fallback to all if validation fails
  } catch (err) {
    console.error("Suggestions processing failed:", err);
    return [];
  }
}

function renderSuggestions(results) {
  if (!results.length) {
    hideSuggestions();
    return;
  }
  suggestionsContainer.innerHTML = "";
  selectedIndex = -1;
  results.forEach((res, idx) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.dataset.index = idx;
    
    // Build a nice display string: "City, State, Country"
    const details = [res.admin1, res.country].filter(Boolean).join(", ");
    const cCode   = res.country_code ? `[${res.country_code.toUpperCase()}]` : "";
    const isMajor = res.population > 50000;
    
    div.innerHTML = `
      <div class="suggestion-row">
        <span class="suggestion-city">${res.name} ${isMajor ? ' <span class="verified-badge">✓</span>' : ''}</span>
        <span class="suggestion-code">${cCode}</span>
      </div>
      <span class="suggestion-details">${details}</span>
    `;
    
    div.onclick = (e) => {
      e.stopPropagation();
      selectSuggestion(res);
    };
    
    suggestionsContainer.appendChild(div);
  });
  suggestionsContainer.classList.add("visible");
}

function selectSuggestion(res) {
  // Use a cleaner name for display, e.g. "Mumbai, India"
  const fullName = [res.name, res.country].filter(Boolean).join(", ");
  handleSearch(fullName, res.latitude, res.longitude);
}

function hideSuggestions() {
  suggestionsContainer.classList.remove("visible");
  suggestionsContainer.innerHTML = "";
  selectedIndex = -1;
}

cityInput.addEventListener("keydown", e => { 
  const items = suggestionsContainer.querySelectorAll(".suggestion-item");
  
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
    updateSelection(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    updateSelection(items);
  } else if (e.key === "Enter" && selectedIndex > -1) {
    e.preventDefault();
    items[selectedIndex].click();
  } else if (e.key === "Enter") {
    handleSearch();
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

function updateSelection(items) {
  items.forEach((item, idx) => {
    item.classList.toggle("selected", idx === selectedIndex);
    if (idx === selectedIndex) item.scrollIntoView({ block: "nearest" });
  });
}

cityInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  clearTimeout(suggestionTimeout);
  
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  
  suggestionTimeout = setTimeout(async () => {
    const results = await fetchCitySuggestions(query);
    renderSuggestions(results);
  }, 300);
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
    hideSuggestions();
  }
});

unitToggle.addEventListener("change", () => {
  STATE.useFahrenheit = unitToggle.checked;
  renderAll();
});

window.addEventListener("popstate", e => {
  const city = e.state?.city || getCityFromURL();
  if (city) handleSearch(city, false);
  else { handleSearch("London", false); }
});

// ─── EXPOSE ──────────────────────────────────────────────────
window.__toggleBookmark = toggleBookmark;
window.updateWeatherScene = updateWeatherScene;

// ─── INIT ────────────────────────────────────────────────────
loadState();

// Initialize theme based on local time
const hour = new Date().getHours();
const isDayStart = hour >= 6 && hour < 18;
updateWeatherScene(isDayStart, "clear");

// Initialize Vanta Background
export let backgroundManager = null;
try {
  backgroundManager = new VantaManager("vanta-canvas");
  backgroundManager.init(isDayStart);
} catch (e) {
  console.error("Vanta initialization failed:", e);
}

// Ensure empty state is hidden before first render
const _emptyEl = document.getElementById("dashEmptyMain");
if (_emptyEl) { _emptyEl.classList.add("hidden"); _emptyEl.style.display = "none"; }

// Handle Search Button Click
if (searchBtn) {
  searchBtn.addEventListener("click", () => handleSearch());
}

const cityFromURL = getCityFromURL();
if (cityFromURL) {
  handleSearch(cityFromURL, false);
} else {
  handleSearch("London", false);
}

// Preload bookmarks and history in background
preloadCityData([...STATE.bookmarks, ...STATE.history]);

// ─── STARS ───────────────────────────────────────────────────
(function generateStars() {
  const layer = document.getElementById("starsLayer");
  if (!layer) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.className = "star";
    const size = Math.random() * 2 + 0.5;
    star.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*70}%;left:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*5}s;--bright:${0.4+Math.random()*0.6};`;
    layer.appendChild(star);
  }
})();



// ─── PREDICTOR MODAL ─────────────────────────────────────────
const openPredictorBtn = document.getElementById("openPredictorBtn");
const predictorModalOverlay = document.getElementById("predictorModalOverlay");
const predictorModalPanel = document.getElementById("predictorModalPanel");
const predictorCloseBtn = document.getElementById("predictorCloseBtn");

const pCityInput = document.getElementById("predictCity");
const pDateInput = document.getElementById("predictDate");
const runPredictBtn = document.getElementById("runPredictionBtn");
const pLoader = document.getElementById("predictorLoading");
const pResults = document.getElementById("predictorResults");

function openPredictor() {
  if (!predictorModalOverlay) return;
  predictorModalOverlay.classList.add("open");
  predictorModalPanel.classList.add("open");
  document.body.style.overflow = "hidden";
  
  if (STATE.lastData?.city) {
    pCityInput.value = STATE.lastData.city;
  }
  
  // Set default date to tomorrow
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  pDateInput.value = tmrw.toISOString().split("T")[0];
  
  pResults.style.display = "none";
}

function closePredictor() {
  if (!predictorModalOverlay) return;
  predictorModalOverlay.classList.remove("open");
  predictorModalPanel.classList.remove("open");
  document.body.style.overflow = "";
}

openPredictorBtn?.addEventListener("click", openPredictor);
predictorCloseBtn?.addEventListener("click", closePredictor);
predictorModalOverlay?.addEventListener("click", closePredictor);
predictorModalPanel?.addEventListener("click", e => e.stopPropagation());

let predictorChart = null;

runPredictBtn?.addEventListener("click", async () => {
  const city = pCityInput.value.trim();
  const dateStr = pDateInput.value;
  if (!city || !dateStr) return;
  
  const [year, month, day] = dateStr.split("-");
  
  pLoader.style.display = "block";
  pResults.style.display = "none";
  
  try {
    const data = await predictWeather(city, month, day);
    pLoader.style.display = "none";
    pResults.style.display = "block";
    
    const uiMax = tempStr(data.predictedMax, STATE.useFahrenheit);
    const uiMin = tempStr(data.predictedMin, STATE.useFahrenheit);
    
    const trendVal = STATE.useFahrenheit ? (data.trendSlope * 1.8) : data.trendSlope;
    const trendLabel = data.trendSlope > 0 ? "Warming" : "Cooling";
    const trendSign = data.trendSlope >= 0 ? "+" : "";

    // Render HTML
    pResults.innerHTML = `
      <div class="pred-highlight">
        <div class="pred-stat-block">
          <span class="pred-stat-label">Predicted High</span>
          <span class="pred-stat-val">${uiMax}</span>
        </div>
        <div class="pred-stat-block">
          <span class="pred-stat-label">Predicted Low</span>
          <span class="pred-stat-val">${uiMin}</span>
        </div>
        <div class="pred-stat-block">
          <span class="pred-stat-label">Rain Chance</span>
          <span class="pred-stat-val">${data.precipProb}%</span>
        </div>
      </div>
      <p style="font-size:12px;color:#a5adc6;text-align:center;margin-bottom:10px;">
        Analyzed ${data.yearsAnalyzed} years of historical archive data. Overall trend: ${trendLabel} (${trendSign}${trendVal.toFixed(3)}°/yr)
      </p>
      <div class="pred-chart-container">
        <canvas id="predictorChartCanvas"></canvas>
      </div>
    `;
    
    // Render Chart.js
    const ctx = document.getElementById("predictorChartCanvas");
    if (predictorChart) predictorChart.destroy();
    
    const labels = data.historicalData.map(d => d.year);
    const highPoints = data.historicalData.map(d => STATE.useFahrenheit ? +(d.max * 9/5 + 32).toFixed(1) : d.max);
    
    predictorChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Historical Highs (' + (STATE.useFahrenheit ? "°F" : "°C") + ")",
          data: highPoints,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#fde68a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#7c84c0', font: {size: 10} }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#7c84c0', font: {size: 10} }
          }
        }
      }
    });
    
  } catch (err) {
    pLoader.style.display = "none";
    pResults.style.display = "block";
    pResults.innerHTML = `<p style="color:#f87171; text-align:center;">Failed to generate prediction. ${err.message}</p>`;
  }
});

// ─── 3D GLOBE INITIALIZATION ─────────────────────────────────
export let planetaryGlobe = null;

document.getElementById("planetViewTrigger")?.addEventListener("click", () => {
  document.getElementById("planetaryView").classList.add("active");
  
  if (!planetaryGlobe) {
    planetaryGlobe = new PlanetaryGlobe("globeContainer", STATE);
    planetaryGlobe.init();
  }
  
  // Point to the current searched city if available
  if (STATE.lastData && STATE.lastData.lat && STATE.lastData.lon) {
    planetaryGlobe.pointTo(STATE.lastData.lat, STATE.lastData.lon);
  }
});

document.getElementById("closePlanetBtn")?.addEventListener("click", () => {
  document.getElementById("planetaryView").classList.remove("active");
});

document.body.addEventListener("themeChanged", () => {
  if (planetaryGlobe) {
    planetaryGlobe.updateTheme();
  }
  if (backgroundManager) {
    const isDay = document.body.classList.contains("day-theme");
    backgroundManager.updateTheme(isDay);
  }
});


// ─── DYNAMIC ISLAND (MOBILE) ──────────────────────────────────
const island      = document.getElementById("dynamicIsland");
const islandInput  = document.getElementById("islandInput");
const islandToggle = document.getElementById("islandSearchToggle");
const islandPredict = document.getElementById("islandPredictBtn");
const islandSugg   = document.getElementById("islandSuggestions");

function expandIsland() {
  island.classList.add("expanded");
  islandInput.focus();
}

function contractIsland() {
  island.classList.remove("expanded");
  islandInput.value = "";
  islandSugg.innerHTML = "";
}

islandToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (island.classList.contains("expanded")) {
    if (islandInput.value.trim()) handleSearch(islandInput.value.trim());
    contractIsland();
  } else {
    expandIsland();
  }
});

islandPredict?.addEventListener("click", (e) => {
  e.stopPropagation();
  openPredictor();
});

islandInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch(islandInput.value.trim());
    contractIsland();
  }
  if (e.key === "Escape") contractIsland();
});

islandInput?.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) { islandSugg.innerHTML = ""; return; }
  
  const results = await fetchCitySuggestions(query);
  islandSugg.innerHTML = "";
  results.slice(0, 5).forEach(res => {
    const div = document.createElement("div");
    div.className = "island-suggestion-item";
    div.innerHTML = `<span>${res.name}</span> <span class="text-muted" style="font-size:10px;">${res.country_code?.toUpperCase() || ""}</span>`;
    div.onclick = (e) => {
      e.stopPropagation();
      const fullName = [res.name, res.country].filter(Boolean).join(", ");
      handleSearch(fullName, res.latitude, res.longitude);
      contractIsland();
    };
    islandSugg.appendChild(div);
  });
});

// Close island when clicking outside
document.addEventListener("click", (e) => {
  if (island && !island.contains(e.target)) {
    contractIsland();
  }
});
