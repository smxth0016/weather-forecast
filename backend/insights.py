def generate_insights(weather_data, category="General"):
    """
    Advanced Multi-Dimensional Insights Engine.
    Uses semantic icon keys for professional SVG rendering in the frontend.
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
    is_cold = temp < 12
    is_sunny = any(w in condition for w in ['clear', 'sunny'])
    is_windy = wind_speed > 18
    is_dry = humidity < 35
    is_humid = humidity > 70
    
    insights = []

    # --- CATEGORY: TRAVELER ---
    if category == "Traveler":
        if is_snow:
            insights.append({"icon": "SNOW", "text": "Snowy conditions; major transit delays expected."})
            insights.append({"icon": "APPAREL", "text": "Pack heavy winter layers and thermal wear."})
        elif is_rain:
            insights.append({"icon": "APPAREL", "text": "Carry waterproof gear; umbrellas may be ineffective in wind."})
            
        if visibility < 2:
            insights.append({"icon": "VISIBILITY", "text": "Low visibility; use extra caution if navigating streets."})
        elif visibility > 12 and is_sunny:
            insights.append({"icon": "VISIBILITY", "text": "Crystal clear air; great for visiting high-altitude viewpoints."})

        if 5 <= hour <= 10:
            insights.append({"icon": "COFFEE", "text": "Early morning; usually the best time for crowd-free sightseeing."})
        elif 17 <= hour <= 19:
            insights.append({"icon": "CAMERA", "text": f"Golden hour approaching; perfect for photography at {sunset}."})
            
        if is_windy:
            insights.append({"icon": "WIND", "text": "Moderate winds; secure any loose items or light luggage."})
        
        if len(insights) < 3 and not is_bad_weather:
            insights.append({"icon": "TRANSIT", "text": "Stable weather; transit systems should run on schedule."})
            insights.append({"icon": "MAP", "text": "Favorable conditions for exploring both indoor and outdoor landmarks."})

    # --- CATEGORY: FARMER ---
    elif category == "Farmer":
        if is_snow:
            insights.append({"icon": "SNOW", "text": "Snow cover; protect sensitive livestock and crops."})
            insights.append({"icon": "TRACTOR", "text": "Halt heavy machinery to prevent soil compaction."})
        elif is_rain:
            insights.append({"icon": "DROP", "text": "Natural irrigation today; pause all scheduled watering."})
        elif low_temp < 2:
            insights.append({"icon": "THERMOMETER", "text": "Frost risk; cover young seedlings or move them indoors."})
            
        if is_dry and is_windy:
            insights.append({"icon": "WIND", "text": "High evapotranspiration risk; monitor soil moisture closely."})
        elif wind_speed < 10 and not is_bad_weather:
            insights.append({"icon": "TRACTOR", "text": "Low wind; ideal window for spraying or fertilizing."})
            
        if is_humid and temp > 20:
            insights.append({"icon": "THERMOMETER", "text": "Warm and humid; monitor crops for signs of fungal growth."})
            
        if 5 <= hour <= 9:
            insights.append({"icon": "PLANT", "text": "High morning dew; check field conditions before operations."})
        
        if len(insights) < 3:
            insights.append({"icon": "TOOLS", "text": "Stable conditions; good day for tool and equipment maintenance."})
            insights.append({"icon": "EDIT", "text": "Ideal time for administrative tasks and seasonal planning."})

    # --- CATEGORY: STUDENT ---
    elif category == "Student":
        if is_snow:
            insights.append({"icon": "SNOW", "text": "Snowy day; check campus portals for closure alerts."})
        elif is_rain:
            insights.append({"icon": "RAIN", "text": "Rainy day; allow extra time for commuting to campus."})
            
        if is_humid:
            insights.append({"icon": "BACKPACK", "text": "High humidity; use protective sleeves for laptops."})
            
        if 8 <= hour <= 12 and is_sunny:
            insights.append({"icon": "BOOK", "text": "Optimal natural light for studying near windows."})
        elif hour >= 21:
            insights.append({"icon": "MOON", "text": "Quiet late-night hours; great for deep focus work."})
            
        if pressure > 1020:
             insights.append({"icon": "BRAIN", "text": "High pressure; often associated with improved mental focus."})
        elif pressure < 1005:
             insights.append({"icon": "COFFEE", "text": "Low pressure; prioritize breaks to maintain steady energy."})
             
        if len(insights) < 3:
            insights.append({"icon": "BACKPACK", "text": "Consistent conditions; good day for walking to campus."})
            insights.append({"icon": "BOOK", "text": "Perfect weather for an extended library study session."})

    # --- CATEGORY: PICNIC ---
    elif category == "Picnic":
        if is_bad_weather:
            insights.append({"icon": "HOME", "text": "Indoor picnic recommended; great day for a cozy home lunch."})
        else:
            if uv_index > 6 and 11 <= hour <= 15:
                insights.append({"icon": "SUN", "text": "Peak UV; prioritize shaded spots under heavy canopy."})
            elif 17 <= hour <= 20:
                insights.append({"icon": "SUNSET", "text": "Cooling evening air; perfect for a sunset outing."})
                
            if is_windy:
                insights.append({"icon": "WIND", "text": "Windy day; secure your food containers and light items."})
            
            if is_dry:
                insights.append({"icon": "WIND", "text": "Low humidity; mosquito activity should be minimal today."})
                
            if len(insights) < 3:
                insights.append({"icon": "PICNIC", "text": "Excellent weather for an outdoor picnic setup."})
                insights.append({"icon": "THERMOMETER", "text": "Stable temps; favorable for keeping food fresh outdoors."})

    # --- CATEGORY: SPORTS ---
    elif category == "Sports":
        if aqi and aqi > 100:
            insights.append({"icon": "ALERT", "text": "Poor air quality; move your training session indoors."})
        elif is_rain:
            insights.append({"icon": "RAIN", "text": "Slippery surfaces; best to move activities to a gym."})
            
        if is_hot and 11 <= hour <= 16:
            insights.append({"icon": "DRINK", "text": "Midday heat; prioritize electrolytes and frequent breaks."})
        elif 5 <= hour <= 8:
            insights.append({"icon": "RUN", "text": "Early morning cool; the optimal time for high-intensity cardio."})
            
        if is_windy:
            insights.append({"icon": "WIND", "text": "Strong winds; focus on lower-impact activities or indoor play."})
        elif is_humid:
            insights.append({"icon": "SPORTS", "text": "High humidity; surfaces may feel tacky. Good for ball control."})
            
        if len(insights) < 3:
            insights.append({"icon": "SPORTS", "text": "Peak performance weather! Excellent for all outdoor sports."})
            insights.append({"icon": "RUN", "text": "Stable temperatures; ideal for long-distance training."})

    # --- CATEGORY: GENERAL ---
    else: 
        if is_snow:
            insights.append({"icon": "SNOW", "text": "Bundle up! Heavy winter layers are essential today."})
        elif is_rain:
            insights.append({"icon": "RAIN", "text": "Don't forget your umbrella and waterproof footwear."})
        elif is_hot:
            insights.append({"icon": "SUN", "text": "Stay hydrated and avoid prolonged sun exposure."})
            
        if 22 <= hour or hour <= 4:
            insights.append({"icon": "SLEEP", "text": "Cool night air; favorable for deep and restful sleep."})
        elif 6 <= hour <= 9:
            insights.append({"icon": "SUNSET", "text": "Fresh morning air; great for early chores or a quick walk."})
            
        if is_dry and wind_speed > 10 and not is_bad_weather:
            insights.append({"icon": "APPAREL", "text": "Dry and breezy; perfect conditions for drying laundry."})
        elif is_humid:
            insights.append({"icon": "HOME", "text": "High humidity; keep windows closed for indoor comfort."})
            
        if uv_index > 5 and is_day:
            insights.append({"icon": "VISIBILITY", "text": "Moderate UV levels; sunglasses are recommended outdoors."})
            
        if len(insights) < 3:
            if is_sunny:
                insights.append({"icon": "SPARKLES", "text": "Excellent visibility and natural light across the city."})
            if 40 <= humidity <= 60:
                insights.append({"icon": "DROP", "text": "Optimal humidity levels for indoor and outdoor comfort."})

    # --- HUMIDITY / WIND CHILL (General Only) ---
    if category == "General":
        if feels_like > temp + 3:
            insights.append({"icon": "HOT", "text": f"Feels significantly hotter ({feels_like}°C) due to humidity."})
        elif feels_like < temp - 3:
            insights.append({"icon": "COLD", "text": f"Feels significantly colder ({feels_like}°C) due to wind chill."})

    # Final Catch-All
    if not insights:
        insights.append({"icon": "SHIELD", "text": "Conditions are currently stable for most outdoor activities."})

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
