from fastapi import FastAPI
from app.config import settings

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "message": "Hello World",
        "app_name": settings.APP_NAME
    }