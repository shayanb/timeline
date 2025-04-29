import React, { useRef } from 'react';
import { Plus, Download, Upload, Settings } from 'lucide-react';
import { useTimeline } from '../context/TimelineContext';
import { parse, stringify } from 'yaml';
import { exportToYAML, importFromYAML } from '../utils/timelineUtils';

interface TimelineControlsProps {
  onAddEvent: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({ onAddEvent }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { events, categories, timelineConfig, setTimelineData } = useTimeline();
  
  // Export timeline data
  const handleExport = () => {
    const data = {
      events,
      categories,
      timelineConfig
    };
    
    const yamlData = stringify(exportToYAML(data));
    const blob = new Blob([yamlData], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-data.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import timeline data
  const handleImport = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const yamlData = parse(event.target?.result as string);
        const importedData = importFromYAML(yamlData);
        setTimelineData(importedData);
      } catch (error) {
        console.error('Error importing timeline data:', error);
        alert('Error importing timeline data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-lg font-medium text-gray-800">Timeline Events</h2>
      </div>
      <div className="flex gap-2">
        <button 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={onAddEvent}
        >
          <Plus size={16} />
          <span>Add Event</span>
        </button>
        
        <button 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={handleExport}
          title="Export timeline data"
        >
          <Download size={16} />
        </button>
        
        <button 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={handleImport}
          title="Import timeline data"
        >
          <Upload size={16} />
        </button>
        
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".yaml,.yml"
          onChange={handleFileChange}
        />
        
        <button 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default TimelineControls;