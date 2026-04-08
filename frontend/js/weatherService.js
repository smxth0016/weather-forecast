/**
 * weatherService.js — Communicates with the local Node.js backend
 */

export async function fetchWeather(city, lat = null, lon = null) {
  try {
    let url = `/api/weather?city=${encodeURIComponent(city)}`;
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (err) {
    console.warn("⚠️ Weather fetch failed. Error:", err.message);
    throw err;
  }
}
