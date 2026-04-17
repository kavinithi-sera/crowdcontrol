from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from app.services.recommendation_service import recommendation_service
from app.services.queue_service import queue_service
from app.services.crowd_service import crowd_service

router = APIRouter(prefix="/api/recommendations", tags=["FanPulse"])

class FanProfileRequest(BaseModel):
    current_zone: str
    dietary_preferences: List[str]
    interests: List[str]
    time_available_minutes: int

OFFERS = [
    {"title": "2-for-1 Beers", "zone": "South Food Court", "type": "Food", "expires_in_mins": 30},
    {"title": "15% off Home Jersey", "zone": "Main Store", "type": "Merch", "expires_in_mins": 60},
    {"title": "Free Popcorn with Large Drink", "zone": "All Concessions", "type": "Food", "expires_in_mins": 120}
]

@router.get("/offers")
async def get_offers():
    return {"offers": OFFERS}

@router.post("")
async def get_personalized_recommendations(profile: FanProfileRequest):
    # Assemble current venue context
    crowd_snapshot = crowd_service.get_snapshot()
    crowd_context = {z.zone_id: z.density_percent for z in crowd_snapshot.zones}
    
    # We could extract wait times from queue_service
    queues = queue_service.get_all_queues_with_history()
    queue_context = {q["id"]: q["predicted_wait_minutes"] for q in queues}
    
    venue_context = {
        "crowd_queues": queue_context,
        "zone_densities": crowd_context,
        "offers": OFFERS,
        "event_stage": "Halftime Approaching" # Simulated event stage
    }
    
    recommendations = recommendation_service.get_recommendations(
        fan_profile=profile.dict(),
        venue_context=venue_context
    )
    
    return {"recommendations": recommendations}
