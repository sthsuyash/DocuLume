import os
from fastapi import FastAPI
import uvicorn

# Routers
from routes import base, chat, ai

# Ensure the /pdf directory exists
os.makedirs("pdf", exist_ok=True)

app = FastAPI()

# Include the routers with the prefix
app.include_router(base.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1/pdf")
app.include_router(ai.router, prefix="/api/v1/ai")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
