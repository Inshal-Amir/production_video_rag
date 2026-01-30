import React from 'react';
import VideoGrid from './VideoGrid'; 
import { Bot, User } from 'lucide-react';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`message-row ${isUser ? 'user' : 'bot'}`}>
            {/* Avatar */}
            <div className={`avatar ${isUser ? 'user' : 'bot'}`}>
                {isUser ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Content Bubble */}
            <div className="message-content" style={{maxWidth: '85%'}}>
                {/* Text */}
                {message.text && (
                    <div className={`bubble ${isUser ? 'user' : 'bot'}`}>
                        {message.text}
                    </div>
                )}

                {/* Video Results Grid */}
                {message.results && message.results.length > 0 && (
                    <div style={{marginTop: 15}}>
                        <VideoGrid results={message.results} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;