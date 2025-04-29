import React from 'react';
import { useTimeline } from '../context/TimelineContext';
import { filterEventsByCategory, calculateEventRow } from '../utils/timelineUtils';
import TimelineEvent from './TimelineEvent';
import { TimelineEvent as TimelineEventType } from '../types';
import { Plus } from 'lucide-react';

interface TimelineCategoryRowProps {
  categoryId: string;
  onAddEvent: (categoryId: string) => void;
  onEditEvent: (event: TimelineEventType) => void;
}

const TimelineCategoryRow: React.FC<TimelineCategoryRowProps> = ({ 
  categoryId,
  onAddEvent,
  onEditEvent
}) => {
  const { events, categories } = useTimeline();
  
  // Get category details
  const category = categories.find(cat => cat.id === categoryId);
  
  // Filter events by category and calculate rows
  const categoryEvents = filterEventsByCategory(events, categoryId);
  categoryEvents.forEach(event => {
    (event as any).row = calculateEventRow(event, categoryEvents);
  });
  
  // Calculate required height based on maximum row
  const maxRow = Math.max(...categoryEvents.map(event => (event as any).row), 0);
  const rowHeight = 56; // 3.5rem
  const categoryHeight = (maxRow + 1) * rowHeight;
  
  if (!category) return null;
  
  return (
    <div className="relative group">
      {/* Category name sidebar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[180px] flex items-center justify-center text-white font-medium px-2 z-10"
        style={{ backgroundColor: category.color }}
      >
        <span className="truncate text-sm">{category.name}</span>
      </div>
      
      {/* Timeline row for this category */}
      <div 
        className="ml-[180px] relative border-b border-gray-200 bg-gray-50"
        style={{ height: `${categoryHeight}px` }}
      >
        {/* Add event button */}
        <button 
          className="absolute right-4 top-4 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 
                    opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          onClick={() => onAddEvent(categoryId)}
          title={`Add event to ${category.name}`}
        >
          <Plus size={16} className="text-gray-600" />
        </button>
        
        {/* Render events for this category */}
        {categoryEvents.map(event => (
          <TimelineEvent 
            key={event.id} 
            event={event}
            onEdit={onEditEvent}
            row={(event as any).row}
          />
        ))}
      </div>
    </div>
  );
};

export default TimelineCategoryRow;