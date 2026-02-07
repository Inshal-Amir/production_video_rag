import React, { useState, useEffect } from 'react';
import { Camera, Calendar, UploadCloud, Trash2, Video, Clock } from 'lucide-react';

const Sidebar = ({ onFilterChange, onClearChat, onUploadClick }) => {
    // --- State: Toggle Checkboxes ---
    // --- State: Toggle Checkboxes ---
    const [enableCamFilter, setEnableCamFilter] = useState(false);
    const [enableDateFilter, setEnableDateFilter] = useState(false);
    const [enableTimeFilter, setEnableTimeFilter] = useState(false);

    // --- State: Filter Values ---
    const [selectedCams, setSelectedCams] = useState([]);
    
    // Split Date & Time State
    const [startDateValue, setStartDateValue] = useState("");
    const [endDateValue, setEndDateValue] = useState("");      
    const [startTimeValue, setStartTimeValue] = useState(""); 
    const [endTimeValue, setEndTimeValue] = useState("");
    const [dateWarning, setDateWarning] = useState(""); // UI warning message
    
    const cameras = ["cam1", "cam2", "cam3", "cam4", "cam5"];

    // --- Effects: Notify Parent on Changes ---
    // --- Effects: Notify Parent on Changes ---
    useEffect(() => {
        notifyParent();
    }, [enableCamFilter, enableDateFilter, enableTimeFilter, selectedCams, startDateValue, endDateValue, startTimeValue, endTimeValue]);

    // --- Handlers ---
    const toggleCamera = (cam) => {
        if (!enableCamFilter) return; 
        
        setSelectedCams(prev => 
            prev.includes(cam)
                ? prev.filter(c => c !== cam)
                : [...prev, cam]
        );
    };

    const notifyParent = () => {
        let finalCameras = ["all"]; 
        if (enableCamFilter && selectedCams.length > 0) {
            finalCameras = selectedCams;
        } 

        let finalStartTime = null;
        let finalEndTime = null;
        let finalStartDate = null;
        let finalEndDate = null;

        if (enableDateFilter) {
            // New Logic: Range of Dates
            if (startDateValue && endDateValue) {
                 finalStartDate = startDateValue;
                 finalEndDate = endDateValue;
                 setDateWarning(""); // clear warning
            } else if (startDateValue || endDateValue) {
                 // User selected one but not the other
                 setDateWarning("Please select both Start and End dates.");
            } else {
                 // Neither selected, no warning yet or maybe specific guidance?
                 // Requirement: "If the user selects only one ... tell the user to select the other one"
                 setDateWarning("");
            }
            
            finalEndTime = endTimeValue;     // e.g., "00:20:00"
        } else {
             setDateWarning("");
        }

        if (enableTimeFilter) {
            // Updated: Supports both HH:MM (length 5) and HH:MM:SS (length 8)
            // If length is 5, append :00. If 8, keep as is.
            finalStartTime = (startTimeValue && startTimeValue.length === 5) ? startTimeValue + ":00" : startTimeValue;
            finalEndTime = (endTimeValue && endTimeValue.length === 5) ? endTimeValue + ":00" : endTimeValue;
        } else {
            // If time filter disabled, don't send time values even if populated
            finalStartTime = null;
            finalEndTime = null;
        }

        onFilterChange({
            cameras: finalCameras,
            startDate: finalStartDate,
            endDate: finalEndDate,
            startTime: finalStartTime,
            endTime: finalEndTime
        });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Video size={24} color="#3b82f6" />
                <span>VideoRAG</span>
            </div>

            <div className="sidebar-content">
                
                {/* Cameras Section */}
                <div className={`filter-section ${enableCamFilter ? 'active' : 'inactive'}`} style={{opacity: enableCamFilter ? 1 : 0.6, transition: 'opacity 0.2s'}}>
                    <div className="sidebar-check-group">
                        <input 
                            type="checkbox" 
                            id="camFilterCheck"
                            checked={enableCamFilter}
                            onChange={(e) => setEnableCamFilter(e.target.checked)}
                            style={{cursor: 'pointer'}}
                        />
                         <label htmlFor="camFilterCheck" className="sidebar-check-label">
                            <Camera size={16}/>
                            Cameras
                        </label>
                    </div>
                   
                    <div className="camera-grid">
                        {cameras.map(cam => {
                             const isSelected = selectedCams.includes(cam);
                             return (
                                <button
                                    key={cam}
                                    onClick={() => toggleCamera(cam)}
                                    disabled={!enableCamFilter}
                                    className={`camera-btn ${isSelected && enableCamFilter ? 'active' : ''}`}
                                    style={{cursor: !enableCamFilter ? 'not-allowed' : 'pointer'}}
                                >
                                    {cam}
                                </button>
                             )
                        })}
                    </div>
                </div>

                {/* Date & Time Section */}
                <div className={`filter-section ${enableDateFilter ? 'active' : 'inactive'}`} style={{opacity: enableDateFilter ? 1 : 0.6, transition: 'opacity 0.2s'}}>
                    <div className="sidebar-check-group">
                         <input 
                            type="checkbox" 
                            id="dateFilterCheck"
                            checked={enableDateFilter}
                            onChange={(e) => setEnableDateFilter(e.target.checked)}
                            style={{cursor: 'pointer'}}
                        />
                        <label htmlFor="dateFilterCheck" className="sidebar-check-label">
                            <Calendar size={16} />
                            Date Range
                        </label>
                    </div>

                    <div className="sidebar-input-group">
                        {/* Date Range Picker */}
                        <div className="sidebar-sub-group">
                            <label className="sidebar-label">Date Range</label>
                            
                            {/* Start Date */}
                            <div style={{marginBottom: 8}}>
                                <span style={{fontSize:'0.65rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', marginLeft:4, display:'block', marginBottom:4}}>Start ({startDateValue || '...'})</span>
                                <div className="sidebar-input-wrapper">
                                     <div className="sidebar-icon-left">
                                        <Calendar size={16} />
                                    </div>
                                    <input
                                        type="date"
                                        disabled={!enableDateFilter}
                                        value={startDateValue}
                                        onChange={(e) => setStartDateValue(e.target.value)}
                                        className="sidebar-input"
                                        style={{colorScheme: 'dark'}} 
                                    />
                                </div>
                            </div>

                             {/* End Date */}
                             <div>
                                <span style={{fontSize:'0.65rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', marginLeft:4, display:'block', marginBottom:4}}>End ({endDateValue || '...'})</span>
                                <div className="sidebar-input-wrapper">
                                     <div className="sidebar-icon-left">
                                        <Calendar size={16} />
                                    </div>
                                    <input
                                        type="date"
                                        disabled={!enableDateFilter}
                                        value={endDateValue}
                                        onChange={(e) => setEndDateValue(e.target.value)}
                                        className="sidebar-input"
                                        style={{colorScheme: 'dark'}} 
                                    />
                                </div>
                            </div>
                            
                            {dateWarning && (
                                <div style={{color: '#ef4444', fontSize: '0.75rem', marginTop: 4, fontStyle: 'italic'}}>
                                    {dateWarning}
                                </div>
                            )}
                        </div>
                        
                        </div>
                    </div>


                {/* Clock Time Section */}
                <div className={`filter-section ${enableTimeFilter ? 'active' : 'inactive'}`} style={{opacity: enableTimeFilter ? 1 : 0.6, transition: 'opacity 0.2s'}}>
                    <div className="sidebar-check-group">
                         <input 
                            type="checkbox" 
                            id="timeFilterCheck"
                            checked={enableTimeFilter}
                            onChange={(e) => setEnableTimeFilter(e.target.checked)}
                            style={{cursor: 'pointer'}}
                        />
                        <label htmlFor="timeFilterCheck" className="sidebar-check-label">
                            <Clock size={16} />
                            Clock Time
                        </label>
                    </div>

                    <div className="sidebar-input-group">
                         {/* Time Inputs */}
                         <div className="sidebar-sub-group">
                            <label className="sidebar-label" style={{display:'flex', alignItems:'center', gap:4}}>
                                Time of Day (e.g. 9 to 5)
                            </label>
                            
                            <div className="sidebar-input-group">
                                {/* Start Time */}
                                <div className="sidebar-sub-group">
                                    <span style={{fontSize:'0.65rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', marginLeft:4}}>Start Time</span>
                                    <div className="sidebar-input-wrapper">
                                        <div className="sidebar-icon-left">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            type="time"
                                            step="1"
                                            disabled={!enableTimeFilter}
                                            value={startTimeValue}
                                            onChange={(e) => setStartTimeValue(e.target.value)}
                                            className="sidebar-input"
                                            style={{colorScheme: 'dark'}}
                                        />
                                    </div>
                                </div>

                                {/* End Time */}
                                <div className="sidebar-sub-group">
                                    <span style={{fontSize:'0.65rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', marginLeft:4}}>End Time</span>
                                    <div className="sidebar-input-wrapper">
                                        <div className="sidebar-icon-left">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            type="time"
                                            step="1"
                                            disabled={!enableTimeFilter}
                                            value={endTimeValue}
                                            onChange={(e) => setEndTimeValue(e.target.value)}
                                            className="sidebar-input"
                                            style={{colorScheme: 'dark'}}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="spacer"></div>

                <button className="upload-btn" onClick={onUploadClick}>
                    <UploadCloud size={18} />
                    Upload Video
                </button>
            </div>

            <div style={{padding: 20, borderTop: '1px solid #1e293b'}}>
                <button 
                    onClick={onClearChat}
                    className="clear-chat-btn"
                >
                    <Trash2 size={16} /> 
                    Clear Chat History
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;