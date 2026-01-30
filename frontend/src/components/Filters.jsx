import React, { useState } from 'react';
import { Calendar, Camera, Filter } from 'lucide-react';

const Filters = ({ onFilterChange }) => {
    const [selectedCams, setSelectedCams] = useState([]);
    const [startDate, setStartDate] = useState(""); // Stores YYYY-MM-DDTHH:MM
    
    const cameras = ["cam1", "cam2", "cam3", "cam4"];

    const toggleCamera = (cam) => {
        const updated = selectedCams.includes(cam)
            ? selectedCams.filter(c => c !== cam)
            : [...selectedCams, cam];
        
        setSelectedCams(updated);
        notifyParent(updated, startDate);
    };

    const handleDateChange = (e) => {
        setStartDate(e.target.value);
        notifyParent(selectedCams, e.target.value);
    };

    const notifyParent = (cams, date) => {
        // Convert ISO date (2025-01-01T12:00) to your custom format (DDMMYYYY...)
        // This is a simplified helper. For production, use date-fns.
        let formattedDate = null;
        if (date) {
            const d = new Date(date);
            // Simple formatter function to match backend requirement roughly
            // Ideally, use a library or precise string manipulation here
             // For now, passing raw string, Backend parse_custom_ts needs to be robust or this needs precise formatting
        }

        onFilterChange({
            cameras: cams,
            startTime: formattedDate // Pass null if empty
        });
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                <Filter size={20} />
                <h3>Search Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Selection */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Camera size={16} /> Cameras
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {cameras.map(cam => (
                            <button
                                key={cam}
                                onClick={() => toggleCamera(cam)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                    selectedCams.includes(cam)
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cam}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Selection */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar size={16} /> Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleDateChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Filters;