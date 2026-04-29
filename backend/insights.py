def generate_insights(weather_data, category="General"):
    """
    Generates smart, hyper-specific insights based on weather data and selected category.
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
    
    insights = []
    
    is_rain = any(w in condition for w in ['rain', 'drizzle', 'shower', 'storm', 'thunderstorm'])
    is_snow = any(w in condition for w in ['snow', 'freezing', 'ice', 'hail'])
    is_bad_weather = is_rain or is_snow
    is_hot = temp > 28
    is_cold = temp < 10
    is_sunny = any(w in condition for w in ['clear', 'sunny'])
    
    # Base humidity/wind-chill insight (only for General as per user request)
    humidity_insight = None
    if feels_like > temp + 3:
        humidity_insight = {"icon": "🥵", "text": f"Feels significantly hotter ({feels_like}°C) due to humidity."}
    elif feels_like < temp - 3:
        humidity_insight = {"icon": "🥶", "text": f"Feels significantly colder ({feels_like}°C) due to wind chill."}

    if category == "Traveler":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snowy conditions; expect major transit delays."})
            insights.append({"icon": "🧥", "text": "Dress in heavy winter layers."})
        elif is_rain:
            insights.append({"icon": "🧥", "text": "Carry an umbrella and waterproof gear."})
        
        if visibility < 2:
            insights.append({"icon": "🌫️", "text": "Low visibility; use extra caution when driving or navigating."})
        
        if temp < -5:
            insights.append({"icon": "🔋", "text": "Extreme cold; keep electronics in inner pockets to save battery."})
            
        if not is_bad_weather:
            if is_sunny:
                insights.append({"icon": "📸", "text": f"Clear horizon; great conditions for sunset photos at {sunset}."})
            insights.append({"icon": "🚆", "text": "Transit systems should be running on their regular schedules."})
        else:
            insights.append({"icon": "🏛️", "text": "Great day to visit indoor museums or galleries."})

    elif category == "Farmer":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snow cover expected; protect sensitive crops."})
            insights.append({"icon": "🚜", "text": "Halt field operations to avoid soil compaction."})
        elif is_rain:
            insights.append({"icon": "💧", "text": "Natural irrigation today; pause scheduled watering."})
        elif low_temp < 2:
            insights.append({"icon": "🧊", "text": "Frost risk detected; protect vulnerable seedlings tonight."})
        
        if wind_speed < 8 and not is_bad_weather:
            insights.append({"icon": "🚜", "text": "Low wind; ideal window for crop spraying or fertilization."})
            
        if is_hot:
            insights.append({"icon": "🐄", "text": "Extreme heat; ensure livestock have extra water and shade."})
            
        if not is_bad_weather and not is_hot:
            insights.append({"icon": "🚚", "text": "Favorable for transporting harvested goods."})

    elif category == "Student":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snowy day; check for potential campus closures."})
        elif is_rain:
            insights.append({"icon": "☔", "text": "Rainy day; leave 10 mins early for lectures."})
            
        if humidity > 85:
            insights.append({"icon": "🎒", "text": "High humidity; keep your laptop in a moisture-resistant sleeve."})
        
        if pressure > 1020:
             insights.append({"icon": "🧠", "text": "High atmospheric pressure; often linked to improved concentration."})
             
        if is_sunny:
            insights.append({"icon": "📚", "text": "Good natural light for studying near windows."})
        else:
            insights.append({"icon": "☕", "text": "Perfect weather for a library study session."})

    elif category == "Picnic":
        if is_bad_weather:
            insights.append({"icon": "🏠", "text": "Indoor picnic is highly recommended today."})
            insights.append({"icon": "🍿", "text": "Movie day with snacks instead of an outdoor trip!"})
        else:
            if uv_index > 6:
                insights.append({"icon": "🌳", "text": "High UV; pick a spot with plenty of shade."})
            if wind_speed > 15:
                insights.append({"icon": "🪁", "text": "Strong breeze; great for kites but watch your napkins!"})
            elif is_hot:
                insights.append({"icon": "🍉", "text": "Hot day; bring plenty of iced drinks and fruit."})
            else:
                insights.append({"icon": "🧺", "text": "Excellent weather for an outdoor picnic."})

            if wind_speed > 10 and humidity < 40:
                insights.append({"icon": "🦟", "text": "Steady breeze and dry air; mosquito activity should be minimal."})

    elif category == "Sports":
        if aqi and aqi > 100:
            insights.append({"icon": "⚠️", "text": "Poor air quality; recommend indoor workout today."})
        elif is_rain:
            insights.append({"icon": "🏀", "text": "Slippery surfaces; move activities to an indoor gym."})
        elif is_hot:
            insights.append({"icon": "🥤", "text": "Extreme heat; prioritize hydration and take frequent breaks."})
            insights.append({"icon": "🏃", "text": "Morning or late evening runs are preferred."})
        else:
            insights.append({"icon": "⚡", "text": "Peak performance weather! Excellent for outdoor sports."})
            
        if humidity > 75 and not is_bad_weather:
            insights.append({"icon": "🎾", "text": "High humidity; surfaces may feel tacky. Good for ball grip."})

    else: # General
        if is_snow:
            insights.append({"icon": "❄️", "text": "Bundle up! Snow is in the forecast."})
        elif is_rain:
            insights.append({"icon": "🌂", "text": "Don't forget your umbrella today."})
        elif is_hot:
            insights.append({"icon": "☀️", "text": "Stay hydrated and avoid direct sun at noon."})
        elif is_cold:
            insights.append({"icon": "🧣", "text": "It's quite cold outside; wear warm layers."})
        
        if humidity < 40 and not is_bad_weather:
            insights.append({"icon": "👕", "text": "Dry air and steady breeze; perfect for drying laundry outside."})
            
        if is_hot and is_sunny:
            insights.append({"icon": "🐾", "text": "Pavement may be too hot for dog paws; walk in the grass."})

    if category == "General" and humidity_insight:
        insights.append(humidity_insight)

    # Summary logic
    if is_snow:
        summary = f"Snowy conditions today. Dress warmly and be careful on the roads."
    elif is_rain:
        summary = f"Rainy weather today. Suitable for indoor plans."
    elif is_hot:
        summary = f"Hot weather today. Suitable for outdoor plans but stay cool."
    elif is_cold:
        summary = f"Cold weather today. Dress in warm layers if heading out."
    else:
        summary = f"Pleasant weather today. Great for outdoor activities."

    return {
        "summary": summary,
        "confidence": "High" if len(insights) >= 3 else "Medium",
        "category": category,
        "insights": insights[:5] 
    }
