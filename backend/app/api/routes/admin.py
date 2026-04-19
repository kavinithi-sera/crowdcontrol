"""
Admin API routes.

GET  /api/admin/overview  — full zone + queue snapshot for the dashboard
POST /api/admin/zones/{zone_id}/close   — mark a zone as closed
POST /api/admin/zones/{zone_id}/open    — re-open a closed zone
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from app.services.crowd_service import crowd_service
from app.services.queue_service  import queue_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# In-memory store for closed zones (zone_id -> bool)
_closed_zones: dict[str, bool] = {}


@router.get("/overview")
async def admin_overview():
    """Full venue snapshot for the staff dashboard."""
    snapshot = crowd_service.get_snapshot()
    queues   = queue_service.get_all_queues_with_history()

    zones_out = []
    alerts    = []

    for z in snapshot.zones:
        closed = _closed_zones.get(z.zone_id, False)
        zones_out.append({
            "zone_id":         z.zone_id,
            "name":            z.name,
            "capacity":        z.capacity,
            "current_count":   z.current_count,
            "density_percent": z.density_percent,
            "trend":           z.trend,
            "is_closed":       closed,
        })
        if z.density_percent >= 85 and not closed:
            alerts.append({
                "zone_id": z.zone_id,
                "name":    z.name,
                "density": z.density_percent,
                "message": f"Zone {z.zone_id} ({z.name}) is at {z.density_percent:.0f}% capacity — consider redirecting fans.",
                "severity": "critical" if z.density_percent >= 95 else "warning",
            })

    return {
        "zones":  zones_out,
        "queues": queues,
        "alerts": alerts,
        "summary": {
            "total_count":      snapshot.total_count,
            "total_capacity":   snapshot.total_capacity,
            "average_density":  snapshot.average_density,
            "closed_zones":     list(_closed_zones.keys()),
            "alert_count":      len(alerts),
        }
    }


@router.post("/zones/{zone_id}/close")
async def close_zone(zone_id: str):
    zone_id = zone_id.upper()
    if zone_id not in crowd_service.zones:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
    _closed_zones[zone_id] = True
    return {"zone_id": zone_id, "status": "closed"}


@router.post("/zones/{zone_id}/open")
async def open_zone(zone_id: str):
    zone_id = zone_id.upper()
    _closed_zones.pop(zone_id, None)
    return {"zone_id": zone_id, "status": "open"}


@router.get("/closed-zones")
async def get_closed_zones():
    return {"closed_zones": list(_closed_zones.keys())}
