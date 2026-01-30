import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

export const searchVideos = async (query, filters) => {
    try {
        const payload = {
            query: query,
            cameras: filters.cameras.length > 0 ? filters.cameras : ["all"],
            start_time: filters.startTime || null,
            end_time: filters.endTime || null
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
export const uploadVideo = async (formData) => {
    try {
        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};