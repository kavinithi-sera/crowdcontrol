import asyncio
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.api.routes import crowd, navigation, queue, recommendations
from app.api.routes import chat, admin
from app.services.crowd_service import crowd_service
from app.services.queue_service import queue_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("crowdcontrol")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CrowdControl API starting up...")
    crowd_task = asyncio.create_task(crowd_service.broadcast_task())
    queue_task = asyncio.create_task(queue_service.broadcast_task())
    yield
    logger.info("🛑 CrowdControl API shutting down...")
    crowd_task.cancel()
    queue_task.cancel()


app = FastAPI(
    title="CrowdControl API",
    description="Precision crowd intelligence and venue safety platform.",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(crowd.router,           tags=["CrowdLens"])
app.include_router(navigation.router,      tags=["PathFinder"])
app.include_router(queue.router,           tags=["QueueSense"])
app.include_router(recommendations.router, tags=["FanPulse"])
app.include_router(chat.router,            tags=["Chat"])
app.include_router(admin.router,           tags=["Admin"])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    snapshot = crowd_service.get_snapshot()
    return {
        "status": "ok",
        "zones_active": len(snapshot.zones),
        "average_density": snapshot.average_density,
        "total_count": snapshot.total_count,
    }


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
def read_root():
    return {"message": "Welcome to CrowdControl API", "docs": "/docs"}
