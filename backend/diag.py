import requests
import urllib.parse
import time

def test_forecast():
    print("--- Testing Forecast API ---")
    lat_val, lon_val = 51.50853, -0.12574
    url = (f"https://api.open-meteo.com/v1/forecast?latitude={lat_val}&longitude={lon_val}"
           "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,visibility,is_day"
           "&hourly=temperature_2m"
           "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max"
           "&timezone=auto")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"Forecast Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Forecast Error: {resp.text}")
    except Exception as e:
        print(f"Forecast Exception: {e}")

def test_geocoding():
    print("\n--- Testing Geocoding API ---")
    city = "London"
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city)}&count=1"
    try:
        resp = requests.get(url, timeout=10)
        print(f"Geocoding Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if data.get('results'):
                print(f"Geocoding Success: Found {data['results'][0]['name']}")
            else:
                print("Geocoding Success: No results for 'London' (weird!)")
        else:
            print(f"Geocoding Error: {resp.text}")
    except Exception as e:
        print(f"Geocoding Exception: {e}")

def test_archive():
    print("\n--- Testing Archive API (Historical) ---")
    lat, lon = 51.50853, -0.12574
    # Test a small range to avoid heavy load
    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
           "&start_date=2023-01-01&end_date=2023-01-05"
           "&daily=temperature_2m_max,temperature_2m_min&timezone=auto")
    try:
        resp = requests.get(url, timeout=15)
        print(f"Archive Status: {resp.status_code}")
        if resp.status_code == 429:
            print("Archive Error: Rate limited! (Too many requests)")
        elif resp.status_code != 200:
            print(f"Archive Error: {resp.text}")
        else:
            print("Archive Success!")
    except Exception as e:
        print(f"Archive Exception: {e}")

if __name__ == "__main__":
    test_forecast()
    test_geocoding()
    test_archive()
