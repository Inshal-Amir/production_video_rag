from pydantic import BaseModel
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str
    cameras: List[str] = ["all"]  # e.g., ["cam1"] or ["all"]
    start_date: Optional[str] = None # YYYY-MM-DD
    end_date: Optional[str] = None   # YYYY-MM-DD
    start_time: Optional[str] = None # HH:MM:SS (Clock time, e.g. "09:00:00")
    end_time: Optional[str] = None # HH:MM:SS (Clock time, e.g. "17:00:00")