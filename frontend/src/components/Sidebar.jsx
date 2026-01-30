import React, { useState, useEffect } from 'react';
import { Camera, Calendar, UploadCloud, Trash2, Video } from 'lucide-react';

const Sidebar = ({ onFilterChange, onClearChat, onUploadClick }) => {
    const [selectedCams, setSelectedCams] = useState([]);
    const [startDate, setStartDate] = useState("");
    
    const cameras = ["cam1", "cam2", "cam3", "cam4", "cam5"];

    const toggleCamera = (cam) => {
        const updated = selectedCams.includes(cam)
            ? selectedCams.filter(c => c !== cam)
            : [...selectedCams, cam];
        setSelectedCams(updated);
    };

    useEffect(() => {
        onFilterChange({ cameras: selectedCams, startTime: startDate });
    }, [selectedCams, startDate, onFilterChange]);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Video size={24} color="#3b82f6" />
                <span>VideoRAG</span>
            </div>

            <div className="sidebar-content">
                {/* Cameras */}
                <div className="filter-section">
                    <label className="filter-label">
                        <Camera size={14} style={{display:'inline', marginRight:6}}/>
                        Cameras
                    </label>
                    <div className="camera-grid">
                        {cameras.map(cam => (
                            <button
                                key={cam}
                                onClick={() => toggleCamera(cam)}
                                className={`camera-btn ${selectedCams.includes(cam) ? 'active' : ''}`}
                            >
                                {cam}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="filter-section">
                    <label className="filter-label">
                        <Calendar size={14} style={{display:'inline', marginRight:6}}/>
                        From Date
                    </label>
                    <input
                        type="datetime-local"
                        className="date-input"
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <button className="upload-btn" onClick={onUploadClick}>
                    <UploadCloud size={18} />
                    Upload Video
                </button>
            </div>

            <div style={{padding: 20, borderTop: '1px solid #1e293b'}}>
                <button 
                    onClick={onClearChat}
                    style={{background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex', gap:8, fontSize:'0.9rem'}}
                >
                    <Trash2 size={16} /> Clear Chat
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;