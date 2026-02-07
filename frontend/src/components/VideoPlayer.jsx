import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause } from 'lucide-react';

const VideoPlayer = ({ videoUrl, timestamp = 0, isActive }) => {
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    // Detect if this is a generated clip or full video
    // Clips are stored in /static/clips/ (local) OR /clips/ (supabase)
    const isClip = videoUrl?.includes('/static/clips/') || videoUrl?.includes('/clips/');

    // Auto-seek when the video loads or becomes active
    useEffect(() => {
        if (isActive && playerRef.current) {
            // Only seek for FULL videos. Clips should start naturally at 0.
            if (!isClip && typeof playerRef.current.seekTo === 'function') {
                const safeTime = Number.isFinite(timestamp) ? Math.max(0, timestamp - 2) : 0;
                playerRef.current.seekTo(safeTime, 'seconds');
            }
            setPlaying(true);
        } else if (!isActive) {
            setPlaying(false);
        }
    }, [isActive, timestamp, isClip]);

    // --- RENDER RAW VIDEO FOR CLIPS (Verified working via test_player.html) ---
    if (isClip) {
         const fullUrl = videoUrl?.startsWith('http') ? videoUrl : `http://localhost:8000${videoUrl}`;
         return (
            <div className="video-wrapper relative rounded-lg overflow-hidden bg-black aspect-video group">
                <video 
                    src={fullUrl}
                    className="w-full h-full object-contain"
                    controls
                    muted
                    playsInline
                    autoPlay={isActive} // Autoplay if active (hovered/selected)
                    loop
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    onError={(e) => {
                         console.error("[VideoPlayer RAW] Error:", e);
                         alert("Clip Error: " + e.target.error?.message);
                    }}
                />
            </div>
         );
    }

    // --- KEEP REACTPLAYER FOR FULL VIDEOS (Complex Seeking) ---
    return (
        <div className="video-wrapper relative rounded-lg overflow-hidden bg-black aspect-video group">
            <ReactPlayer
                ref={playerRef}
                url={videoUrl?.startsWith('http') ? videoUrl : `http://localhost:8000${videoUrl}`} // FORCE backend URL
                width="100%"
                height="100%"
                playing={playing}
                controls={true}
                muted={true} // Enable autoplay support
                playsinline={true} // Better mobile support
                onError={(e) => {
                    console.error("VideoPlayer Error:", e);
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onStart={() => {
                     // Only seek for FULL videos.
                     if (!isClip && playerRef.current && typeof playerRef.current.seekTo === 'function') {
                        const safeTime = Number.isFinite(timestamp) ? Math.max(0, timestamp - 2) : 0;
                        playerRef.current.seekTo(safeTime, 'seconds');
                     }
                }}
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