import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import UploadModal from './components/UploadModal';
import UploadProgress from './components/UploadProgress';
import { searchVideos, uploadVideo } from './api/client';
import './App.css'; // This now loads our new beautiful styles

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am ready to search your video archives. Select a camera or ask me a question.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ cameras: [], startTime: null });
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    // Global Upload State
    const [uploadState, setUploadState] = useState({
        isUploading: false,
        progress: 0,
        status: null, // 'uploading', 'processing', 'success', 'error'
        fileName: '',
        message: ''
    });
    
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setLoading(true);

        try {
            // 1. Get Response (Chat OR Search)
            const response = await searchVideos(userText, filters);
            
            // 2. Add AI Message directly using backend text
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: response.message, // Use the smart message from Python
                results: response.results // Only exists if type='search'
            }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to the database." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartUpload = async (formData, fileName) => {
        setUploadState({
            isUploading: true,
            progress: 0,
            status: 'uploading',
            fileName: fileName,
            message: 'Starting upload...'
        });

        try {
            const res = await uploadVideo(formData, (percent) => {
                setUploadState(prev => ({
                    ...prev,
                    progress: percent,
                    status: percent === 100 ? 'processing' : 'uploading'
                }));
            });

            setUploadState(prev => ({
                ...prev,
                status: 'success',
                message: `Indexed ${res.frames_indexed || 0} frames.`
            }));

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                 setUploadState(prev => ({ ...prev, status: null }));
            }, 5000);

        } catch (error) {
            console.error("Upload error:", error);
             setUploadState(prev => ({
                ...prev,
                status: 'error',
                message: 'Upload failed.'
            }));
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar (Fixed Width) */}
            <Sidebar 
                onFilterChange={setFilters} 
                onClearChat={() => setMessages([])}
                onUploadClick={() => setShowUploadModal(true)}
            />

            {/* Main Chat Area (Flexible) */}
            <main className="main-chat">
                <div className="chat-history">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} />
                    ))}
                    
                    {loading && (
                        <div className="message-row bot">
                            <div className="avatar bot">...</div>
                            <div className="bubble bot" style={{fontStyle:'italic', color:'#64748b'}}>
                                Analyzing video frames...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="input-area">
                    <form onSubmit={handleSend} className="input-wrapper">
                        <input
                            type="text"
                            className="chat-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Describe the event (e.g. 'Red car turning left')..."
                            disabled={loading}
                        />
                        <button type="submit" className="send-btn" disabled={loading || !inputValue.trim()}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </main>

            {/* Modals */}
            {/* Modals & Overlays */}
            <UploadModal 
                isOpen={showUploadModal} 
                onClose={() => setShowUploadModal(false)}
                onStartUpload={handleStartUpload}
            />

            <UploadProgress
                fileName={uploadState.fileName}
                progress={uploadState.progress}
                status={uploadState.status}
                onClose={() => setUploadState(prev => ({ ...prev, status: null }))}
            />
        </div>
    );
}

export default App;