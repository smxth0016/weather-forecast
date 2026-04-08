import sqlite3
import pandas as pd
import os

def check_db():
    db_path = 'weather.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    
    print("\n--- [ System Summary ] ---")
    cities = pd.read_sql_query("SELECT * FROM city", conn)
    print(f"Total Cities Synced: {len(cities)}")
    print(cities[['id', 'name', 'latitude', 'longitude', 'last_synced']])

    print("\n--- [ Weather Records Preview ] ---")
    # Show last 10 records added
    records = pd.read_sql_query("""
        SELECT c.name as city, w.date, w.temp_max, w.temp_min, w.precipitation 
        FROM daily_weather w 
        JOIN city c ON w.city_id = c.id 
        ORDER BY w.id DESC 
        LIMIT 10
    """, conn)
    print(records)

    print("\n--- [ Data Density ] ---")
    counts = pd.read_sql_query("""
        SELECT c.name, COUNT(w.id) as record_count 
        FROM city c 
        LEFT JOIN daily_weather w ON c.id = w.city_id 
        GROUP BY c.name
    """, conn)
    print(counts)

    conn.close()

if __name__ == "__main__":
    check_db()
