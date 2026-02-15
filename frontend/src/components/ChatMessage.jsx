import React from 'react';
import VideoPlayer from './VideoPlayer';
import { Bot, User, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';

    // If it's a User message, just show the blue bubble
    if (isUser) {
        return (
            <div className="message-row user">
                <div className="avatar user"><User size={20} /></div>
                <div className="bubble user">
                    {message.text}
                </div>
            </div>
        );
    }

    // --- BOT MESSAGE LOGIC ---
    // Get Top 3 Results
    const topResults = message.results ? message.results.slice(0, 3) : [];

    return (
        <div className="message-row bot" style={{ alignItems: 'flex-start' }}>
            <div className="avatar bot"><Bot size={20} /></div>

            <div className="bot-response-container">

                {/* 1. TABLE SECTION (Only if there are results) */}
                {topResults.length > 0 && (
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '160px' }}>Video</th>
                                    <th style={{ width: '80px' }}>Found</th>
                                    <th style={{ width: '100px' }}>Timestamp</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topResults.map((result, idx) => {
                                    const isMatch = (result.score || 0) > 0.4;
                                    return (
                                        <tr key={idx}>
                                            {/* Video Column */}
                                            <td className="video-cell">
                                                <div className="table-video-wrapper">
                                                    <VideoPlayer
                                                        videoUrl={result.video_url}
                                                        timestamp={result.timestamp_sortable}
                                                        isActive={false} // No autoplay in table
                                                    />
                                                </div>
                                            </td>

                                            {/* Found Column */}
                                            <td style={{ textAlign: 'center' }}>
                                                {isMatch ? (
                                                    <span className="badge-yes"><CheckCircle size={12} /> Yes</span>
                                                ) : (
                                                    <span className="badge-no"><XCircle size={12} /> No</span>
                                                )}
                                            </td>

                                            {/* Timestamp Column */}
                                            <td className="font-mono" style={{ textAlign: 'center' }}>
                                                {result.display_time || "00:00:00"}
                                            </td>

                                            {/* Description Column */}
                                            <td className="desc-cell">
                                                {result.description || result.text || "No description available."}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 2. SUMMARY LABEL */}
                <div className="summary-label">
                    <FileText size={16} />
                    <span>SUMMARY</span>
                </div>

                {/* 3. SUMMARY TEXT BOX */}
                <div className="summary-box">
                    {message.text}
                </div>

            </div>
        </div>
    );
};

export default ChatMessage;