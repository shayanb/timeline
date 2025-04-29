import React from 'react';
import { useTimeline } from '../context/TimelineContext';
import { getMonthsBetween, calculateEventPosition } from '../utils/timelineUtils';
import TimelineCategoryRow from './TimelineCategoryRow';
import { TimelineEvent, Category } from '../types';
import { Plus } from 'lucide-react';

interface TimelineGridProps {
  onAddEvent: (categoryId: string) => void;
  onEditEvent: (event: TimelineEvent) => void;
  onAddCategory: () => void;
}

const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  onAddEvent, 
  onEditEvent,
  onAddCategory
}) => {
  const { timelineConfig, categories } = useTimeline();
  const { startDate, endDate, today } = timelineConfig;
  
  // Get all months for the grid
  const months = getMonthsBetween(startDate, endDate);
  
  // Calculate today's position
  const todayPosition = calculateEventPosition(today, timelineConfig);
  
  return (
    <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
      {/* Month grid */}
      <div className="relative flex border-b border-gray-200 h-10 bg-white">
        <div className="w-[180px] border-r border-gray-200 bg-gray-50 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">Categories</span>
        </div>
        
        {months.map((month, index) => (
          <div 
            key={index} 
            className="flex-1 border-r border-gray-200 last:border-r-0"
          ></div>
        ))}
        
        {/* Today vertical line */}
        <div 
          className="absolute top-0 bottom-0 w-0 border-l-2 border-red-500 z-10"
          style={{ left: `calc(180px + ${todayPosition}% * (100% - 180px) / 100%)` }}
        ></div>
      </div>
      
      {/* Category rows */}
      <div className="bg-white">
        {categories.map((category: Category) => (
          <TimelineCategoryRow 
            key={category.id} 
            categoryId={category.id}
            onAddEvent={onAddEvent}
            onEditEvent={onEditEvent}
          />
        ))}
        
        {/* Add new category button */}
        <div className="h-14 flex items-center justify-center border-t border-gray-200 hover:bg-gray-50 transition-colors">
          <button 
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            onClick={onAddCategory}
          >
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineGrid;