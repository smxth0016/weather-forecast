// ══════════════════════════════════════════════════════════════
//  predictorService.js  —  Communicates with the local backend
// ══════════════════════════════════════════════════════════════

export async function predictWeather(city, month, day) {
    try {
        // Call our local prediction API instead of archive-api directly
        const response = await fetch(`/api/predict?city=${encodeURIComponent(city)}&month=${month}&day=${day}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        return await response.json();
        
    } catch (e) {
        console.error("Predictor fetch failed:", e.message);
        throw e;
    }
}
