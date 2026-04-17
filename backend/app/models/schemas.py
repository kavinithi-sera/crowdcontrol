# Pydantic models (schemas) for request and response validation
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime

class ZoneBase(BaseModel):
    zone_id: str
    name: str

class ZoneSnapshot(ZoneBase):
    capacity: int
    current_count: int
    density_percent: float
    trend: Literal["increasing", "decreasing", "stable"]
    timestamp: datetime

class ZoneDetail(ZoneSnapshot):
    history: List[ZoneSnapshot]

class CrowdSnapshot(BaseModel):
    timestamp: datetime
    total_capacity: int
    total_count: int
    average_density: float
    zones: List[ZoneSnapshot]
