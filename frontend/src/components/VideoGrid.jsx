import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { Clock, Video } from 'lucide-react';

const VideoGrid = ({ results }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    // Filter valid results. 
    // allow clips (which start at 0) OR full videos with valid timestamps
    // allow matches that are local clips OR supabase clips OR have valid timestamps
    const safeResults = results ? results.filter(r => r && r.video_url && (
        r.video_url.includes('/static/clips/') || 
        r.video_url.includes('/clips/') || 
        Number.isFinite(r.timestamp_sortable)
    )) : [];

    if (safeResults.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <p>No valid video results found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeResults.map((result, idx) => (
                <div 
                    key={idx} 
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden"
                    onMouseEnter={() => setActiveIndex(idx)}
                >
                    {/* Video Area */}
                    <div className="bg-gray-900">
                        <VideoPlayer 
                            videoUrl={result.video_url} 
                            // We use timestamp_sortable (seconds) for seeking
                            // If backend sends '12022006..', we rely on that parsing logic
                            // FORCE 0 if it's a clip to prevent out-of-bounds seeking
                            timestamp={(result.video_url?.includes('/static/clips/') || result.video_url?.includes('/clips/')) ? 0 : result.timestamp_sortable} 
                            isActive={activeIndex === idx}
                        />
                    </div>

                    {/* Metadata Area */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium w-fit mb-2">
                                    <Video size={12} />
                                    {result.camera_id}
                                    <span style={{opacity:0.5, margin:'0 4px'}}>|</span>
                                    {result.display_date || "Unknown Date"}
                                </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                                <Clock size={12} />
                                {result.display_time || "00:00:00"}
                            </span>
                        </div>
                        
                        {/* Description Removed as per user request */}
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                            <span>Score: {((result.score || 0) * 100).toFixed(1)}%</span>
                            <span className="font-mono">{result.video_id}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VideoGrid;