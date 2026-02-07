import React, { useState } from 'react';
import { X, UploadCloud, Video, CheckCircle, ArrowRight } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onStartUpload }) => {
    const [file, setFile] = useState(null);
    const [cameraId, setCameraId] = useState("cam1");
    const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 10)); 
    const [startTime, setStartTime] = useState("09:00"); // Default 9 AM
    const [statusMsg, setStatusMsg] = useState("");

    if (!isOpen) return null;

    const handleUpload = (e) => {
        e.preventDefault();
        if (!file || !cameraId || !timestamp) {
            setStatusMsg("Please fill all fields.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('camera_id', cameraId);
        
        // Combine Date and Time into ISO string
        const fullTimestamp = `${timestamp}T${startTime}:00`;
        formData.append('start_timestamp', fullTimestamp);

        // Hand off to parent for background upload
        onStartUpload(formData, file.name);
        
        // Reset and close immediately
        setFile(null);
        setStatusMsg("");
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                {/* Colorful Gradient Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <h3>
                            <UploadCloud size={24} color="rgba(255,255,255,0.9)"/> 
                            Upload Video
                        </h3>
                        <p>Add new footage to your knowledge base</p>
                    </div>
                    <button onClick={onClose} className="btn-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleUpload} className="modal-body">
                    
                    {/* Camera Select */}
                    <div className="modal-form-group">
                        <label className="modal-label">Camera Source</label>
                        <div className="modal-input-wrapper">
                            <div className="modal-icon-left">
                                <Video size={18} />
                            </div>
                            <select 
                                value={cameraId} 
                                onChange={(e) => setCameraId(e.target.value)}
                                className="modal-input"
                                style={{cursor: 'pointer'}}
                            >
                                {["cam1", "cam2", "cam3", "cam4", "cam5"].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {/* Custom Arrow */}
                            <div className="modal-select-arrow">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time Selection */}
                    <div className="modal-form-group">
                        <label className="modal-label">Date & Start Time of Recording</label>
                        <div style={{display:'flex', gap:10}}>
                            <div style={{flex:1}}>
                                <input 
                                    type="date" 
                                    value={timestamp}
                                    onChange={(e) => setTimestamp(e.target.value)}
                                    className="modal-input"
                                    style={{colorScheme: 'dark'}}
                                />
                            </div>
                            <div style={{flex:1}}>
                                <input 
                                    type="time" 
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="modal-input"
                                    style={{colorScheme: 'dark'}}
                                />
                            </div>
                        </div>
                        <p style={{fontSize:'0.7rem', color:'#64748b', marginTop:4, marginLeft:4}}>
                            Select the date and EXACT clock time the video started.
                        </p>
                    </div>

                    {/* File Input */}
                    <div className="modal-form-group">
                        <label className="modal-label">Video File</label>
                        <div className="file-upload-zone">
                            <input 
                                type="file" 
                                accept="video/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="file-input-hidden"
                            />
                            <div className="file-info">
                                {file ? (
                                    <div className="file-selected-card">
                                        <div style={{background:'rgba(59, 130, 246, 0.2)', padding:10, borderRadius:8, color:'#60a5fa'}}>
                                            <Video size={24} />
                                        </div>
                                        <div style={{flex:1, overflow:'hidden'}}>
                                            <p style={{fontWeight:600, color:'#dbeafe', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{file.name}</p>
                                            <p style={{fontSize:'0.75rem', color:'#93c5fd', marginTop:2}}>Ready to upload</p>
                                        </div>
                                        <div style={{color:'#60a5fa'}}>
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{padding:20, background:'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius:'50%', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.3)', border:'1px solid #334155'}}>
                                            <UploadCloud size={32} color="#3b82f6"/>
                                        </div>
                                        <div style={{textAlign:'center'}}>
                                            <p style={{fontSize:'1rem', fontWeight:600, color:'#e2e8f0', marginBottom:4}}>Click to browse video files</p>
                                            <p style={{fontSize:'0.75rem', color:'#64748b'}}>Supports MP4, WebM, Ogg (Max 100MB)</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {statusMsg && (
                        <div className={`status-msg ${statusMsg.includes("Success") ? "success" : "error"}`}>
                            {statusMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{paddingTop: 8}}>
                        <button 
                            type="submit" 
                            className="btn-primary"
                        >
                            <span>Start Upload</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Inline Animation Style for Spin */}
            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default UploadModal;
