import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import List

# Setup Gemini (using the existing initialized key from env if available, or relying on main setup)
# For simplicity, we just configure it here again or assume it's configured.
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

class FanProfile(BaseModel):
    current_zone: str
    dietary_preferences: List[str]
    interests: List[str]
    time_available_minutes: int

class RecommendationService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

    def get_recommendations(self, fan_profile: dict, venue_context: dict) -> list:
        """
        Calls Gemini to get personalized recommendations based on fan profile and venue context.
        """
        prompt = f"""
        You are 'FanPulse', an intelligent AI assistant for a large venue/stadium. Your job is to provide 
        highly personalized recommendations to fans based on their profile and the current venue context.

        FAN PROFILE:
        - Current Zone: {fan_profile.get('current_zone', 'Unknown')}
        - Dietary Preferences: {', '.join(fan_profile.get('dietary_preferences', ['None']))}
        - Mood / Interests: {', '.join(fan_profile.get('interests', ['Anything']))}
        - Time Available: {fan_profile.get('time_available_minutes', 60)} minutes

        VENUE CONTEXT:
        - Crowd State & Queues: {json.dumps(venue_context.get('crowd_queues', {}))}
        - Special Offers: {json.dumps(venue_context.get('offers', []))}
        - Event Stage: {venue_context.get('event_stage', 'Pre-game')}

        TASK:
        Generate exactly 5 distinct, highly appealing and practical recommendations for the user. 
        Account for their available time (don't recommend something that takes longer than they have).
        Match their dietary needs strictly if they are looking for food.

        OUTPUT FORMAT:
        Return a valid JSON array of exactly 5 objects. Each object MUST have this schema:
        {{
            "type": "Food" | "Merch" | "Experience" | "Restroom",
            "title": "Short catchy title",
            "description": "1 sentence description of what it is",
            "zone": "Zone ID (e.g. A, B, K)",
            "estimated_wait": integer (minutes),
            "why_recommended": "Short explanation of why this fits their profile perfectly right now",
            "urgency_label": "Act Now" | "Good Time" | "Anytime"
        }}
        
        Assign urgency labels intelligently based on queue times and event stage (e.g., if a queue is unusually short before a game starts, it's 'Act Now').
        """

        try:
            response = self.model.generate_content(prompt)
            data = json.loads(response.text)
            
            # Since Gemini sometimes wraps the array inside an object depending on interpretation, 
            # ensure we return a list.
            if isinstance(data, dict):
                # Try to find the list inside
                for key, val in data.items():
                    if isinstance(val, list):
                        return val
                return [data] # Fallback
            elif isinstance(data, list):
                return data
            else:
                raise ValueError("Expected JSON array from Gemini")
                
        except Exception as e:
            print(f"Error calling Gemini for recommendations: {e}")
            # Fallback recommendations if API fails
            return [
                {
                    "type": "Food",
                    "title": "Classic Hot Dog Stand",
                    "description": "Standard stadium fare with minimal wait.",
                    "zone": "K",
                    "estimated_wait": 5,
                    "why_recommended": "You have limited time, this is the quickest bite near you.",
                    "urgency_label": "Anytime"
                },
                {
                    "type": "Merch",
                    "title": "Pop-up Store (No Line)",
                    "description": "Grab a jersey before the rush.",
                    "zone": "M2",
                    "estimated_wait": 2,
                    "why_recommended": "The main store has a huge line. This secret spot is empty!",
                    "urgency_label": "Act Now"
                }
            ]

recommendation_service = RecommendationService()
