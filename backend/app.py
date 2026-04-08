import os
import math
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import urllib.parse

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Database and Predictor Initialization
from database import init_db
from predictor import WeatherPredictor
import time

init_db(app)
predictor = WeatherPredictor(app)

# Circuit Breaker Globals
SERVICE_STATUS = {
    "open_meteo_down": False,
    "last_check_time": 0,
    "recovery_interval": 300 # 5 minutes
}

def fetch_from_wttr(city):
    """Fallback weather provider using wttr.in"""
    print(f"[RESIILIENCE] Attempting fallback to wttr.in for \"{city}\"")
    try:
        url = f"https://wttr.in/{urllib.parse.quote(city)}?format=j1"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        current = data['current_condition'][0]
        weather_today = data['weather'][0]
        
        # Map wttr.in schema to AtmosIntel standard
        hourly_data = []
        for h in data['weather'][0]['hourly']:
            time_str = f"{int(h['time']) // 100:02d}:00"
            hourly_data.append({
                "hour": time_str,
                "temp": float(h['tempC'])
            })

        forecast_data = []
        for day in data['weather'][:7]:
            d_obj = datetime.strptime(day['date'], '%Y-%m-%d')
            forecast_data.append({
                "day": d_obj.strftime("%a"),
                "condition": day['hourly'][4]['weatherDesc'][0]['value'], # Mid-day condition
                "hi": int(day['maxtempC']),
                "lo": int(day['mintempC'])
            })
        if forecast_data: forecast_data[0]['day'] = "Today"

        return {
            "city": city.title(),
            "temperature": float(current['temp_C']),
            "humidity": int(current['humidity']),
            "condition": current['weatherDesc'][0]['value'],
            "windSpeed": float(current['windspeedKmph']),
            "windDirDeg": int(current['winddirDegree']),
            "feelsLike": float(current['FeelsLikeC']),
            "pressure": int(current['pressure']),
            "visibility": float(current['visibility']),
            "high": int(weather_today['maxtempC']),
            "low": int(weather_today['mintempC']),
            "sunrise": weather_today['astronomy'][0]['sunrise'],
            "sunset": weather_today['astronomy'][0]['sunset'],
            "uvIndex": int(weather_today['uvIndex']),
            "isDay": True, # wttr.in doesn't provide easy isDay, default to True
            "currentTime": datetime.now().strftime("%Y-%m-%dT%H:%M"),
            "hourly": hourly_data,
            "forecast": forecast_data,
            "provider": "wttr.in"
        }
    except Exception as e:
        print(f"❌ Fallback also failed: {e}")
        return None

def map_weather_code_to_condition(code):
    if code == 0: return 'Clear skies'
    if code in [1, 2]: return 'Partly cloudy'
    if code == 3: return 'Overcast'
    if code in [45, 48]: return 'Fog'
    if code in [51, 53, 55, 56, 57]: return 'Drizzle'
    if code == 65: return 'Heavy rain'
    if code == 67: return 'Heavy freezing rain'
    if code in [61, 63, 66]: return 'Rain showers'
    if code in [71, 73, 75, 77, 85, 86]: return 'Snowfall'
    if code == 82: return 'Violent rain showers'
    if code in [80, 81]: return 'Rain showers'
    if code in [95, 96, 99]: return 'Thunderstorm'
    return 'Cloudy'

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

@app.route('/api/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    print(f"[API] Fetching weather for q=\"{city}\", lat={lat}, lon={lon}")
    
    if not city and (not lat or not lon):
        return jsonify({"error": "City or coordinates (lat, lon) are required"}), 400
        
    name = ""
    latitude = None
    longitude = None
    
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        has_coords = not math.isnan(lat_f) and not math.isnan(lon_f)
    except (TypeError, ValueError):
        has_coords = False

    if has_coords:
        latitude = lat_f
        longitude = lon_f
        name = city if city else f"Location ({latitude:.2f}, {longitude:.2f})"
        print(f"📍 Using exact coordinates: {latitude}, {longitude}")
    else:
        print(f"🔍 No valid coordinates provided. Geocoding city name instead: \"{city}\"")
        try:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1"
            geo_response = requests.get(geo_url, timeout=10)
            geo_response.raise_for_status()
            geo_data = geo_response.json()
            if not geo_data.get('results'):
                print(f"⚠️ City not found in geocoding: \"{city}\"")
                return jsonify({"error": "City not found"}), 404
            
            result = geo_data['results'][0]
            latitude = result['latitude']
            longitude = result['longitude']
            name = result['name']
            print(f"✅ Geocoded \"{city}\" to {latitude}, {longitude}")
        except Exception as e:
            print(f"❌ Geocoding failed: {e}. Trying immediate fallback to alternative provider...")
            resilient_data = fetch_from_wttr(city)
            if resilient_data:
                return jsonify(resilient_data)
            return jsonify({"error": "Geocoding service timed out. Check your connection."}), 504

    def fetch_forecast(lat_val, lon_val):
        # Circuit Breaker Check
        current_time = time.time()
        if SERVICE_STATUS["open_meteo_down"]:
            if current_time - SERVICE_STATUS["last_check_time"] < SERVICE_STATUS["recovery_interval"]:
                print(f"[CIRCUIT] Primary service is marked DOWN. Skipping to alternative...")
                raise Exception("Circuit breaker is open (Primary down)")
            else:
                print(f"[CIRCUIT] Recovery interval passed. Testing primary service...")
                SERVICE_STATUS["open_meteo_down"] = False

        url = (f"https://api.open-meteo.com/v1/forecast?latitude={lat_val}&longitude={lon_val}"
               "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,visibility,is_day"
               "&hourly=temperature_2m"
               "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max"
               "&timezone=auto")
        
        # Optimized fetch with lower timeout for faster user feedback
        for attempt in range(2):
            try:
                resp = requests.get(url, timeout=6)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    print(f"[API] ⚠️ Rate limit hit (429) on attempt {attempt+1}")
                    # Don't trip the circuit breaker for 429, just wait a bit if it's the first attempt
                    if attempt == 0:
                        time.sleep(1)
                        continue
                    raise Exception("Rate limit hit")
                else:
                    print(f"[API] ❌ Primary service returned {resp.status_code}: {resp.text[:100]}")
                    resp.raise_for_status()

            except Exception as e:
                print(f"[API] Forecast attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    # Trip the circuit breaker only for connection/server issues, not rate limits
                    if "429" not in str(e):
                        print(f"[CIRCUIT] Tripping circuit breaker due to persistent failure.")
                        SERVICE_STATUS["open_meteo_down"] = True
                        SERVICE_STATUS["last_check_time"] = time.time()
                    raise e
        raise Exception("Failed to fetch forecast from primary source")

    try:
        weather_data = fetch_forecast(latitude, longitude)
        if not weather_data:
            raise Exception("No data from primary")
    except Exception as err:
        print(f"⚠️ Forecast by coords failed, falling back to name search for: \"{city}\"")
        try:
            # Fallback geocoding also needs timeout
            geo_fallback_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1"
            geo_fallback_resp = requests.get(geo_fallback_url, timeout=10)
            fallback_geo = geo_fallback_resp.json()
            
            if not fallback_geo.get('results'):
                raise Exception("Geocoding failed")
                
            f_lat = fallback_geo['results'][0]['latitude']
            f_lon = fallback_geo['results'][0]['longitude']
            f_name = fallback_geo['results'][0]['name']
            
            weather_data = fetch_forecast(f_lat, f_lon)
            if not weather_data:
                raise Exception("Fallback fetch returned no data")
            name = f_name
        except Exception as fallback_err:
            print(f"⚠️ Open-Meteo fallback failed, trying alternative provider (wttr.in)...")
            resilient_data = fetch_from_wttr(city)
            if resilient_data:
                return jsonify(resilient_data)
                
            print(f"❌ All providers failed: {fallback_err}")
            return jsonify({"error": "Weather service is currently unresponsive. Please try again in a few moments."}), 503

    hourly_data = []
    current_time_str = weather_data['current']['time']
    times = weather_data['hourly']['time']
    start_index = 0
    for idx, t in enumerate(times):
        if t >= current_time_str:
            start_index = idx
            break
            
    for i in range(24):
        idx = start_index + i
        if idx < len(times):
            hourly_data.append({
                "hour": times[idx][11:16],
                "temp": round(float(weather_data['hourly']['temperature_2m'][idx]), 1)
            })

    forecast_data = []
    daily_times = weather_data['daily']['time']
    for i in range(min(7, len(daily_times))):
        day_str = daily_times[i]
        date_obj = datetime.strptime(day_str, '%Y-%m-%d')
        day_name = "Today" if i == 0 else date_obj.strftime("%a")
        forecast_data.append({
            "day": day_name,
            "condition": map_weather_code_to_condition(weather_data['daily']['weather_code'][i]),
            "hi": round(weather_data['daily']['temperature_2m_max'][i]),
            "lo": round(weather_data['daily']['temperature_2m_min'][i])
        })

    try:
        uv_index_val = weather_data['daily']['uv_index_max'][0] if weather_data['daily'].get('uv_index_max') and len(weather_data['daily']['uv_index_max']) > 0 and weather_data['daily']['uv_index_max'][0] is not None else 0
        sunrise_val = weather_data['daily']['sunrise'][0][11:16] if weather_data['daily'].get('sunrise') and len(weather_data['daily']['sunrise']) > 0 and weather_data['daily']['sunrise'][0] else "--:--"
        sunset_val = weather_data['daily']['sunset'][0][11:16] if weather_data['daily'].get('sunset') and len(weather_data['daily']['sunset']) > 0 and weather_data['daily']['sunset'][0] else "--:--"
        
        formatted_response = {
            "city": name,
            "temperature": round(float(weather_data['current']['temperature_2m']), 1),
            "humidity": weather_data['current']['relative_humidity_2m'],
            "condition": map_weather_code_to_condition(weather_data['current']['weather_code']),
            "windSpeed": round(float(weather_data['current']['wind_speed_10m']), 1),
            "windDirDeg": weather_data['current']['wind_direction_10m'],
            "feelsLike": round(float(weather_data['current']['apparent_temperature']), 1),
            "pressure": weather_data['current']['surface_pressure'],
            "visibility": round(float(weather_data['current']['visibility']) / 1000.0, 1),
            "high": round(weather_data['daily']['temperature_2m_max'][0]),
            "low": round(weather_data['daily']['temperature_2m_min'][0]),
            "sunrise": sunrise_val,
            "sunset": sunset_val,
            "uvIndex": uv_index_val,
            "isDay": weather_data['current']['is_day'] == 1,
            "currentTime": weather_data['current']['time'],
            "hourly": hourly_data,
            "forecast": forecast_data
        }
        return jsonify(formatted_response)
    except Exception as e:
        print("Error fetching weather:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['GET'])
def get_predict():
    city = request.args.get('city')
    month = request.args.get('month')
    day = request.args.get('day')
    
    if not city or not month or not day:
        return jsonify({"error": "Parameters city, month, day are required"}), 400
        
    try:
        # Step 1: Geocode city if lat/lon not provided or to ensure we have a clean name
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1"
        geo_resp = requests.get(geo_url)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        
        if not geo_data.get('results'):
            return jsonify({"error": "City not found"}), 404
            
        res = geo_data['results'][0]
        latitude = res['latitude']
        longitude = res['longitude']
        city_name = res['name']
        
        # Step 2: Ensure historical data is synced (local database)
        # This will fetch 10 years of data if not already present
        predictor.sync_city_history(city_name, latitude, longitude)
        
        # Step 3: Run prediction using the local database
        prediction = predictor.predict_weather(city_name, month, day)
        
        if not prediction:
            # Check if we have ANY records for this city
            from models import City, DailyWeather
            c = City.query.filter_by(name=city_name).first()
            count = DailyWeather.query.filter_by(city_id=c.id).count() if c else 0
            
            if count == 0:
                return jsonify({"error": f"Still syncing historical data for {city_name}. Please wait 10 seconds and try again."}), 503
            return jsonify({"error": "Not enough historical data to generate a reliable prediction."}), 404
            
        return jsonify({
            "city": city_name,
            "targetDate": f"{month}/{day}",
            "yearsAnalyzed": prediction['count'],
            "avgMax": prediction['avgMax'],
            "avgMin": prediction['avgMin'],
            "precipProb": prediction['precipProb'],
            "predictedMax": prediction['predictedMax'],
            "predictedMin": prediction['predictedMin'],
            "trendSlope": prediction.get('trendSlope', 0),
            "historicalData": prediction.get('historicalData', [])
        })
        
    except Exception as e:
        print("Predictor engine failed:", e)
        return jsonify({"error": "Failed to generate prediction"}), 500

@app.route('/api/validate-cities', methods=['POST'])
def validate_cities():
    try:
        data = request.get_json()
        locations = data.get('locations')
        if not locations or not isinstance(locations, list) or len(locations) == 0:
            return jsonify({"validations": []})
            
        lats = ",".join([str(l.get('lat')) for l in locations])
        lons = ",".join([str(l.get('lon')) for l in locations])
        
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current_weather=true"
        response = requests.get(url, timeout=15)
        
        if not response.ok:
            return jsonify({"validations": [True] * len(locations)})
            
        resp_data = response.json()
        results = resp_data if isinstance(resp_data, list) else [resp_data]
        
        validations = [not r.get('error') for r in results]
        
        if len(validations) < len(locations):
            validations.extend([True] * (len(locations) - len(validations)))
            
        return jsonify({"validations": validations})
    except Exception as e:
        print("Validation failed:", e)
        return jsonify({"error": "Validation failed due to service timeout."}), 504

if __name__ == '__main__':
    # Use PORT env var for Render/Heroku, default to 5000 for local dev
    port = int(os.environ.get('PORT', 5000))
    # Standard production practice: debug=False if on assigned port
    is_prod = 'PORT' in os.environ
    app.run(host='0.0.0.0', port=port, debug=not is_prod, threaded=True)
