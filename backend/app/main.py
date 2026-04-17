import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import crowd
from app.services.crowd_service import crowd_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background simulation task
    task = asyncio.create_task(crowd_service.broadcast_task())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="CrowdControl API", lifespan=lifespan)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(crowd.router, tags=["CrowdLens"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CrowdControl API"}
