import time
from app import app, predictor
from models import db, City, DailyWeather

def repair_sync():
    print("🛠 Starting Global Sync Repair...")
    print("---------------------------------------------------------")
    
    with app.app_context():
        # Find all cities where the daily weather record count is 0
        broken_cities = db.session.query(City).filter(
            ~City.id.in_(db.session.query(DailyWeather.city_id))
        ).all()
        
        if not broken_cities:
            print("✅ All cities in the database have history data. No repairs needed.")
            return

        print(f"🔍 Found {len(broken_cities)} cities with 0 records. Repairing now...")
        
        for i, city in enumerate(broken_cities):
            print(f"[{i+1}/{len(broken_cities)}] Repairing: {city.name}...")
            
            # Simple retry loop for the repair process
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    predictor.sync_city_history(city.name, city.latitude, city.longitude)
                    break # Success
                except Exception as e:
                    print(f"   ❌ Repair attempt {attempt+1} failed for {city.name}: {e}")
                    if "429" in str(e):
                        delay = 60 * (attempt + 1)
                        print(f"   ⚠️ Rate limit hit! Backing off for {delay}s...")
                        time.sleep(delay)
                    else:
                        time.sleep(5)
            
            # Wait between repairs to be safe
            if i < len(broken_cities) - 1:
                time.sleep(4.0)

    print("---------------------------------------------------------")
    print("✅ Repair Job Completed!")

if __name__ == "__main__":
    repair_sync()
