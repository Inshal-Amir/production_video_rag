import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause } from 'lucide-react';

const VideoPlayer = ({ videoUrl, timestamp, isActive }) => {
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    // Convert sortable timestamp (float) back to seconds if needed
    // Assuming backend returns timestamp_sortable or we parse timestamp_str
    // For this prototype, let's assume 'timestamp' passed here is a float (seconds offset) 
    // If your backend only returns the string '12022006...', we need to calculate offset. 
    // BUT per our last backend fix, we are seeking simply.
    // Let's assume for this specific component, we pass the 'seconds' to seek to.
    
    // Auto-seek when the video loads or becomes active
    useEffect(() => {
        if (isActive && playerRef.current) {
            // Seek to 2 seconds before the event for context
            playerRef.current.seekTo(Math.max(0, timestamp - 2), 'seconds');
            setPlaying(true);
        } else {
            setPlaying(false);
        }
    }, [isActive, timestamp]);

    return (
        <div className="video-wrapper relative rounded-lg overflow-hidden bg-black aspect-video group">
            <ReactPlayer
                ref={playerRef}
                url={`http://localhost:8000${videoUrl}`} // Append backend host
                width="100%"
                height="100%"
                playing={playing}
                controls={true}
                onStart={() => playerRef.current.seekTo(Math.max(0, timestamp - 2))}
            />
            
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all cursor-pointer"
                     onClick={() => setPlaying(true)}>
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;