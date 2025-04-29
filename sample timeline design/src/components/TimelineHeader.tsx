import React from 'react';
import { useTimeline } from '../context/TimelineContext';
import { getMonthsBetween, formatMonth, calculateEventPosition } from '../utils/timelineUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TimelineHeader: React.FC = () => {
  const { timelineConfig, quarters } = useTimeline();
  const { startDate, endDate, today } = timelineConfig;
  
  // Get all months between start and end dates
  const months = getMonthsBetween(startDate, endDate);
  
  // Calculate today marker position
  const todayPosition = calculateEventPosition(today, timelineConfig);
  
  return (
    <div className="mb-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Calendar Timeline</h1>
      
      {/* Navigation controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous time period"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next time period"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="flex gap-3">
          <button className="px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm">
            Today
          </button>
          <select className="px-3 py-1.5 rounded-md border border-gray-300 text-sm bg-white">
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>
      
      {/* Quarter markers */}
      <div className="relative h-12 mb-1">
        {quarters.map((quarter) => {
          const position = calculateEventPosition(quarter.date, timelineConfig);
          return (
            <div 
              key={quarter.name}
              className="absolute transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${position}%` }}
            >
              <div className="text-sm font-medium text-gray-700">{quarter.name}</div>
              <div className="text-xs text-gray-500">
                {quarter.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
              </div>
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-1"></div>
            </div>
          );
        })}
      </div>
      
      {/* Month headers */}
      <div className="relative flex h-10 border-t border-gray-200">
        {months.map((month, index) => (
          <div 
            key={index} 
            className="flex-1 text-center border-r border-gray-200 last:border-r-0"
          >
            <div className="py-2 font-medium text-gray-700">{formatMonth(month)}</div>
          </div>
        ))}
        
        {/* Today marker */}
        <div 
          className="absolute top-0 bottom-0 w-0 border-l-2 border-red-500 z-10"
          style={{ left: `${todayPosition}%` }}
        >
          <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-full">
            <div className="text-xs font-medium text-red-500 whitespace-nowrap">Today</div>
            <div className="mx-auto w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;