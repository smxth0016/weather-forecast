import time
from app import app, predictor
from models import db, City, DailyWeather
import requests
import urllib.parse

# 🌍 Expanded Major Cities List (160+ Cities)

# 🇮🇳 India (Top 30+)
INDIA_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", 
    "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
    "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", 
    "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi"
]

# 🌐 Global Megacities (Americas, Europe, Asia, MEA, Oceania)
GLOBAL_CITIES = [
    "Tokyo", "Shanghai", "Sao Paulo", "Mexico City", "Cairo", "Dhaka", "Beijing", "Osaka",
    "Karachi", "Chongqing", "Istanbul", "Buenos Aires", "Lagos", "Kinshasa", "Manila",
    "Rio de Janeiro", "Guangzhou", "Lahore", "Shenzhen", "Moscow", "Tianjin", "Jakarta",
    "London", "Lima", "Bangkok", "Seoul", "Nagoya", "Tehran", "Chicago", "Chengdu",
    "Nanjing", "Wuhan", "Ho Chi Minh City", "Luanda", "Kuala Lumpur", "Xi'an", "Hong Kong",
    "Dongguan", "Hangzhou", "Foshan", "Shenyang", "Riyadh", "Baghdad", "Santiago",
    "Madrid", "Suzhou", "Harbin", "Houston", "Dallas", "Toronto", "Dar es Salaam",
    "Miami", "Belo Horizonte", "Singapore", "Philadelphia", "Atlanta", "Fukuoka",
    "Khartoum", "Barcelona", "Johannesburg", "Saint Petersburg", "Qingdao", "Dalian",
    "Washington", "Yangon", "Alexandria", "Jinan", "Guadalajara", "Ankara", "Zhengzhou",
    "Melbourne", "Sydney", "Monterrey", "Brasilia", "Cape Town", "Chicago", "Dubai",
    "Berlin", "Madrid", "Rome", "Moscow", "Singapore", "Sydney", "Toronto", "Mexico City",
    "Amsterdam", "Zurich", "Vienna", "Stockholm", "Oslo", "Warsaw", "Prague", "Vancouver",
    "Montreal", "Auckland", "Manila", "Jakarta", "Tel Aviv", "Cape Town", "Nairobi",
    "Munich", "Frankfurt", "Milan", "Lisbon", "Brussels", "Copenhagen", "Helsinki",
    "Dublin", "Abu Dhabi", "Doha", "Kuwait City", "Muscat", "Casablanca", "Algiers",
    "Lagos", "Accra", "Nairobi", "Addis Ababa", "Perth", "Brisbane", "Seattle",
    "Boston", "San Francisco", "Denver", "Phoenix", "Austin", "San Diego",
    "Vancouver", "Calgary", "Ottawa", "Quebec City", "Bogota", "Lima", "Santiago"
]

# Combine and de-duplicate
MAJOR_CITIES = list(set(INDIA_CITIES + GLOBAL_CITIES))

def bulk_sync():
    print(f"🚀 Starting Extended Bulk Sync for {len(MAJOR_CITIES)} major cities...")
    print("---------------------------------------------------------")
    
    with app.app_context():
        for i, city_name in enumerate(MAJOR_CITIES):
            # Check if city already has ~10 years of data
            city_in_db = City.query.filter_by(name=city_name).first()
            if city_in_db:
                record_count = DailyWeather.query.filter_by(city_id=city_in_db.id).count()
                if record_count >= 3000:
                    print(f"[{i+1}/{len(MAJOR_CITIES)}] Skipping (Already Synced): {city_name} ({record_count} records)")
                    continue
                else:
                    print(f"[{i+1}/{len(MAJOR_CITIES)}] Resuming: {city_name} (Current: {record_count} records)")
            else:
                print(f"[{i+1}/{len(MAJOR_CITIES)}] New Sync: {city_name}...")

            # Geocode
            lat, lon = None, None
            if city_in_db:
                lat, lon = city_in_db.latitude, city_in_db.longitude
            else:
                try:
                    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city_name)}&count=1"
                    resp = requests.get(geo_url)
                    geo_data = resp.json()
                    if geo_data.get('results'):
                        res = geo_data['results'][0]
                        lat, lon = res['latitude'], res['longitude']
                        print(f"   Geocoded to: {lat}, {lon}")
                    else:
                        print(f"   ⚠️ City not found: {city_name}")
                        continue
                except Exception as e:
                    print(f"   ❌ Geocoding failed: {e}")
                    continue
            
            # Sync
            try:
                predictor.sync_city_history(city_name, lat, lon)
            except Exception as e:
                print(f"   ❌ Sync failed for {city_name}: {e}")
                if "429" in str(e):
                    print("   ⚠️ Rate limit hit! Taking a 60s breather...")
                    time.sleep(60)
            
            # Rate limiting (avoid blocking)
            if i < len(MAJOR_CITIES) - 1:
                # Every 10 cities, take a longer 30s break
                if (i + 1) % 10 == 0:
                    print("   🛀 Mid-sync breather (30s)...")
                    time.sleep(30)
                else:
                    time.sleep(3.0) # Increased to 3s per city

    print("---------------------------------------------------------")
    print("✅ Global Extension Bulk Sync Completed!")

if __name__ == "__main__":
    bulk_sync()
