def generate_insights(weather_data, category="General"):
    """
    Generates smart insights based on weather data and selected category.
    """
    temp = weather_data.get('temperature', 0)
    feels_like = weather_data.get('feelsLike', 0)
    humidity = weather_data.get('humidity', 0)
    condition = weather_data.get('condition', 'Clear').lower()
    wind_speed = weather_data.get('windSpeed', 0)
    uv_index = weather_data.get('uvIndex', 0)
    aqi = weather_data.get('aqi')
    
    insights = []
    
    is_rain = 'rain' in condition or 'drizzle' in condition or 'shower' in condition or 'storm' in condition
    is_snow = 'snow' in condition or 'freezing' in condition
    is_bad_weather = is_rain or is_snow
    is_hot = temp > 28
    is_cold = temp < 10
    is_sunny = 'clear' in condition or 'sun' in condition
    
    # Base humidity insight
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
            insights.append({"icon": "🚶", "text": "Expect some delays in local transit."})
        elif is_hot:
            insights.append({"icon": "👕", "text": "Wear light breathable fabrics."})
        elif is_cold:
            insights.append({"icon": "🧥", "text": "Cold day; pack a thick jacket."})
        else:
            insights.append({"icon": "🧥", "text": "Good conditions for travel. Keep a light jacket handy."})
            
        if not is_bad_weather:
            insights.append({"icon": "🗺️", "text": "Favorable weather for both indoor and outdoor itineraries."})
            insights.append({"icon": "🚆", "text": "Transit systems should be running on their regular schedules."})
        else:
            insights.append({"icon": "🏛️", "text": "Great day to visit indoor museums or galleries."})
            
        if uv_index > 5:
            insights.append({"icon": "🕶️", "text": "High UV levels; wear sunglasses while exploring."})

    elif category == "Farmer":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snow cover expected; protect sensitive crops."})
            insights.append({"icon": "🚜", "text": "Halt field operations to avoid soil compaction."})
        elif is_rain:
            insights.append({"icon": "💧", "text": "Natural irrigation today; pause scheduled watering."})
            insights.append({"icon": "🚜", "text": "Soil might be muddy; avoid heavy machinery if possible."})
        elif humidity < 30:
            insights.append({"icon": "🚿", "text": "Low humidity; soil moisture may evaporate quickly."})
        else:
            insights.append({"icon": "✅", "text": "Stable conditions. Standard farming operations can proceed."})
            
        if not is_bad_weather:
            insights.append({"icon": "👨‍🌾", "text": "Good weather for inspecting fences and field boundaries."})
            insights.append({"icon": "🚚", "text": "Favorable for transporting harvested goods."})

    elif category == "Student":
        if is_snow:
            insights.append({"icon": "❄️", "text": "Snowy day; check for campus closures."})
            insights.append({"icon": "☕", "text": "Perfect weather for a library study session."})
        elif is_rain:
            insights.append({"icon": "☔", "text": "Heavy rain expected; leave 10 mins early for class."})
            insights.append({"icon": "☕", "text": "Perfect weather for a library study session."})
        elif is_cold:
            insights.append({"icon": "🧣", "text": "Chilly morning; layer up for early lectures."})
        else:
            insights.append({"icon": "🎒", "text": "Great day for walking or cycling to campus."})
            
        if is_sunny:
            insights.append({"icon": "📚", "text": "Good natural light for studying near windows."})

    elif category == "Picnic":
        if is_bad_weather:
            insights.append({"icon": "🏠", "text": "Indoor picnic is highly recommended today."})
            insights.append({"icon": "🍿", "text": "Movie day with snacks instead of an outdoor trip!"})
        else:
            if uv_index > 6:
                insights.append({"icon": "🌳", "text": "High UV; pick a spot with plenty of shade."})
                insights.append({"icon": "🧴", "text": "Don't forget the sunscreen!"})
            if wind_speed > 10:
                insights.append({"icon": "🪁", "text": "A bit windy; perfect for kites, but watch your plates!"})
            elif is_hot:
                insights.append({"icon": "🍉", "text": "Hot day; bring plenty of cold drinks."})
            else:
                insights.append({"icon": "🧺", "text": "Excellent weather for an outdoor picnic."})
                insights.append({"icon": "🍎", "text": "Favorable conditions for keeping food fresh outdoors."})

            if humidity < 40:
                insights.append({"icon": "🦟", "text": "Low humidity; mosquito activity should be minimal."})

    elif category == "Sports":
        if aqi and aqi > 100:
            insights.append({"icon": "⚠️", "text": "Poor air quality; recommend indoor workout today."})
        elif is_snow:
            insights.append({"icon": "🏂", "text": "Good for winter sports, but avoid standard outdoor athletics."})
        elif is_rain:
            insights.append({"icon": "🏀", "text": "Slippery surfaces; move activities to an indoor gym."})
        elif is_hot:
            insights.append({"icon": "🥤", "text": "Extreme heat; stay hydrated and take frequent breaks."})
            insights.append({"icon": "🏃", "text": "Morning or late evening runs are preferred."})
        else:
            insights.append({"icon": "⚡", "text": "Peak performance weather! Excellent for outdoor sports."})
            if wind_speed < 5:
                insights.append({"icon": "⏱️", "text": "Optimal low-wind conditions for track and field activities."})

    else: # General
        if is_snow:
            insights.append({"icon": "❄️", "text": "Bundle up! Snow is in the forecast."})
            insights.append({"icon": "🏠", "text": "Great day to stay cozy indoors."})
        elif is_rain:
            insights.append({"icon": "🌂", "text": "Don't forget your umbrella today."})
            insights.append({"icon": "🏠", "text": "Good day for indoor chores and organization."})
        elif is_hot:
            insights.append({"icon": "☀️", "text": "Stay hydrated and avoid direct sun at noon."})
            insights.append({"icon": "👕", "text": "Casual summer wear is appropriate for today."})
        elif is_cold:
            insights.append({"icon": "🧣", "text": "It's quite cold outside; wear warm layers."})
        else:
            insights.append({"icon": "🌳", "text": "Pleasant conditions for a walk outside."})
            insights.append({"icon": "👕", "text": "Light or casual wear should be comfortable."})

    if humidity_insight:
        insights.append(humidity_insight)

    # Summary logic
    if is_snow:
        summary = f"Snowy weather today. Dress warmly and be careful on the roads."
    elif is_rain:
        summary = f"Rainy weather today. Suitable for indoor plans."
    elif is_hot:
        summary = f"Hot weather today. Dry and stable; suitable for outdoor plans but stay cool."
    elif is_cold:
        summary = f"Cold weather today. Dress in warm layers if heading out."
    else:
        summary = f"Pleasant weather today. Great for outdoor activities."

    return {
        "summary": summary,
        "confidence": "High",
        "category": category,
        "insights": insights[:5] # Limit to top 5 insights to keep UI clean
    }
