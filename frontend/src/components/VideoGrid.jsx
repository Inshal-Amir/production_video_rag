import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { Clock, Video } from 'lucide-react';

const VideoGrid = ({ results }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    if (!results || results.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <p>No results found. Try adjusting your search.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, idx) => (
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
                            timestamp={result.timestamp_sortable} 
                            isActive={activeIndex === idx}
                        />
                    </div>

                    {/* Metadata Area */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                <Video size={12} />
                                {result.camera_id}
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                                <Clock size={12} />
                                {new Date(result.timestamp_sortable * 1000).toLocaleString()}
                            </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm line-clamp-3">
                            {result.description}
                        </p>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                            <span>Score: {(result.score * 100).toFixed(1)}%</span>
                            <span className="font-mono">{result.video_id}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VideoGrid;