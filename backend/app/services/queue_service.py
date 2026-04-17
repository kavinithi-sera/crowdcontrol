import asyncio
import random
import json
from collections import deque
from datetime import datetime, timezone
from fastapi import WebSocket
from typing import List, Dict

# Connection Manager for Websockets
class QueueConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass


class QueueService:
    def __init__(self):
        self.manager = QueueConnectionManager()
        self.queues = [
            {"id": "F1", "name": "North Food Court", "type": "food", "current_queue_length": 12, "service_rate_per_min": 5.0, "predicted_wait_minutes": 2.4, "historical_avg_wait": 4.5},
            {"id": "F2", "name": "South Food Court", "type": "food", "current_queue_length": 35, "service_rate_per_min": 6.0, "predicted_wait_minutes": 7.0, "historical_avg_wait": 8.0},
            {"id": "F3", "name": "VIP Lounge Dining", "type": "food", "current_queue_length": 4, "service_rate_per_min": 3.0, "predicted_wait_minutes": 1.5, "historical_avg_wait": 2.5},
            {"id": "M1", "name": "Main Merch Store", "type": "merch", "current_queue_length": 45, "service_rate_per_min": 8.0, "predicted_wait_minutes": 6.5, "historical_avg_wait": 9.0},
            {"id": "M2", "name": "East Pop-up Store", "type": "merch", "current_queue_length": 15, "service_rate_per_min": 4.0, "predicted_wait_minutes": 4.0, "historical_avg_wait": 3.5},
            {"id": "R1", "name": "West Restrooms", "type": "restroom", "current_queue_length": 8, "service_rate_per_min": 15.0, "predicted_wait_minutes": 0.8, "historical_avg_wait": 1.2},
            {"id": "R2", "name": "East Restrooms", "type": "restroom", "current_queue_length": 25, "service_rate_per_min": 12.0, "predicted_wait_minutes": 3.0, "historical_avg_wait": 2.5},
            {"id": "MED1", "name": "Primary Medical Bay", "type": "medical", "current_queue_length": 1, "service_rate_per_min": 1.0, "predicted_wait_minutes": 1.5, "historical_avg_wait": 5.0},
        ]
        
        # Keep 10 minute history for sparklines (assume 1 update every 5 seconds = 12 updates/min = 120 total)
        self.history = {q["id"]: deque([q["predicted_wait_minutes"]]*120, maxlen=120) for q in self.queues}

    def predict_wait_time(self, queue_length: int, service_rate: float, time_of_day: str, crowd_trend: str) -> float:
        """
        Calculates wait using M/M/1 queue model: wait = queue_length / (service_rate - arrival_rate)
        """
        # Estimate arrival rate based on trend
        base_arrival = service_rate * 0.7  # Base assumption: system is stable but busy
        
        if crowd_trend == "increasing":
            base_arrival = service_rate * 0.95
        elif crowd_trend == "decreasing":
            base_arrival = service_rate * 0.4
            
        # Ensure service_rate > arrival_rate to prevent negative or infinite wait
        effective_processing_rate = max(0.1, service_rate - base_arrival)
        
        wait = queue_length / effective_processing_rate
        return round(wait, 1)

    def get_best_alternative(self, service_type: str) -> dict:
        """Returns the shortest queue among same-type service points"""
        filtered = [q for q in self.queues if q["type"] == service_type]
        if not filtered:
            return None
        return min(filtered, key=lambda x: x["predicted_wait_minutes"])

    def _simulate_changes(self):
        """Randomly inject noise to update queues for the real-time websocket"""
        for q in self.queues:
            # Fluctuate queue length randomly
            change = random.randint(-3, 3)
            q["current_queue_length"] = max(0, min(150, q["current_queue_length"] + change))
            
            # Simple trend simulation based on random choice
            trend = random.choice(["increasing", "decreasing", "stable"])
            
            # Update prediction
            q["predicted_wait_minutes"] = self.predict_wait_time(
                q["current_queue_length"], 
                q["service_rate_per_min"], 
                "evening", 
                trend
            )
            # Push to history
            self.history[q["id"]].append(q["predicted_wait_minutes"])
            
    def get_all_queues_with_history(self):
        """Returns active queues combined with sparkline history"""
        result = []
        for q in self.queues:
            # Make a copy for safe sending
            item = q.copy()
            item["history"] = list(self.history[q["id"]])
            
            # Sub-sampled history for smaller payload if necessary, but 120 ints is tiny
            # For recharts, they often need objects like { time: '..', value: 1.2 }
            # Let's map it
            item["history_data"] = [{"value": val} for val in item["history"]]
            
            # Determine trend direction (last vs 10 readings ago)
            history_list = item["history"]
            if len(history_list) >= 10:
                recent_avg = sum(history_list[-3:]) / 3
                past_avg = sum(history_list[-10:-7]) / 3
                if recent_avg > past_avg + 0.5:
                    item["trend_direction"] = "increasing"
                elif recent_avg < past_avg - 0.5:
                    item["trend_direction"] = "decreasing"
                else:
                    item["trend_direction"] = "stable"
            else:
                item["trend_direction"] = "stable"
                
            result.append(item)
            
        return result

    async def broadcast_task(self):
        while True:
            self._simulate_changes()
            data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "queues": self.get_all_queues_with_history()
            }
            await self.manager.broadcast(json.dumps(data))
            await asyncio.sleep(5)

queue_service = QueueService()
