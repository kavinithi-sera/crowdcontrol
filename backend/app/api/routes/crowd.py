from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.services.crowd_service import crowd_service
from app.models.schemas import CrowdSnapshot, ZoneDetail

router = APIRouter()


@router.get("/api/crowd/snapshot", response_model=CrowdSnapshot)
async def get_crowd_snapshot():
    """Returns the current density snapshot for all zones"""
    return crowd_service.get_snapshot()


@router.get("/api/crowd/status")
async def get_crowd_status():
    """Lightweight status endpoint — returns zone densities and overall average."""
    snapshot = crowd_service.get_snapshot()
    return {
        "average_density": snapshot.average_density,
        "total_count": snapshot.total_count,
        "total_capacity": snapshot.total_capacity,
        "zones": [
            {
                "zone_id": z.zone_id,
                "name": z.name,
                "density_percent": z.density_percent,
                "trend": z.trend,
            }
            for z in snapshot.zones
        ],
    }


@router.get("/api/crowd/zone/{zone_id}", response_model=ZoneDetail)
async def get_zone_detail(zone_id: str):
    """Returns detailed info and history for a specific zone"""
    try:
        return crowd_service.get_zone_detail(zone_id.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.websocket("/ws/crowd")
async def websocket_crowd_endpoint(websocket: WebSocket):
    """WebSocket endpoint to stream live crowd density updates"""
    await crowd_service.manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        crowd_service.manager.disconnect(websocket)
