from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, supports_credentials=True)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')
    
    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    return app

from app import models
