from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Geo-Location Attendance Tracker"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "attendance"
    USE_SQLITE: bool = True  # Fallback for local run without Docker

    @property
    def get_database_url(self) -> str:
        if self.USE_SQLITE:
            return "sqlite:///./attendance.db"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672//"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
