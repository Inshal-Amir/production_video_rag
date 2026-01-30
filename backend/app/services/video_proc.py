import cv2
import base64
import os
from datetime import datetime, timedelta
from moviepy import VideoFileClip

class VideoProcessor:
    @staticmethod
    def get_frame_base64(image):
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')

    def parse_custom_ts(self, ts_str):
        """Converts '12022006152036125' to a datetime object"""
        # Format: DD MM YYYY HH MM SS mmm
        dt_part = ts_str[:-3]
        ms_part = ts_str[-3:]
        dt = datetime.strptime(dt_part, "%d%m%Y%H%M%S")
        return dt.replace(microsecond=int(ms_part) * 1000)

    def format_custom_ts(self, dt_obj):
        """Converts datetime object back to '12022006152036125'"""
        # Format: DDMMYYYYHHMMSS
        base = dt_obj.strftime("%d%m%Y%H%M%S")
        # Add milliseconds (3 digits)
        ms = int(dt_obj.microsecond / 1000)
        return f"{base}{ms:03d}"

    def process_video(self, video_path, start_timestamp_str, interval=1):
        """
        Yields: (frame_id, timestamp_str, base64_image)
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        if fps == 0: return

        stride = int(fps * interval)
        current_frame = 0
        
        # Parse the start time provided by user
        start_dt = self.parse_custom_ts(start_timestamp_str)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            if current_frame % stride == 0:
                # Calculate time offset in seconds
                seconds_passed = current_frame / fps
                
                # Calculate exact time of this frame
                frame_dt = start_dt + timedelta(seconds=seconds_passed)
                frame_ts_str = self.format_custom_ts(frame_dt)
                
                # Create unique ID: video_name + timestamp
                video_name = os.path.basename(video_path)
                frame_id = f"{video_name}_{frame_ts_str}"

                # Resize and Encode
                frame_resized = cv2.resize(frame, (640, 360))
                b64_img = self.get_frame_base64(frame_resized)
                
                yield {
                    "frame_id": frame_id,
                    "timestamp_str": frame_ts_str,
                    "image": b64_img
                }
                
            current_frame += 1
        cap.release()

    def create_clip(self, video_path, start_offset, output_path):
        """Creates a 4-second clip around the timestamp"""
        try:
            with VideoFileClip(video_path) as video:
                start = max(0, start_offset - 2)
                end = min(video.duration, start_offset + 2)
                
                if hasattr(video, 'subclipped'):
                    new_clip = video.subclipped(start, end)
                else:
                    new_clip = video.subclip(start, end)
                
                new_clip.write_videofile(output_path, codec="libx264", audio_codec="aac", preset="ultrafast", logger=None)
            return True
        except Exception as e:
            print(f"Error clipping: {e}")
            return False