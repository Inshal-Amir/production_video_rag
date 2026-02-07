import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

export const searchVideos = async (query, filters) => {
    try {
        // Parse Sidebar filters
        let startDate = filters.startDate || null;
        let endDate = filters.endDate || null;
        let s_time = filters.startTime || null; // e.g. "00:10:00"
        let e_time = filters.endTime || null;   // e.g. "00:20:00"

        // Legacy cleanup if it was passed weirdly
        if (s_time && s_time.includes('T')) {
             s_time = s_time.split('T')[1];
        }
        if (e_time && e_time.includes('T')) {
             e_time = e_time.split('T')[1];
        }
        
        const payload = {
            query: query,
            cameras: filters.cameras.length > 0 ? filters.cameras : ["all"],
            start_date: startDate,
            end_date: endDate,
            start_time: s_time,
            end_time: e_time
        };
        
        const response = await apiClient.post('/search', payload);
        // CHANGE: Return the whole data object { type, message, results }
        return response.data; 
    } catch (error) {
        console.error("Search failed:", error);
        // Fallback error object
        return { type: 'chat', message: "Sorry, I lost connection to the server.", results: [] };
    }
};

// ... (keep uploadVideo the same)
// ... (keep uploadVideo the same)
export const uploadVideo = async (formData, onProgress) => {
    try {
        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};