import time
from app import app, predictor
from models import db, City, DailyWeather
import requests
import urllib.parse

# 🇮🇳 CURATED STATE-WISE INDIA CITIES 🇮🇳
# Top 4-5 major/regional hubs for every State & UT

CITIES_BY_STATE = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Goa": ["Panaji", "Vasco da Gama", "Margao", "Mapusa"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Hisar"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"],
    "Manipur": ["Imphal", "Bishnupur", "Thoubal"],
    "Meghalaya": ["Shillong", "Tura", "Jowai"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Berhampur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Erode"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Tripura": ["Agartala", "Udaipur Trip", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
    "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Howrah"],
    "UT": ["New Delhi", "Chandigarh", "Puducherry", "Port Blair", "Leh", "Jammu", "Srinagar"]
}

# Flatten the list for sync
MAJOR_CITIES_INDIA = []
for state, cities in CITIES_BY_STATE.items():
    MAJOR_CITIES_INDIA.extend(cities)

# De-duplicate
MAJOR_CITIES_INDIA = list(set(MAJOR_CITIES_INDIA))

def state_wise_sync():
    print(f"Starting State-Wise India Sync for {len(MAJOR_CITIES_INDIA)} regional hubs...")
    print("---------------------------------------------------------")
    
    with app.app_context():
        for i, city_name in enumerate(MAJOR_CITIES_INDIA):
            # Check if synced
            city_in_db = City.query.filter_by(name=city_name).first()
            if city_in_db:
                record_count = DailyWeather.query.filter_by(city_id=city_in_db.id).count()
                if record_count >= 3000:
                    print(f"[{i+1}/{len(MAJOR_CITIES_INDIA)}] Skipping: {city_name} ({record_count} records)")
                    continue
                else:
                    print(f"[{i+1}/{len(MAJOR_CITIES_INDIA)}] Resuming: {city_name} (Current: {record_count} records)")
            else:
                print(f"[{i+1}/{len(MAJOR_CITIES_INDIA)}] New State Hub: {city_name}...")

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
                        print(f"   [WARN] City not found: {city_name}")
                        continue
                except Exception as e:
                    print(f"   [ERROR] Geocoding failed: {e}")
                    continue
            
            # Sync with Retry Loop
            max_city_retries = 3
            city_sync_success = False
            
            for attempt in range(max_city_retries):
                try:
                    predictor.sync_city_history(city_name, lat, lon)
                    city_sync_success = True
                    break # Success!
                except Exception as e:
                    print(f"   [ERROR] Sync attempt {attempt+1}/{max_city_retries} failed for {city_name}: {e}")
                    if "429" in str(e):
                        delay = 60 * (attempt + 1)
                        print(f"   [WARN] Rate limit hit! Backing off for {delay}s...")
                        time.sleep(delay)
                    else:
                        time.sleep(5)
            
            # Global throttle between cities
            if i < len(MAJOR_CITIES_INDIA) - 1:
                # Every 10 cities, take a longer 45s break
                if (i + 1) % 10 == 0:
                    print(f"   [SYNC] State-sync breather (45s)... [{i+1}/{len(MAJOR_CITIES_INDIA)}]")
                    time.sleep(45)
                else:
                    time.sleep(4.0) # Conservative rate for global sync

    print("---------------------------------------------------------")
    print("India State-Wise Sync Completed!")

if __name__ == "__main__":
    state_wise_sync()
