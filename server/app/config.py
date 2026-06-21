from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "FastAPI")
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret-change-me")

    # JWT settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "supersecret-change-me"))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

settings = Settings()