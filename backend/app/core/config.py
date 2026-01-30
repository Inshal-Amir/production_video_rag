import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Video RAG Production"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    VIDEO_DIR: str = "/app/data/videos"
    
    # Secrets
    OPENAI_API_KEY: str
    QDRANT_URL: str
    
    # --- NEW: Add API Key Support ---
    QDRANT_API_KEY: Optional[str] = None 

    class Config:
        env_file = ".env"

settings = Settings()

os.makedirs(settings.VIDEO_DIR, exist_ok=True)