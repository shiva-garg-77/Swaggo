import os
from datetime import timedelta

class Config:
    """Configuration settings for the Data Science server"""
    
    # Server settings
    HOST = '0.0.0.0'
    PORT = 5000
    DEBUG = True
    
    # CORS settings
    CORS_ORIGINS = [
        "http://localhost:3000",  # React frontend
        "http://localhost:4000",  # Node.js backend
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4000"
    ]
    
    # File upload settings
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'csv', 'json', 'xlsx', 'excel', 'txt'}
    
    # Data processing settings
    MAX_ROWS_FOR_PROCESSING = 100000  # Maximum rows to process at once
    CACHE_TIMEOUT = timedelta(hours=1)  # Cache insights for 1 hour
    
    # Machine Learning settings
    MODEL_SAVE_PATH = 'models'
    MAX_FEATURES_FOR_AUTO_ML = 50  # Maximum features for automatic ML
    DEFAULT_TEST_SIZE = 0.2
    RANDOM_STATE = 42
    
    # API settings
    API_RATE_LIMIT = "100 per minute"
    
    # Database settings (if needed for storing results)
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///ds_results.db')
    
    # External API settings
    WEBSITE_BACKEND_URL = "http://localhost:4000"
    WEBSITE_FRONTEND_URL = "http://localhost:3000"
    
    # Security settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Logging settings
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'ds_server.log'
    
    # Feature flags
    ENABLE_AI_INSIGHTS = True
    ENABLE_ML_PREDICTIONS = True
    ENABLE_DATA_VISUALIZATION = True
    ENABLE_FILE_UPLOAD = True
    
    @classmethod
    def init_app(cls, app):
        """Initialize app with config"""
        app.config['MAX_CONTENT_LENGTH'] = cls.MAX_CONTENT_LENGTH
        app.config['UPLOAD_FOLDER'] = cls.UPLOAD_FOLDER
        
        # Create necessary directories
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.MODEL_SAVE_PATH, exist_ok=True)
        os.makedirs('data', exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 5000))
    
    # More restrictive settings for production
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB in production
    API_RATE_LIMIT = "50 per minute"

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    DATABASE_URL = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
