import React, { useState } from 'react';
import { TimelineEvent as TimelineEventType } from '../types';
import { useTimeline } from '../context/TimelineContext';
import { calculateEventPosition, calculateEventWidth, formatDate } from '../utils/timelineUtils';
import { Star, Edit, Trash2 } from 'lucide-react';

interface TimelineEventProps {
  event: TimelineEventType;
  onEdit: (event: TimelineEventType) => void;
  row: number;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onEdit, row }) => {
  const { timelineConfig, deleteEvent } = useTimeline();
  const [isHovered, setIsHovered] = useState(false);
  
  const leftPosition = calculateEventPosition(event.startDate, timelineConfig);
  const width = calculateEventWidth(event.startDate, event.endDate, timelineConfig);
  const topPosition = row * 56; // 3.5rem per row
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
    }
  };
  
  const handleEdit = () => {
    onEdit(event);
  };
  
  return (
    <div 
      className="absolute top-1 group h-8 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ 
        left: `${leftPosition}%`, 
        width: `${width}%`,
        backgroundColor: event.color || '#3b82f6',
        minWidth: '50px',
        top: `${topPosition + 4}px` // Add 4px padding
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleEdit}
    >
      <div className="h-full w-full px-2 flex items-center justify-between text-white overflow-hidden">
        <div className="truncate text-sm">
          {event.title}
        </div>
        
        {/* Important indicator */}
        {event.isImportant && (
          <Star 
            size={16} 
            className="flex-shrink-0 text-yellow-300 ml-1" 
            fill="currentColor"
          />
        )}
      </div>
      
      {/* Hover overlay with actions */}
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-2">
          <button 
            onClick={handleEdit}
            className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
            title="Edit event"
          >
            <Edit size={14} className="text-gray-700" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
            title="Delete event"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      )}
      
      {/* Tooltip on hover */}
      <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        <div className="bg-gray-800 text-white text-xs rounded p-2 shadow-lg">
          <div className="font-medium">{event.title}</div>
          <div>{formatDate(event.startDate)} - {formatDate(event.endDate)}</div>
          {event.notes && <div className="text-gray-300 mt-1">{event.notes}</div>}
        </div>
      </div>
    </div>
  );
};

export default TimelineEvent;