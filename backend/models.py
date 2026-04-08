from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    last_synced = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to weather data
    weather_data = db.relationship('DailyWeather', backref='city', lazy=True, cascade="all, delete-orphan")

class DailyWeather(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    temp_max = db.Column(db.Float)
    temp_min = db.Column(db.Float)
    precipitation = db.Column(db.Float)
    
    __table_args__ = (db.UniqueConstraint('city_id', 'date', name='_city_date_uc'),)
