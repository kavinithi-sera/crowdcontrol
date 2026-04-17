from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional
from app.services.queue_service import queue_service

router = APIRouter(prefix="/api/queues", tags=["QueueSense"])

@router.get("")
async def get_all_queues():
    """Returns all service points with current wait times and sparkline histories"""
    return {"queues": queue_service.get_all_queues_with_history()}

@router.get("/{service_type}")
async def get_queues_by_type(service_type: str):
    """Filtered by type (food/merch/restroom/medical)"""
    all_queues = queue_service.get_all_queues_with_history()
    filtered = [q for q in all_queues if q["type"] == service_type.lower()]
    return {"queues": filtered}

@router.post("/predict")
async def predict_queues(payload: dict):
    """
    Accepts crowd snapshot and returns 15-minute forecasts.
    Here we simulate applying the snapshot data to the prediction. 
    In reality, we would extract 'crowd_trend' per zone and calculate exact future metrics.
    """
    # For now, we adjust existing queues dynamically
    # and extrapolate roughly 15 minutes ahead.
    predictions = []
    for q in queue_service.queues:
        # Simplistic demonstration: Wait times increase 20% over 15 mins for testing
        future_wait = q["predicted_wait_minutes"] * 1.2
        predictions.append({
            "id": q["id"],
            "name": q["name"],
            "15m_forecast_wait": round(future_wait, 1)
        })
        
    return {"predictions": predictions}

@router.websocket("/ws")
async def websocket_queues(websocket: WebSocket):
    await queue_service.manager.connect(websocket)
    try:
        while True:
            # Keep connection open, broadcasts happen via background task
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        queue_service.manager.disconnect(websocket)
