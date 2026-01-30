import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
from datetime import datetime
from app.core.config import settings  # Import settings

class QdrantService:
    def __init__(self):
        # --- NEW: Use Config & API Key ---
        print(f"Connecting to Qdrant at: {settings.QDRANT_URL}")
        
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY, # This handles the Cloud Authentication
        )
        self.collection_name = "video_frames"
        
        # Check connection and create collection
        if not self.client.collection_exists(self.collection_name):
            print(f"Creating Qdrant collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=1536,
                    distance=models.Distance.COSINE
                )
            )

    # ... (Keep the rest of the functions: parse_custom_timestamp, upload_frame, search EXACTLY the same)
    def parse_custom_timestamp(self, ts_str: str) -> float:
        try:
            if len(ts_str) == 17:
                dt_part = ts_str[:-3]
                ms_part = ts_str[-3:]
                dt_object = datetime.strptime(dt_part, "%d%m%Y%H%M%S")
                dt_object = dt_object.replace(microsecond=int(ms_part) * 1000)
                return dt_object.timestamp()
            return 0.0
        except Exception as e:
            print(f"Error parsing timestamp {ts_str}: {e}")
            return 0.0

    def upload_frame(self, vector, metadata: dict):
        sortable_ts = self.parse_custom_timestamp(metadata['timestamp_str'])
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, metadata['frame_id']))
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "camera_id": metadata['camera_id'],
                        "video_id": metadata['video_id'],
                        "timestamp_str": metadata['timestamp_str'],
                        "timestamp_sortable": sortable_ts,
                        "description": metadata['description'],
                        "video_path": metadata['video_path'],
                        "original_frame_id": metadata['frame_id']
                    }
                )
            ]
        )
        print(f"Indexed frame: {metadata['frame_id']} as UUID: {point_id}")

    def search(self, query_vector, camera_id=None, start_ts=None, end_ts=None, k=20):
        filters = []
        if camera_id and camera_id.lower() != "all":
            filters.append(models.FieldCondition(key="camera_id", match=models.MatchValue(value=camera_id)))
        
        if start_ts is not None or end_ts is not None:
            filters.append(models.FieldCondition(key="timestamp_sortable", range=models.Range(gte=start_ts, lte=end_ts)))

        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=models.Filter(must=filters) if filters else None,
            limit=k
        )