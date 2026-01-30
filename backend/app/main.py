from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil

# Import Services
from app.core.config import settings
from app.services.llm_factory import get_llm_provider
from app.services.qdrant_store import QdrantService
from app.services.video_proc import VideoProcessor
from app.services.reranker import rerank_results
from app.models.api_models import SearchRequest

app = FastAPI(title=settings.PROJECT_NAME)

# CORS (Allow Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOUNT STATIC FILES ---
# This allows http://localhost:8000/static/videos/cam1.mp4 to work
# We mount the internal /app/data folder to the /static URL path
app.mount("/static", StaticFiles(directory="/app/data"), name="static")

# Initialize Services
llm = get_llm_provider()
qdrant = QdrantService()
processor = VideoProcessor()

@app.post("/api/upload")
async def upload_video(
    file: UploadFile = File(...),
    camera_id: str = Form(...),
    start_timestamp: str = Form(...) # Format: 12022006152036125
):
    # 1. Save File
    file_path = os.path.join(settings.VIDEO_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Process Frames
    frames_gen = processor.process_video(file_path, start_timestamp)
    
    indexed_count = 0
    for frame_data in frames_gen:
        # A. Vision Description
        description = llm.get_vision_description(frame_data['image'])
        
        # B. Create Embedding
        vector = llm.get_embedding(description)
        
        # C. Upload to Qdrant
        metadata = {
            "camera_id": camera_id,
            "video_id": file.filename,
            "timestamp_str": frame_data['timestamp_str'],
            "description": description,
            "video_path": file_path,
            "frame_id": frame_data['frame_id']
        }
        qdrant.upload_frame(vector, metadata)
        indexed_count += 1

    return {"status": "success", "frames_indexed": indexed_count}

@app.post("/api/search")
async def search_videos(request: SearchRequest):
    # 1. Check Intent
    intent = llm.check_intent(request.query)

    # 2. Handle Chat (No Search)
    if intent == "CHAT":
        reply = llm.get_general_response(request.query)
        return {
            "type": "chat",
            "message": reply,
            "results": []
        }

    # 3. Handle Search (Existing Logic)
    query_vector = llm.get_embedding(request.query)
    
    start_ts = qdrant.parse_custom_timestamp(request.start_time) if request.start_time else None
    end_ts = qdrant.parse_custom_timestamp(request.end_time) if request.end_time else None
    
    # Get Candidates from Qdrant
    candidates = qdrant.search(
        query_vector,
        camera_id=request.cameras[0] if request.cameras and "all" not in request.cameras else None,
        start_ts=start_ts,
        end_ts=end_ts,
        k=20
    )
    
    # Extract payloads for Reranking
    candidate_payloads = [hit.payload for hit in candidates]
    
    # Rerank to find Top 3
    final_results = rerank_results(request.query, candidate_payloads, top_k=3)
    
    # Inject Playable URLs
    for res in final_results:
        # Convert /app/data/videos/abc.mp4 -> /static/videos/abc.mp4
        filename = os.path.basename(res['video_path'])
        res['video_url'] = f"/static/videos/{filename}"

    # Return structured response
    count = len(final_results)
    return {
        "type": "search",
        "message": f"I found {count} clips matching your description." if count > 0 else "I looked through the footage but couldn't find anything.",
        "results": final_results
    }

@app.get("/api/clip/{video_filename}/{timestamp_str}")
async def get_clip(video_filename: str, timestamp_str: str):
    """
    Legacy endpoint. 
    In this version, we use the full video URL + Seek, so this returns a hint.
    """
    return {"message": "Use the video_url and seek to timestamp"}