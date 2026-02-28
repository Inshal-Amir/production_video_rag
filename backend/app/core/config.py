import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Video RAG Production"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    # Derive BASE_DIR from this file's location: backend/app/core/config.py -> backend/
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    VIDEO_DIR: Path = DATA_DIR / "videos"
    CLIPS_DIR: Path = DATA_DIR / "clips"
    
    # Secrets
    OPENAI_API_KEY: str
    QDRANT_URL: str
    
    # --- NEW: Add API Key Support ---
    QDRANT_API_KEY: Optional[str] = None 

    class Config:
        env_file = ".env"

settings = Settings()

os.makedirs(settings.VIDEO_DIR, exist_ok=True)
os.makedirs(settings.CLIPS_DIR, exist_ok=True)