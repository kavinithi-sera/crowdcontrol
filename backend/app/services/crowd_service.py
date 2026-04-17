# Business logic for crowd density and heatmap processing
import asyncio
import random
import math
from datetime import datetime, timezone
from typing import Dict, List, Any
from collections import deque
from fastapi import WebSocket

from app.models.schemas import ZoneSnapshot, CrowdSnapshot, ZoneDetail

ZONE_NAMES = [
    "Section A (North Stand)", "Section B (North-East Stand)", 
    "Section C (East Stand)", "Section D (South-East Stand)",
    "Section E (South Stand)", "Section F (South-West Stand)",
    "Section G (West Stand)", "Section H (North-West Stand)",
    "Section I (Lower VIP)", "Section J (Upper VIP)",
    "Section K (Concourse North)", "Section L (Concourse South)"
]

class ConnectionManager:
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
            except Exception:
                pass

class CrowdService:
    def __init__(self):
        self.zones: Dict[str, dict] = {}
        self.history: Dict[str, deque] = {}
        self.manager = ConnectionManager()
        self.time_step = 0
        self._init_zones()
    
    def _init_zones(self):
        """Initialize 12 default zones for the stadium"""
        for i, name in enumerate(ZONE_NAMES):
            zone_id = chr(65 + i) # A, B, C... L
            capacity = random.randint(1000, 5000)
            self.zones[zone_id] = {
                "zone_id": zone_id,
                "name": name,
                "capacity": capacity,
                # Random starting phase for sine wave
                "phase": random.uniform(0, 2 * math.pi),
                "frequency": random.uniform(0.01, 0.05)
            }
            # Keep track of last 100 snapshots (5 mins at 3s intervals)
            self.history[zone_id] = deque(maxlen=100)
            
            # Initial population
            self._update_zone(zone_id)
            
    def _update_zone(self, zone_id: str):
        """Update a specific zone's count based on sinusoidal pattern + noise"""
        zone = self.zones[zone_id]
        
        # Simulate crowd flow with sine wave and noise
        base = zone["capacity"] * 0.5
        amplitude = zone["capacity"] * 0.4
        
        raw_count = base + amplitude * math.sin(self.time_step * zone["frequency"] + zone["phase"])
        noise = random.uniform(-zone["capacity"] * 0.05, zone["capacity"] * 0.05)
        
        new_count = int(max(0, min(zone["capacity"], raw_count + noise)))
        
        # Determine trend
        trend = "stable"
        if len(self.history[zone_id]) > 0:
            last_count = self.history[zone_id][-1].current_count
            diff = new_count - last_count
            if diff > zone["capacity"] * 0.01:
                trend = "increasing"
            elif diff < -zone["capacity"] * 0.01:
                trend = "decreasing"
                
        density = round((new_count / zone["capacity"]) * 100, 2)
        
        snapshot = ZoneSnapshot(
            zone_id=zone_id,
            name=zone["name"],
            capacity=zone["capacity"],
            current_count=new_count,
            density_percent=density,
            trend=trend,
            timestamp=datetime.now(timezone.utc)
        )
        
        self.history[zone_id].append(snapshot)
        return snapshot

    def update_all_zones(self) -> CrowdSnapshot:
        """Update all zones and return a snapshot of the current state"""
        self.time_step += 1
        current_zones = []
        total_capacity = 0
        total_count = 0
        
        for zone_id in self.zones:
            snapshot = self._update_zone(zone_id)
            current_zones.append(snapshot)
            total_capacity += snapshot.capacity
            total_count += snapshot.current_count
            
        avg_density = round((total_count / total_capacity) * 100, 2) if total_capacity > 0 else 0.0
            
        return CrowdSnapshot(
            timestamp=datetime.now(timezone.utc),
            total_capacity=total_capacity,
            total_count=total_count,
            average_density=avg_density,
            zones=current_zones
        )

    def get_snapshot(self) -> CrowdSnapshot:
        """Return the current layout of the stadium"""
        current_zones = [h[-1] for h in self.history.values() if h]
        total_capacity = sum(z.capacity for z in current_zones)
        total_count = sum(z.current_count for z in current_zones)
        avg_density = round((total_count / total_capacity) * 100, 2) if total_capacity > 0 else 0.0
        
        return CrowdSnapshot(
             timestamp=datetime.now(timezone.utc),
             total_capacity=total_capacity,
             total_count=total_count,
             average_density=avg_density,
             zones=current_zones
        )
        
    def get_zone_detail(self, zone_id: str) -> ZoneDetail:
        """Return detailed info for a single zone"""
        if zone_id not in self.history or not self.history[zone_id]:
            raise ValueError(f"Zone {zone_id} not found")
            
        current = self.history[zone_id][-1]
        
        return ZoneDetail(
           **current.model_dump(),
           history=list(self.history[zone_id])
        )

    async def broadcast_task(self):
        """Background task to simulate real-time updates and push to websockets"""
        while True:
            snapshot = self.update_all_zones()
            # Serialize model using model_dump_json for Pydantic v2
            await self.manager.broadcast(snapshot.model_dump_json())
            await asyncio.sleep(3)

# Global instance
crowd_service = CrowdService()
