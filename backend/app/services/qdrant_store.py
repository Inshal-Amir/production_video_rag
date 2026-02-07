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
            api_key=settings.QDRANT_API_KEY, 
            timeout=300.0 # Increase timeout for cloud operations to 5 mins
        )
        # Removed hardcoded "video_frames" collection creation

    def _ensure_collection(self, collection_name):
        if not self.client.collection_exists(collection_name):
            print(f"Creating Qdrant collection: {collection_name}")
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=1536,
                    distance=models.Distance.COSINE
                )
            )
            # Create payload indexes for filtering
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name="timestamp_sortable",
                field_schema=models.PayloadSchemaType.FLOAT
            )
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name="relative_offset",
                field_schema=models.PayloadSchemaType.FLOAT
            )
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name="clock_time_seconds",
                field_schema=models.PayloadSchemaType.FLOAT
            )

    def parse_custom_timestamp(self, ts_str: str) -> float:
        try:
            # Try parsing user provided ISO format (YYYY-MM-DDTHH:MM:SS)
            if "T" in ts_str or "-" in ts_str:
                # Append seconds if missing (e.g. from type="datetime-local" without seconds)
                if len(ts_str.split(":") ) == 2:
                     ts_str += ":00"
                dt_object = datetime.fromisoformat(ts_str)
                return dt_object.timestamp()
            
            # Legacy ingestion format
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
        self.upload_batch([(vector, metadata)])

    def upload_batch(self, items):
        """
        items: List of (vector, metadata) tuples
        """
        if not items: return
        
        # Group by camera_id (collection)
        grouped = {}
        for vector, metadata in items:
            cam_id = metadata.get('camera_id', 'unknown_cam')
            if cam_id not in grouped: grouped[cam_id] = []
            grouped[cam_id].append((vector, metadata))
            
        # Upload per collection
        for cam_id, batch in grouped.items():
            self._ensure_collection(cam_id)
            points = []
            for vector, metadata in batch:
                sortable_ts = self.parse_custom_timestamp(metadata['timestamp_str'])
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, metadata['frame_id']))
                
                points.append(
                    models.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload={
                            "camera_id": metadata['camera_id'],
                            "video_id": metadata['video_id'],
                            "timestamp_str": metadata['timestamp_str'],
                            "timestamp_sortable": sortable_ts,
                            "relative_offset": metadata.get('relative_offset', 0.0),
                            "clock_time_seconds": metadata.get('clock_time_seconds', 0.0), # Store new field
                            "description": metadata['description'],
                            "video_path": metadata['video_path'],
                            "chunk_id": metadata['frame_id']
                        }
                    )
                )
            
            try:
                self.client.upsert(
                    collection_name=cam_id,
                    points=points
                )
                print(f"Batch indexed {len(points)} frames into {cam_id}")
            except Exception as e:
                print(f"Error indexing batch to {cam_id}: {e}")

    def search(self, query_vector, camera_ids=None, date_range=None, relative_range=None, k=20):
        # Default to all known cameras if not specified or "all"
        target_cameras = camera_ids
        if not target_cameras or "all" in target_cameras:
            target_cameras = ["cam1", "cam2", "cam3", "cam4", "cam5"]
            
        all_results = []
        
        # Build Filters
        filters = []
        
        # 1. Date Filter (Absolute Timestamp Range for the day)
        if date_range:
            start_ts, end_ts = date_range
            ts_filter = {}
            if start_ts is not None: ts_filter["gte"] = start_ts
            if end_ts is not None: ts_filter["lte"] = end_ts
            if ts_filter:
                filters.append(models.FieldCondition(key="timestamp_sortable", range=models.Range(**ts_filter)))

        # 2. Time Filter (Relative Offset in seconds)
        if relative_range:
            start_rel, end_rel = relative_range
            rel_filter = {}
            if start_rel is not None: rel_filter["gte"] = start_rel
            if end_rel is not None: rel_filter["lte"] = end_rel
            if rel_filter:
                # Decide if this is Clock Time or Relative Time based on magnitude? 
                # Actually, `relative_range` argument comes from SearchRequest `start_time` / `end_time`.
                # If the user provides "09:00:00", it is parsed as 32400 seconds.
                # If the user provides "00:00:10" (relative), it is parsed as 10 seconds.
                # The prompt says "shift to clock time", so we assume these inputs are NOW clock time.
                # We should filter on `clock_time_seconds`.
                
                filters.append(models.FieldCondition(key="clock_time_seconds", range=models.Range(**rel_filter)))
        
        query_filter = models.Filter(must=filters) if filters else None

        # Scatter-Gather Search
        for cam_id in target_cameras:
            try:
                if not self.client.collection_exists(cam_id):
                    continue
                
                response = self.client.query_points(
                    collection_name=cam_id,
                    query=query_vector,
                    query_filter=query_filter,
                    limit=k 
                )
                results = response.points
                all_results.extend(results)
                
            except Exception as e:
                print(f"Error searching collection {cam_id}: {e}")
        
        # Sort aggregated results by score (descending)
        all_results.sort(key=lambda x: x.score, reverse=True)
        
        # --- Deduplication Logic ---
        # Goal: If we have multiple high-scoring frames from the same event (e.g., t=10s, t=11s),
        # keep only the highest scoring one to provide variety.
        final_results = []
        seen_events = {} # Key: video_id, Value: List[timestamp]
        
        TIME_THRESHOLD = 5.0 # Seconds. If within this range, consider it the same event.
        
        for hit in all_results:
            vid = hit.payload.get('video_id', 'unknown')
            ts = hit.payload.get('relative_offset', 0.0)
            
            is_duplicate = False
            if vid in seen_events:
                for seen_ts in seen_events[vid]:
                    if abs(ts - seen_ts) < TIME_THRESHOLD:
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                final_results.append(hit)
                if vid not in seen_events:
                    seen_events[vid] = []
                seen_events[vid].append(ts)
                
            if len(final_results) >= k:
                break
        
        return final_results