import requests
import time
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import numpy as np
from models import db, City, DailyWeather

class WeatherPredictor:
    def __init__(self, app):
        self.app = app

    def sync_city_history(self, city_name, lat, lon):
        with self.app.app_context():
            # Check if city exists
            city = City.query.filter_by(name=city_name).first()
            if not city:
                city = City(name=city_name, latitude=lat, longitude=lon)
                db.session.add(city)
                db.session.commit()

            # Check if we have enough data (at least 10 years of records)
            records_count = DailyWeather.query.filter_by(city_id=city.id).count()
            
            # If we have less than 3000 records (approx 8 years), fetch 10 years
            if records_count < 3000:
                print(f"[PREDICTOR] Syncing 10 years of historical data for {city_name}...")
                
                # Setup dates
                current_year = datetime.now().year
                start_date = f"{current_year - 11}-01-01"
                end_date = f"{current_year - 1}-12-31"

                url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
                       f"&start_date={start_date}&end_date={end_date}"
                       "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto")
                
                max_retries = 3
                retry_delay = 5
                
                for attempt in range(max_retries):
                    try:
                        response = requests.get(url, timeout=15)
                        if response.status_code == 429:
                            if attempt == max_retries - 1:
                                print(f"[PREDICTOR] [CRITICAL] Max retries reached for {city_name} (Rate Limited). Skipping sync.")
                                break
                            print(f"[PREDICTOR] [WARNING] Rate limit hit (429). Attempt {attempt+1}/{max_retries}. Backing off for {retry_delay}s...")
                            time.sleep(retry_delay)
                            retry_delay *= 4  # Aggressive exponential backoff
                            continue
                            
                        response.raise_for_status()
                        data = response.json()
                        
                        if 'daily' in data:
                            daily = data['daily']
                            times = daily['time']
                            max_temps = daily['temperature_2m_max']
                            min_temps = daily['temperature_2m_min']
                            precips = daily['precipitation_sum']
                            
                            new_records = []
                            for i in range(len(times)):
                                if max_temps[i] is not None:
                                    d_obj = datetime.strptime(times[i], '%Y-%m-%d').date()
                                    record = DailyWeather(
                                        city_id=city.id,
                                        date=d_obj,
                                        temp_max=max_temps[i],
                                        temp_min=min_temps[i],
                                        precipitation=precips[i] if precips[i] is not None else 0
                                    )
                                    new_records.append(record)
                            
                            if new_records:
                                # Clear existing partial data if any to avoid duplicates
                                DailyWeather.query.filter_by(city_id=city.id).delete()
                                db.session.bulk_save_objects(new_records)
                                db.session.commit()
                                print(f"[PREDICTOR] [SUCCESS] Successfully synced {len(new_records)} records for {city_name}.")
                                break # Success
                        else:
                            print(f"[PREDICTOR] [ERROR] Unexpected API response format for {city_name}")
                            break
                    except Exception as e:
                        print(f"[PREDICTOR] [ERROR] Sync attempt {attempt+1} failed: {e}")
                        if attempt < max_retries - 1:
                            time.sleep(retry_delay)
                            retry_delay *= 2
                        else:
                            print(f"[PREDICTOR] [CRITICAL] All sync attempts failed for {city_name}.")
            return city

    def predict_weather(self, city_name, month, day):
        with self.app.app_context():
            city = City.query.filter_by(name=city_name).first()
            if not city:
                return None
            
            # Retrieve all historical data for that day/month across all years
            # SQLite doesn't have strftime directly in easy SQLAlchemy filter sometimes without more work
            # So we load and filter with pandas for more robust/flexible processing
            
            records = DailyWeather.query.filter_by(city_id=city.id).all()
            if not records:
                return None
            
            # Load into DataFrame
            df = pd.DataFrame([{
                'date': r.date,
                'max': r.temp_max,
                'min': r.temp_min,
                'precip': r.precipitation,
                'year': r.date.year,
                'month': r.date.month,
                'day': r.date.day
            } for r in records])

            # Filter for the specific target date (month and day)
            target_df = df[(df['month'] == int(month)) & (df['day'] == int(day))]
            
            if len(target_df) < 3:
                # Not enough data for linear regression, just use averages
                avg_max = df['max'].mean()
                avg_min = df['min'].mean()
                return {
                    "avgMax": round(avg_max, 1),
                    "avgMin": round(avg_min, 1),
                    "predictedMax": round(avg_max, 1),
                    "predictedMin": round(avg_min, 1),
                    "precipProb": int(df[df['precip'] > 0.1]['precip'].count() / len(df) * 100) if not df.empty else 0,
                    "count": len(df)
                }

            # Prepare for Linear Regression
            # X = years (normalized), y = temperatures
            X = target_df['year'].values.reshape(-1, 1)
            y_max = target_df['max'].values
            y_min = target_df['min'].values
            
            # Train and predict
            model_max = LinearRegression().fit(X, y_max)
            model_min = LinearRegression().fit(X, y_min)
            
            # Predict for current or next year
            target_year = datetime.now().year
            pred_max = model_max.predict([[target_year]])[0]
            pred_min = model_min.predict([[target_year]])[0]
            
            # Calculate metrics
            avg_max = target_df['max'].mean()
            avg_min = target_df['min'].mean()
            precip_prob = (target_df[target_df['precip'] > 0.1]['precip'].count() / len(target_df)) * 100
            
            # Format historical data for response
            historical = target_df.sort_values('year').to_dict('records')
            
            return {
                "avgMax": round(avg_max, 1),
                "avgMin": round(avg_min, 1),
                "predictedMax": round(pred_max, 1),
                "predictedMin": round(pred_min, 1),
                "trendSlope": round(float(model_max.coef_[0]), 3),
                "precipProb": int(round(precip_prob)),
                "historicalData": historical,
                "count": len(target_df)
            }
