import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import crowd, navigation, queue
from app.services.crowd_service import crowd_service
from app.services.queue_service import queue_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background simulation tasks
    crowd_task = asyncio.create_task(crowd_service.broadcast_task())
    queue_task = asyncio.create_task(queue_service.broadcast_task())
    yield
    # Shutdown
    crowd_task.cancel()
    queue_task.cancel()

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
app.include_router(navigation.router, tags=["Navigation"])
app.include_router(queue.router, tags=["QueueSense"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CrowdControl API"}

