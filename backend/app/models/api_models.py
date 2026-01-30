from pydantic import BaseModel
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str
    cameras: List[str] = ["all"]  # e.g., ["cam1"] or ["all"]
    start_time: Optional[str] = None # Custom format string
    end_time: Optional[str] = None