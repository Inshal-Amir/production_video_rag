import React from 'react';
import { Loader, X, CheckCircle, AlertCircle, Video } from 'lucide-react';

const UploadProgress = ({ fileName, progress, status, onClose }) => {
    if (!status) return null;

    // Determine Status Colors & Icons
    let statusColor = "#3b82f6"; // Blue (Uploading)
    let StatusIcon = Loader;

    if (status === 'processing') {
        statusColor = "#f59e0b"; // Orange
        StatusIcon = Loader;
    } else if (status === 'success') {
        statusColor = "#10b981"; // Green
        StatusIcon = CheckCircle;
    } else if (status === 'error') {
        statusColor = "#ef4444"; // Red
        StatusIcon = AlertCircle;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 320,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animtion: 'fadeIn 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        background: `${statusColor}20`,
                        padding: 6,
                        borderRadius: 6,
                        color: statusColor
                    }}>
                        <Video size={16} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {fileName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {status === 'uploading' && 'Uploading video...'}
                            {status === 'processing' && 'Indexing frames...'}
                            {status === 'success' && 'Upload complete'}
                            {status === 'error' && 'Upload failed'}
                        </p>
                    </div>
                </div>
                {(status === 'success' || status === 'error') && (
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {(status === 'uploading' || status === 'processing') && (
                <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                        width: `${status === 'processing' ? 100 : progress}%`,
                        height: '100%',
                        background: status === 'processing' 
                            ? `repeating-linear-gradient(45deg, ${statusColor}, ${statusColor} 10px, #d97706 10px, #d97706 20px)` 
                            : statusColor,
                        transition: 'width 0.3s ease',
                        animation: status === 'processing' ? 'stripe-anim 1s linear infinite' : 'none'
                    }} />
                </div>
            )}
            
            {/* Styles for Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes stripe-anim { from { background-position: 0 0; } to { background-position: 40px 0; } }
            `}</style>
        </div>
    );
};

export default UploadProgress;
