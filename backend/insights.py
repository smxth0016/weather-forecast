
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
    summary = f"Currently {condition} with {humidity}% humidity. "
    
    # Base humidity insight (shown in most categories)
    if feels_like > temp + 3:
        humidity_insight = {
            "icon": "🥵",
            "text": f"Feels significantly hotter ({feels_like}°C) due to humidity."
        }
    elif feels_like < temp - 3:
        humidity_insight = {
            "icon": "🥶",
            "text": f"Feels significantly colder ({feels_like}°C) due to wind chill."
        }
    else:
        humidity_insight = None

    if category == "Traveler":
        if 'rain' in condition or 'drizzle' in condition:
            insights.append({"icon": "🧥", "text": "Carry an umbrella and waterproof gear."})
            insights.append({"icon": "🚶", "text": "Expect some delays in local transit."})
        elif temp > 30:
            insights.append({"icon": "🧥", "text": "Wear light breathable fabrics."})
            insights.append({"icon": "🧴", "text": "Sun protection is highly recommended."})
        else:
            insights.append({"icon": "🧥", "text": "Good conditions for travel. Keep a light jacket handy."})
            
        insights.append({"icon": "🗺️", "text": "Favorable weather for both indoor and outdoor itineraries."})
        insights.append({"icon": "🚆", "text": "Transit systems should be running on their regular schedules."})
        
        if uv_index > 5:
            insights.append({"icon": "🕶️", "text": "High UV levels; wear sunglasses while exploring."})

    elif category == "Farmer":
        if 'rain' in condition:
            insights.append({"icon": "💧", "text": "Natural irrigation today; pause scheduled watering."})
            insights.append({"icon": "🚜", "text": "Soil might be muddy; avoid heavy machinery if possible."})
        elif humidity < 30:
            insights.append({"icon": "🚿", "text": "Low humidity; soil moisture may evaporate quickly."})
        else:
            insights.append({"icon": "✅", "text": "Stable conditions. Standard farming operations can proceed."})
            
        insights.append({"icon": "👨‍🌾", "text": "Good weather for inspecting fences and field boundaries."})
        insights.append({"icon": "🚚", "text": "Favorable for transporting harvested goods."})
        insights.append({"icon": "🌱", "text": "A regular day to continue seasonal planting or harvesting."})

    elif category == "Student":
        if 'rain' in condition:
            insights.append({"icon": "☔", "text": "Heavy rain expected; leave 10 mins early for class."})
        elif temp < 15:
            insights.append({"icon": "🧣", "text": "Chilly morning; layer up for early lectures."})
        else:
            insights.append({"icon": "🎒", "text": "Great day for walking or cycling to campus."})
            
        insights.append({"icon": "📚", "text": "Good natural light for studying near windows."})
        insights.append({"icon": "☕", "text": "Perfect weather for a library study session."})

    elif category == "Picnic":
        if 'rain' in condition:
            insights.append({"icon": "🏠", "text": "Indoor picnic might be a better idea today."})
        elif uv_index > 6:
            insights.append({"icon": "🌳", "text": "High UV; pick a spot with plenty of shade."})
            insights.append({"icon": "🧴", "text": "Don't forget the sunscreen!"})
        elif wind_speed > 10:
            insights.append({"icon": "🪁", "text": "A bit windy; perfect for kites, but watch your plates!"})
        else:
            insights.append({"icon": "🧺", "text": "Excellent weather for an outdoor picnic."})
            
        insights.append({"icon": "🦟", "text": "Low humidity; mosquito activity should be minimal."})
        insights.append({"icon": "🍎", "text": "Favorable conditions for keeping food fresh outdoors."})

    elif category == "Sports":
        if aqi and aqi > 100:
            insights.append({"icon": "⚠️", "text": "Poor air quality; recommend indoor workout today."})
        elif temp > 32:
            insights.append({"icon": "🥤", "text": "Extreme heat; stay hydrated and take frequent breaks."})
            insights.append({"icon": "🏃", "text": "Morning or late evening runs are preferred."})
        elif 'rain' in condition:
            insights.append({"icon": "🏀", "text": "Slippery surfaces; be careful during outdoor play."})
        else:
            insights.append({"icon": "⚡", "text": "Peak performance weather! Excellent for outdoor sports."})
            
        insights.append({"icon": "⏱️", "text": "Optimal wind conditions for track and field activities."})

    else: # General
        if 'rain' in condition:
            insights.append({"icon": "🌂", "text": "Don't forget your umbrella today."})
        elif temp > 30:
            insights.append({"icon": "☀️", "text": "Stay hydrated and avoid direct sun at noon."})
        insights.append({"icon": "👕", "text": "Casual summer wear is appropriate for today."})
        insights.append({"icon": "🏠", "text": "Good day for indoor chores and organization."})

    if humidity_insight:
        insights.append(humidity_insight)

    # Summary logic
    if 'rain' in condition:
        summary = f"Rainy weather today. Suitable for indoor plans."
    elif temp > 30:
        summary = f"Hot weather today with a low chance of rain. Dry and stable; suitable for outdoor plans."
    else:
        summary = f"Pleasant weather today. Great for outdoor activities."

    return {
        "summary": summary,
        "confidence": "High",
        "category": category,
        "insights": insights
    }
