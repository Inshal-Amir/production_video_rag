import React, { useState } from 'react';
import VideoGrid from './VideoGrid';
import { Bot, User, Table, FileText, CheckCircle, XCircle } from 'lucide-react';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    const hasResults = message.results && message.results.length > 0;

    // State to toggle between 'text' (default) and 'table'
    const [viewMode, setViewMode] = useState('text');

    return (
        <div className={`message-row ${isUser ? 'user' : 'bot'}`}>
            {/* Avatar */}
            <div className={`avatar ${isUser ? 'user' : 'bot'}`}>
                {isUser ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Content Bubble */}
            <div className="message-content" style={{ maxWidth: '85%', width: '100%' }}>

                {/* 1. Toggle Switch (Only for Bot messages with results) */}
                {!isUser && hasResults && (
                    <div className="view-toggle-container">
                        <button
                            className={`toggle-btn ${viewMode === 'text' ? 'active' : ''}`}
                            onClick={() => setViewMode('text')}
                        >
                            <FileText size={14} />
                            <span>Summary</span>
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Table size={14} />
                            <span>Tabular Data</span>
                        </button>
                    </div>
                )}

                {/* 2. Text View (Original Paragraph + Grid) */}
                {viewMode === 'text' && (
                    <>
                        {message.text && (
                            <div className={`bubble ${isUser ? 'user' : 'bot'}`}>
                                {message.text}
                            </div>
                        )}
                        {hasResults && (
                            <div style={{ marginTop: 15 }}>
                                <VideoGrid results={message.results} />
                            </div>
                        )}
                    </>
                )}

                {/* 3. Table View (New functionality) */}
                {viewMode === 'table' && hasResults && (
                    <div className="bubble bot table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Found?</th>
                                    <th style={{ width: '120px' }}>Timestamp</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {message.results.map((result, idx) => {
                                    // Logic for Yes/No based on score
                                    const isMatch = (result.score || 0) > 0.4; // Threshold example

                                    return (
                                        <tr key={idx}>
                                            <td className="text-center">
                                                {isMatch ? (
                                                    <span className="badge-yes"><CheckCircle size={12} /> Yes</span>
                                                ) : (
                                                    <span className="badge-no"><XCircle size={12} /> No</span>
                                                )}
                                            </td>
                                            <td className="font-mono">
                                                {result.display_time || "00:00:00"}
                                            </td>
                                            <td className="text-desc">
                                                {/* Use description if available, otherwise generic based on query */}
                                                {result.description || result.text || `Event detected on ${result.camera_id}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;