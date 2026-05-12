import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "phishing_detector")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml-model/phishing_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "../../ml-model/scaler.pkl")
