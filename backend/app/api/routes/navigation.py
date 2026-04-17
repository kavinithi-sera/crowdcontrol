from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json

from app.services.gemini_service import gemini_service
from app.services.crowd_service import crowd_service

router = APIRouter(prefix="/api/navigation", tags=["Navigation"])

class NavigationRequest(BaseModel):
    from_zone: str
    to_destination: str
    avoid_crowds: bool = False

DESTINATIONS = [
    {"name": "Gate 1 (North)", "zone": "A"},
    {"name": "Gate 2 (South)", "zone": "E"},
    {"name": "Gate 3 (East)", "zone": "C"},
    {"name": "Gate 4 (West)", "zone": "G"},
    {"name": "Food Court North", "zone": "K"},
    {"name": "Food Court South", "zone": "L"},
    {"name": "Medical Center", "zone": "F"},
    {"name": "Restrooms North", "zone": "H"},
    {"name": "Restrooms South", "zone": "D"}
]

@router.get("/destinations")
async def get_destinations():
    return {"destinations": DESTINATIONS}

@router.post("/navigate")
async def navigate(request: NavigationRequest):
    try:
        snapshot = crowd_service.get_snapshot()
        crowd_data = {
            z.zone_id: {"density": z.density_percent, "trend": z.trend}
            for z in snapshot.zones
        }
        
        advice = await gemini_service.get_navigation_advice(
            user_location=request.from_zone,
            destination=request.to_destination,
            crowd_data=crowd_data,
            avoid_crowds=request.avoid_crowds
        )
        
        # Parse JSON string returned from Gemini
        cleaned_advice = advice.strip()
        if cleaned_advice.startswith("```json"):
            cleaned_advice = cleaned_advice[7:-3].strip()
        elif cleaned_advice.startswith("```"):
            cleaned_advice = cleaned_advice[3:-3].strip()
            
        return json.loads(cleaned_advice)
        
    except Exception as e:
        print(f"Error in navigate route: {e}")
        # Return fallback response
        return {
            "route_steps": [
                {"instruction": f"Head from {request.from_zone} towards {request.to_destination}.", "zone": request.to_destination, "predicted_density_at_arrival": 50}
            ],
            "estimated_minutes": 5,
            "congestion_warning": False,
            "alternative_route": None,
            "crowd_prediction": [],
            "routing_assessment": {"bottlenecks": [], "flow_conflicts": "None detected"},
            "strategic_recommendations": []
        }
