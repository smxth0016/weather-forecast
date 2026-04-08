import os
from models import db

def init_db(app):
    # Determine DB path: Priority to DATABASE_PATH env var (for Persistent Disks)
    default_db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'weather.db')
    db_path = os.environ.get('DATABASE_PATH', default_db_path)
    
    # Ensure parent directory exists if using a custom path
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print(f"Database initialized at {db_path}")
