import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional

# Set up the Google Gemini API client
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

class RouteStep(BaseModel):
    instruction: str
    zone: str

class NavigationAdvice(BaseModel):
    route_steps: List[RouteStep]
    estimated_minutes: int
    congestion_warning: bool
    alternative_route: Optional[str] = None

class GeminiService:
    def __init__(self):
        # We can use gemini-1.5-flash for faster responses, or pro if we need better reasoning
        self.model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

    async def get_navigation_advice(self, user_location: str, destination: str, crowd_data: dict, avoid_crowds: bool = False) -> str:
        """
        Gets AI generated walking route with density predictions and strategic auditing.
        Returns a structured JSON string.
        """
        prompt = f"""
        You are an advanced AI Crowd Intelligence & Navigation Engine.
        
        INPUT DATA:
        - User Current Zone: {user_location}
        - Target Destination: {destination}
        - Current Crowd State (Density % and Trend): {json.dumps(crowd_data, indent=2)}
        - Optimization Mode: {'CONGESTION_AVOIDANCE' if avoid_crowds else 'EFFICIENCY_FIRST'}

        TASK 1: CROWD PREDICTION
        Analyze current trends and density to predict the state in the next 5-10 minutes. 
        Focus on how people move from high-density zones (like entry gates) to transition zones.

        TASK 2: AI ROUTING & ASSESSMENT
        Generate a high-detail walking route (at least 4-6 steps if possible). 
        Identify potential bottlenecks or "conflicts" (e.g., if two major routes intersect in a high-density zone).

        TASK 3: STRATEGIC RECOMMENDATIONS
        Provide actionable advice for venue staff to improve flow.

        OUTPUT REQUIREMENTS:
        Return a valid JSON object with the following structure:
        {{
            "route_steps": [
                {{
                    "instruction": "Detailed direction (e.g., 'Pass the North Fountain and head towards the blue signage')",
                    "zone": "Zone ID",
                    "predicted_density_at_arrival": 55
                }}
            ],
            "estimated_minutes": 8,
            "congestion_warning": true/false,
            "alternative_route": "Brief description of safety backup route",
            "crowd_prediction": [
                {{"zone": "Zone ID", "predicted_density": 65, "rationale": "Explaining the shift"}}
            ],
            "routing_assessment": {{
                "bottlenecks": ["List of problematic zones"],
                "flow_conflicts": "Description of any intersecting traffic issues"
            }},
            "strategic_recommendations": [
                {{"suggestion": "Actionable advice", "rationale": "Why this helps"}}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            fallback = {
                "route_steps": [
                    {"instruction": f"Head from {user_location} towards {destination} via main corridor.", "zone": user_location, "predicted_density_at_arrival": 50}
                ],
                "estimated_minutes": 10,
                "congestion_warning": False,
                "alternative_route": None,
                "crowd_prediction": [],
                "routing_assessment": {"bottlenecks": [], "flow_conflicts": "None detected"},
                "strategic_recommendations": []
            }
            return json.dumps(fallback)

gemini_service = GeminiService()
