def generate_insights(weather_data, category="General"):
    """
    Advanced Multi-Dimensional Insights Engine.
    Correlates weather, local time, and forecast trends to ensure high-density, unique results.
    """
    temp = weather_data.get('temperature', 0)
    feels_like = weather_data.get('feelsLike', 0)
    humidity = weather_data.get('humidity', 0)
    condition = weather_data.get('condition', 'Clear').lower()
    wind_speed = weather_data.get('windSpeed', 0)
    uv_index = weather_data.get('uvIndex', 0)
    aqi = weather_data.get('aqi')
    visibility = weather_data.get('visibility', 10)
    pressure = weather_data.get('pressure', 1013)
    sunrise = weather_data.get('sunrise', '')
    sunset = weather_data.get('sunset', '')
    low_temp = weather_data.get('low', 0)
    is_day = weather_data.get('isDay', True)
    
    # Time Analysis
    current_time_str = weather_data.get('currentTime', '')
    hour = 12
    if 'T' in current_time_str:
        try:
            hour = int(current_time_str.split('T')[1].split(':')[0])
        except:
            pass
    
    # Weather Flags
    is_rain = any(w in condition for w in ['rain', 'drizzle', 'shower', 'storm', 'thunderstorm'])
    is_snow = any(w in condition for w in ['snow', 'freezing', 'ice', 'hail'])
    is_bad_weather = is_rain or is_snow
    is_hot = temp > 28
    is_warm = 20 <= temp <= 28
    is_mild = 12 <= temp < 20
    is_cold = temp < 12
    is_sunny = any(w in condition for w in ['clear', 'sunny'])
    is_windy = wind_speed > 18
    is_dry = humidity < 35
    is_humid = humidity > 70
    
    insights = []

    # --- CATEGORY: TRAVELER ---
    if category == "Traveler":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snowy conditions; major transit delays expected."})
            insights.append({"icon": "🧤", "text": "Pack heavy winter layers and thermal wear."})
        elif is_rain:
            insights.append({"icon": "🧥", "text": "Carry waterproof gear; umbrellas may be ineffective in wind."})
            
        if visibility < 2:
            insights.append({"icon": "🌫️", "text": "Low visibility; use caution if navigating unfamiliar streets."})
        elif visibility > 12 and is_sunny:
            insights.append({"icon": "🔭", "text": "Crystal clear air; great for visiting high-altitude viewpoints."})

        if 5 <= hour <= 10:
            insights.append({"icon": "☕", "text": "Early morning; usually the best time for crowd-free sightseeing."})
        elif 17 <= hour <= 19:
            insights.append({"icon": "📸", "text": f"Golden hour approaching; perfect for photography at {sunset}."})
            
        if is_windy:
            insights.append({"icon": "🎒", "text": "Moderate winds; secure any loose items or light luggage."})
        
        if len(insights) < 3 and not is_bad_weather:
            insights.append({"icon": "🚆", "text": "Stable weather; transit systems should run on schedule."})
            insights.append({"icon": "🏙️", "text": "Favorable conditions for exploring both indoor and outdoor landmarks."})

    # --- CATEGORY: FARMER ---
    elif category == "Farmer":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snow cover; protect sensitive livestock and overwinter crops."})
            insights.append({"icon": "🚜", "text": "Halt heavy machinery to prevent soil compaction."})
        elif is_rain:
            insights.append({"icon": "💧", "text": "Natural irrigation today; pause all scheduled watering."})
        elif low_temp < 2:
            insights.append({"icon": "🧊", "text": "Frost risk; cover young seedlings or move them indoors."})
            
        if is_dry and is_windy:
            insights.append({"icon": "🌾", "text": "High evapotranspiration risk; monitor soil moisture levels closely."})
        elif wind_speed < 10 and not is_bad_weather:
            insights.append({"icon": "🚜", "text": "Low wind; ideal window for spraying or fertilizing."})
            
        if is_humid and temp > 20:
            insights.append({"icon": "🦠", "text": "Warm and humid; monitor crops for signs of fungal growth."})
            
        if 5 <= hour <= 9:
            insights.append({"icon": "🌱", "text": "High morning dew; check field conditions before operations."})
        
        if len(insights) < 3:
            insights.append({"icon": "🛠️", "text": "Stable conditions; good day for tool and equipment maintenance."})
            insights.append({"icon": "📝", "text": "Ideal time for administrative tasks and seasonal planning."})

    # --- CATEGORY: STUDENT ---
    elif category == "Student":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snowy day; check campus portals for closure or delay alerts."})
        elif is_rain:
            insights.append({"icon": "☔", "text": "Rainy day; allow extra time for commuting to campus."})
            
        if is_humid:
            insights.append({"icon": "🎒", "text": "High humidity; use protective sleeves for laptops and tablets."})
            
        if 8 <= hour <= 12 and is_sunny:
            insights.append({"icon": "📚", "text": "Optimal natural light for studying near windows."})
        elif hour >= 21:
            insights.append({"icon": "🌙", "text": "Quiet late-night hours; great for deep focus work."})
            
        if pressure > 1020:
             insights.append({"icon": "🧠", "text": "High pressure; often associated with improved mental focus."})
        elif pressure < 1005:
             insights.append({"icon": "☕", "text": "Low pressure; prioritize breaks to maintain steady energy levels."})
             
        if len(insights) < 3:
            insights.append({"icon": "🎒", "text": "Consistent conditions; good day for walking or cycling to campus."})
            insights.append({"icon": "☕", "text": "Perfect weather for an extended library study session."})

    # --- CATEGORY: PICNIC ---
    elif category == "Picnic":
        if is_bad_weather:
            insights.append({"icon": "🏠", "text": "Indoor picnic recommended; great day for a cozy home lunch."})
        else:
            if uv_index > 6 and 11 <= hour <= 15:
                insights.append({"icon": "🌳", "text": "Peak UV; prioritize shaded spots under heavy canopy."})
            elif 17 <= hour <= 20:
                insights.append({"icon": "🧺", "text": "Cooling evening air; perfect for a sunset outing."})
                
            if is_windy:
                insights.append({"icon": "🪁", "text": "Windy day; great for kites but secure your food containers."})
            
            if is_dry:
                insights.append({"icon": "🦟", "text": "Low humidity; mosquito activity should be minimal today."})
            elif is_humid:
                insights.append({"icon": "🦟", "text": "Humid air; expect increased insect activity near water."})
                
            if len(insights) < 3:
                insights.append({"icon": "🧺", "text": "Excellent weather for an outdoor picnic setup."})
                insights.append({"icon": "🍎", "text": "Stable temps; favorable for keeping food fresh outdoors."})

    # --- CATEGORY: SPORTS ---
    elif category == "Sports":
        if aqi and aqi > 100:
            insights.append({"icon": "⚠️", "text": "Poor air quality; move your training session indoors."})
        elif is_rain:
            insights.append({"icon": "🏀", "text": "Slippery surfaces; best to move activities to a gym."})
            
        if is_hot and 11 <= hour <= 16:
            insights.append({"icon": "🥤", "text": "Midday heat; prioritize electrolytes and frequent breaks."})
        elif 5 <= hour <= 8:
            insights.append({"icon": "🏃", "text": "Early morning cool; the optimal time for high-intensity cardio."})
            
        if is_windy:
            insights.append({"icon": "🌬️", "text": "Strong winds; focus on lower-impact activities or indoor play."})
        elif is_humid:
            insights.append({"icon": "🎾", "text": "High humidity; surfaces may feel tacky. Good for ball control."})
            
        if len(insights) < 3:
            insights.append({"icon": "⚡", "text": "Peak performance weather! Excellent for all outdoor sports."})
            insights.append({"icon": "🏃", "text": "Stable temperatures; ideal for long-distance training."})

    # --- CATEGORY: GENERAL ---
    else: 
        if is_snow:
            insights.append({"icon": "❄️", "text": "Bundle up! Heavy winter layers are essential today."})
        elif is_rain:
            insights.append({"icon": "🌂", "text": "Don't forget your umbrella and waterproof footwear."})
        elif is_hot:
            insights.append({"icon": "☀️", "text": "Stay hydrated and avoid prolonged sun exposure."})
            
        if 22 <= hour or hour <= 4:
            insights.append({"icon": "💤", "text": "Cool night air; favorable for deep and restful sleep."})
        elif 6 <= hour <= 9:
            insights.append({"icon": "🌅", "text": "Fresh morning air; great for early chores or a quick walk."})
            
        if is_dry and wind_speed > 10 and not is_bad_weather:
            insights.append({"icon": "👕", "text": "Dry and breezy; perfect conditions for drying laundry outside."})
        elif is_humid:
            insights.append({"icon": "🏠", "text": "High humidity; keep windows closed to maintain indoor comfort."})
            
        if uv_index > 5 and is_day:
            insights.append({"icon": "🕶️", "text": "Moderate UV levels; sunglasses are recommended outdoors."})
            
        if len(insights) < 3:
            if is_sunny:
                insights.append({"icon": "✨", "text": "Excellent visibility and natural light across the city."})
            if 40 <= humidity <= 60:
                insights.append({"icon": "🍃", "text": "Optimal humidity levels for indoor and outdoor comfort."})

    # --- HUMIDITY / WIND CHILL (General Only) ---
    if category == "General":
        if feels_like > temp + 3:
            insights.append({"icon": "🥵", "text": f"Feels significantly hotter ({feels_like}°C) due to humidity."})
        elif feels_like < temp - 3:
            insights.append({"icon": "🥶", "text": f"Feels significantly colder ({feels_like}°C) due to wind chill."})

    # Final Catch-All
    if not insights:
        insights.append({"icon": "✅", "text": "Conditions are currently stable for most outdoor activities."})

    # --- SUMMARY LOGIC ---
    if is_snow:
        summary = f"Snowy conditions today. Dress warmly and be careful on the roads."
    elif is_rain:
        summary = f"Rainy weather today. Suitable for indoor plans."
    elif is_hot:
        summary = f"Hot weather today. Suitable for outdoor plans but stay cool."
    elif is_cold:
        summary = f"Cold weather today. Dress in warm layers if heading out."
    else:
        if 5 <= hour <= 11: summary = "Fresh morning weather. Great for starting your day outdoors."
        elif 12 <= hour <= 16: summary = "Warm afternoon conditions. Stay hydrated while out."
        elif 17 <= hour <= 21: summary = "Pleasant evening weather. Perfect for a walk or dining out."
        else: summary = "Calm night conditions. Great for a restful sleep."

    return {
        "summary": summary,
        "confidence": "High" if len(insights) >= 3 else "Medium",
        "category": category,
        "insights": insights[:5] 
    }
