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
    is_calm = wind_speed < 8
    is_dry = humidity < 35
    is_humid = humidity > 70
    is_muggy = is_humid and temp > 24
    
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
        elif visibility > 15:
            insights.append({"icon": "VISIBILITY", "text": "Exceptional clarity; perfect for high-altitude landmarks."})
        elif visibility > 10 and is_sunny:
            insights.append({"icon": "VISIBILITY", "text": "Crystal clear air; great for visiting viewpoints."})

        if 5 <= hour <= 10:
            insights.append({"icon": "COFFEE", "text": "Early morning; usually the best time for crowd-free sightseeing."})
        elif 12 <= hour <= 15 and is_hot:
            insights.append({"icon": "HOME", "text": "Midday heat peak; consider visiting indoor museums or galleries."})
        elif 16 <= hour <= 19 and is_day:
            insights.append({"icon": "CAMERA", "text": f"Golden hour approaching; perfect for photography at {sunset}."})
        elif 5 <= hour <= 7 and is_day:
            insights.append({"icon": "CAMERA", "text": f"Sunrise approaching at {sunrise}; ideal for cityscape captures."})
        elif hour >= 21 or hour <= 4:
            insights.append({"icon": "TRANSIT", "text": "Night hours; plan for pre-booked transport as public options may be sparse."})
            
        if is_windy and is_day:
            insights.append({"icon": "WIND", "text": "Daytime breezes; secure light hats or maps while exploring."})
        elif is_calm:
            insights.append({"icon": "WIND", "text": "Calm conditions; ideal for scenic boat tours or ferry crossings."})

    # --- CATEGORY: FARMER ---
    elif category == "Farmer":
        if is_snow:
            insights.append({"icon": "SNOW", "text": "Snow cover; protect sensitive livestock and crops."})
        elif is_rain:
            insights.append({"icon": "DROP", "text": "Natural irrigation today; pause all scheduled watering."})
            
        if 5 <= hour <= 9:
            insights.append({"icon": "PLANT", "text": "High morning dew; check field conditions before operations."})
        elif 11 <= hour <= 16 and is_hot:
            insights.append({"icon": "SUN", "text": "Peak solar intensity; prioritize hydration and take shaded breaks."})
        elif 18 <= hour <= 21:
            insights.append({"icon": "HOME", "text": "Dusk approaching; ensure all livestock and equipment are secured."})
            
        if is_dry and is_windy and is_day:
            insights.append({"icon": "WIND", "text": "High daytime evapotranspiration; monitor soil moisture closely."})
            
        if pressure < 1000:
            insights.append({"icon": "PRESSURE", "text": "Falling barometric pressure; approaching weather shifts likely."})
        elif pressure > 1025:
            insights.append({"icon": "PRESSURE", "text": "High pressure stability; expect consistently calm field conditions."})

    # --- CATEGORY: STUDENT ---
    elif category == "Student":
        if 8 <= hour <= 12 and is_sunny:
            insights.append({"icon": "BOOK", "text": "Optimal natural light for studying near library windows."})
        elif 12 <= hour <= 14:
            insights.append({"icon": "COFFEE", "text": "Lunchtime peak; campus dining areas will be at maximum capacity."})
        elif 17 <= hour <= 20:
            insights.append({"icon": "HOME", "text": "Evening transition; check your commute status before leaving campus."})
        elif 21 <= hour or hour <= 3:
            insights.append({"icon": "MOON", "text": "Quiet late-night hours; ideal for deep focus and heavy coding."})
            
        if aqi and aqi < 50 and 7 <= hour <= 18:
            insights.append({"icon": "SPARKLES", "text": "Fresh air today; consider an outdoor study session on the quad."})

    # --- CATEGORY: PICNIC ---
    elif category == "Picnic":
        if is_bad_weather:
            insights.append({"icon": "HOME", "text": "Indoor picnic recommended; great day for a cozy home lunch."})
        else:
            if uv_index > 6 and 11 <= hour <= 15:
                insights.append({"icon": "SUN", "text": "Peak UV window; prioritize shaded spots under heavy canopy."})
            elif 16 <= hour <= 19:
                insights.append({"icon": "SUNSET", "text": f"Approaching sunset ({sunset}); perfect lighting for an outdoor dinner."})
            elif 6 <= hour <= 9:
                insights.append({"icon": "SUN", "text": f"Morning dew drying fast; great for an early park breakfast."})
                
            if is_windy and is_day:
                insights.append({"icon": "WIND", "text": "Daytime winds; secure your food containers and light items."})

    # --- CATEGORY: SPORTS ---
    elif category == "Sports":
        if is_hot and 11 <= hour <= 16:
            insights.append({"icon": "DRINK", "text": "Midday heat peak; prioritize electrolytes and double your water intake."})
        elif 5 <= hour <= 8:
            insights.append({"icon": "RUN", "text": "Morning cool-down; the optimal window for high-intensity cardio."})
        elif 16 <= hour <= 18 and is_sunny:
            insights.append({"icon": "SUN", "text": "Late afternoon sun glare; polarized eyewear is essential for play."})
        elif hour >= 20 or hour <= 4:
            insights.append({"icon": "VISIBILITY", "text": "Night session? Ensure you are using well-lit tracks or gym facilities."})

    # --- CATEGORY: GENERAL ---
    else: 
        if 22 <= hour or hour <= 4:
            insights.append({"icon": "SLEEP", "text": "Quiet night hours; favorable conditions for restful sleep."})
        elif 6 <= hour <= 10:
            insights.append({"icon": "SUNSET", "text": "Fresh morning air; ideal for outdoor errands or a quick walk."})
        elif 12 <= hour <= 16 and is_sunny:
            insights.append({"icon": "DRINK", "text": "Sunny afternoon; remember to stay hydrated during outdoor tasks."})
            
        if is_dry and wind_speed > 10 and 8 <= hour <= 17:
            insights.append({"icon": "APPAREL", "text": "Dry and breezy; perfect daytime conditions for drying laundry."})

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
