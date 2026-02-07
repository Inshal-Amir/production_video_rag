from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
from datetime import datetime, timedelta

# Import Services
from app.core.config import settings
from app.services.llm_factory import get_llm_provider
from app.services.qdrant_store import QdrantService
from app.services.video_proc import VideoProcessor
# from app.services.reranker import rerank_results  <--- REMOVED IMPORT
from app.models.api_models import SearchRequest
from app.services.supabase_storage import SupabaseStorage

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(settings.DATA_DIR)), name="static")

llm = get_llm_provider()
qdrant = QdrantService()
processor = VideoProcessor()
supabase = SupabaseStorage()

@app.post("/api/upload")
async def upload_video(
    file: UploadFile = File(...),
    camera_id: str = Form(...),
    start_timestamp: str = Form(...) 
):
    # 1. Save locally temporarily for processing
    temp_dir = settings.DATA_DIR / "temp"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = temp_dir / file.filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Process Video (Extract frames & logic)
    frames_gen = processor.process_video(str(file_path), start_timestamp)
    
    indexed_count = 0
    batch_items = []
    
    # Parse start_timestamp to datetime
    try:
        if "T" in start_timestamp:
             video_start_dt = datetime.fromisoformat(start_timestamp)
        else:
             video_start_dt = datetime.fromisoformat(start_timestamp)
    except Exception as e:
        print(f"Error parsing start_timestamp {start_timestamp}: {e}")
        video_start_dt = datetime.now() # Fallback

    # 3. Upload Original to Supabase
    supabase_path = f"originals/{file.filename}"
    public_url = supabase.upload_file(str(file_path), supabase_path)
    print(f"Uploaded to Supabase: {public_url}")

    for frame_data in frames_gen:
        description = llm.get_vision_description(frame_data['image'])
        vector = llm.get_embedding(description)
        
        # Calculate Clock Time Seconds (0-86400)
        frame_offset = frame_data['relative_offset']
        frame_dt = video_start_dt + timedelta(seconds=frame_offset)
        clock_time_seconds = frame_dt.hour * 3600 + frame_dt.minute * 60 + frame_dt.second

        metadata = {
            "camera_id": camera_id,
            "video_id": file.filename,
            "timestamp_str": frame_data['timestamp_str'],
            "display_time": frame_data['timestamp_str'],
            "relative_offset": frame_data['relative_offset'],
            "clock_time_seconds": clock_time_seconds,
            "description": description,
            "video_path": supabase_path, # Store relative Supabase path
            "frame_id": frame_data['frame_id'],
            "video_url": public_url # Direct link for full video playback
        }
        batch_items.append((vector, metadata))
        indexed_count += 1

    # Upload all frames in one batch
    if batch_items:
        qdrant.upload_batch(batch_items)

    # 4. Cleanup Temp File
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"status": "success", "frames_indexed": indexed_count}

@app.post("/api/search")
async def search_videos(request: SearchRequest):
    # 1. Check Intent
    intent = llm.check_intent(request.query)

    if intent == "CHAT":
        reply = llm.get_general_response(request.query)
        return {
            "type": "chat",
            "message": reply,
            "results": []
        }

    # 2. Search Qdrant
    query_vector = llm.get_embedding(request.query)
    
    # --- Parse Date Filter ---
    date_range = None
    if request.start_date and request.end_date:
        try:
            dt_start = datetime.strptime(request.start_date, "%Y-%m-%d")
            dt_end = datetime.strptime(request.end_date, "%Y-%m-%d")
            
            # Filter from Start of Start Day to End of End Day
            # e.g. Jan 1 to Jan 1 -> Jan 1 00:00 to Jan 2 00:00
            # e.g. Jan 1 to Jan 3 -> Jan 1 00:00 to Jan 4 00:00
            dt_end_inclusive = dt_end + timedelta(days=1)
            
            date_range = (dt_start.timestamp(), dt_end_inclusive.timestamp())
        except ValueError:
            print(f"Invalid date format: {request.start_date} - {request.end_date}")

    # --- Parse Relative Time Filter ---
    def parse_seconds(t_str):
        if not t_str: return None
        try:
            # Expect HH:MM:SS
            parts = list(map(int, t_str.split(":")))
            if len(parts) == 3:
                return parts[0]*3600 + parts[1]*60 + parts[2]
            elif len(parts) == 2:
                return parts[0]*60 + parts[1]
        except Exception:
            pass
        return None
            
    start_rel = parse_seconds(request.start_time)
    end_rel = parse_seconds(request.end_time)
    
    relative_range = None
    if start_rel is not None or end_rel is not None:
        relative_range = (start_rel, end_rel)

    # Get Top 3 directly (No Reranking)
    candidates = qdrant.search(
        query_vector,
        camera_ids=request.cameras,  # Pass list directly
        date_range=date_range,
        relative_range=relative_range,
        k=3 
    )
    
    # Extract results and inject score & ID
    final_results = []
    for hit in candidates:
        res = hit.payload
        res['score'] = float(hit.score)
        res['id'] = str(hit.id)
        final_results.append(res)
    
    # Generate & Inject Trimmed Clips
    # CLIPS_DIR = settings.DATA_DIR / "clips"
    # os.makedirs(CLIPS_DIR, exist_ok=True)
    temp_dir = settings.DATA_DIR / "temp"
    os.makedirs(temp_dir, exist_ok=True)
    
    for res in final_results:
        # Debug
        print(f"DEBUG: Processing result {res.get('id')}")
        print(f"DEBUG: Original Path/URL: {res.get('video_path')}")
        print(f"DEBUG: Relative Offset: {res.get('relative_offset')}")

        # Unique clip name based on Point ID
        clip_filename = f"clip_{res['id']}.mp4"
        supabase_clip_path = f"clips/{clip_filename}"
        
        # 1. Check if clip already exists in Supabase
        # Optimistic check: Assume if we have a stored clip_url in metadata (future optimization), use it
        # For now, check existence or just rely on 'exists' check if efficient, or just blindly generate if we want to be safe.
        # Let's check existence first to save compute.
        # list() in supabase-py is a bit heavy, maybe we can construct the specific public URL and check HEAD?
        # Actually initializing Supabase check logic:
        
        # We can also just default to the public URL and let the frontend fail? No, that's bad UX.
        # Let's check with our storage service.
        
        # IF clip exists, generate Public URL and move on.
        # But `exists` usually requires listing. Let's try to just generate URL and assume it exists? 
        # No, query is dynamic.
        
        # Let's optimize: Check if we have processed this before locally? No, we are stateless.
        
        # If the video logic below fails, fallback to full video.
        
        # Determine correct clip timestamp (Relative vs Epoch)
        clip_time = res.get('relative_offset')
        
        if clip_time is None:
             # Legacy Fallback
             if res['timestamp_sortable'] < 100000:
                  clip_time = res['timestamp_sortable']
             else:
                  print(f"Skipping clip for {clip_filename}: timestamp too large.")
                  # Fallback to full video
                  if not res.get('video_url'):
                       res['video_url'] = supabase.get_public_url(res.get('video_path', ''))
                  res['timestamp_sortable'] = 0 
                  continue

        # Check if clip exists in Supabase
        # We will use the 'exists' helper which does a list. It might be slow if folder is huge.
        # TODO: Optimize by storing 'clip_generated' flag in Qdrant later.
        
        # If clip NOT in Supabase (or we want to ensure it exists):
        if not supabase.exists(supabase_clip_path):
            print(f"Generating clip: {clip_filename} at offset {clip_time}")
            
            # Need original video locally to clip
            original_path = res.get('video_path') # e.g. "originals/video.mp4"
            local_video_path = temp_dir / os.path.basename(original_path)
            
            # Download if not locally present in temp
            if not os.path.exists(local_video_path):
                print(f"Downloading original video: {original_path}")
                try:
                    supabase.download_file(original_path, str(local_video_path))
                except Exception as e:
                    print(f"Failed to download video: {e}")
                    # Fallback
                    res['video_url'] = supabase.get_public_url(original_path)
                    continue

            # Generate Clip Locally
            local_clip_path = temp_dir / clip_filename
            try:
                success = processor.create_clip(
                    str(local_video_path), 
                    clip_time, 
                    str(local_clip_path)
                )
                if success:
                    # Upload to Supabase
                    print(f"Uploading clip: {clip_filename}")
                    supabase.upload_file(str(local_clip_path), supabase_clip_path)
                    
                    # Cleanup Clip
                    os.remove(local_clip_path)
                else:
                    raise Exception("Clip generation failed")
            except Exception as e:
                print(f"Failed to create/upload clip: {e}")
                # Fallback
                res['video_url'] = supabase.get_public_url(original_path)
                continue
                
            # We treat the temp original video as a cache? Or delete?
            # Delete to save space for now.
            if os.path.exists(local_video_path):
                 os.remove(local_video_path)

        # Point to the Supabase Clip
        res['video_url'] = supabase.get_public_url(supabase_clip_path)
        
        # CRITICAL: Reset timestamp to 0 so Player starts from beginning of the CLIP
        res['timestamp_sortable'] = 0
        
        
        # --- Format Timestamp for AI & Display ---
        # User requested: "video timestamp" (e.g. 00:01:03)
        # UPDATE: User now wants CLOCK TIME if available
        try:
             clock_seconds = res.get('clock_time_seconds')
             if clock_seconds is not None:
                 # Format as HH:MM:SS (Clock Time)
                 c_hours = int(clock_seconds // 3600)
                 c_minutes = int((clock_seconds % 3600) // 60)
                 c_seconds = int(clock_seconds % 60)
                 formatted_time = f"{c_hours:02d}:{c_minutes:02d}:{c_seconds:02d}"
             else:
                 # Fallback to Relative Time
                 offset_seconds = int(res.get('relative_offset', 0))
                 hours = offset_seconds // 3600
                 minutes = (offset_seconds % 3600) // 60
                 seconds = offset_seconds % 60
                 formatted_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        except Exception as e:
             print(f"Error formatting time: {e}")
             formatted_time = "00:00:00"
        
        res['display_time'] = formatted_time
        
        # --- Format Date ---
        ts_str = res.get('timestamp_str', '')
        formatted_date = "Unknown Date"
        if len(ts_str) >= 8:
            try:
                # 15012026... -> 15/01/2026
                day = ts_str[0:2]
                month = ts_str[2:4]
                year = ts_str[4:8]
                dt = datetime(int(year), int(month), int(day))
                formatted_date = dt.strftime("%b %d, %Y") # Jan 15, 2026
            except:
                pass
        res['display_date'] = formatted_date

    count = len(final_results)
    
    # Generate AI Answer
    if count > 0:
        ai_message = llm.get_search_summary(request.query, final_results)
    else:
        ai_message = "I looked through the footage but couldn't find anything matching your description."

    return {
        "type": "search",
        "message": ai_message,
        "results": final_results
    }