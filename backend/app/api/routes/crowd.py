from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.services.crowd_service import crowd_service
from app.models.schemas import CrowdSnapshot, ZoneDetail

router = APIRouter()

@router.get("/api/crowd/snapshot", response_model=CrowdSnapshot)
async def get_crowd_snapshot():
    """Returns the current density snapshot for all zones"""
    return crowd_service.get_snapshot()

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
            # Keep connection alive and handle client disconnections
            await websocket.receive_text()
    except WebSocketDisconnect:
        crowd_service.manager.disconnect(websocket)
