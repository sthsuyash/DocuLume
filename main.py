import os
import shutil
from fastapi import FastAPI
import uvicorn

from routes import base, chat, ai

CHROMA_PATH = "chroma"
DATA_PATH = "pdf"

if os.path.exists(DATA_PATH):
    shutil.rmtree(DATA_PATH)
if os.path.exists(CHROMA_PATH):
    shutil.rmtree(CHROMA_PATH)

os.makedirs(DATA_PATH, exist_ok=True)

app = FastAPI()

app.include_router(base.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1/pdf")
app.include_router(ai.router, prefix="/api/v1/ai")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
