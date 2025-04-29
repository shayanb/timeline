import { TimelineConfig, TimelineEvent } from '../types';

// Format date to display format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });
};

// Format month for display
export const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long' });
};

// Get months between start and end date
export const getMonthsBetween = (startDate: Date, endDate: Date): Date[] => {
  const months: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Set to first day of month
  currentDate.setDate(1);
  
  while (currentDate <= endDate) {
    months.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

// Calculate position percentage for an event
export const calculateEventPosition = (
  date: Date, 
  timelineConfig: TimelineConfig
): number => {
  const { startDate, endDate } = timelineConfig;
  
  // Handle dates outside the timeline range
  if (date < startDate) return 0;
  if (date > endDate) return 100;
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  const eventPosition = date.getTime() - startDate.getTime();
  
  return (eventPosition / totalDuration) * 100;
};

// Calculate width percentage for an event
export const calculateEventWidth = (
  startDate: Date, 
  endDate: Date, 
  timelineConfig: TimelineConfig
): number => {
  const timelineStart = timelineConfig.startDate;
  const timelineEnd = timelineConfig.endDate;
  
  // Adjust dates if they fall outside the timeline
  const effectiveStartDate = startDate < timelineStart ? timelineStart : startDate;
  const effectiveEndDate = endDate > timelineEnd ? timelineEnd : endDate;
  
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const eventDuration = effectiveEndDate.getTime() - effectiveStartDate.getTime();
  
  return (eventDuration / totalDuration) * 100;
};

// Filter events by category
export const filterEventsByCategory = (
  events: TimelineEvent[], 
  categoryId: string
): TimelineEvent[] => {
  return events.filter(event => event.categoryId === categoryId);
};

// Sort events by start date
export const sortEventsByDate = (events: TimelineEvent[]): TimelineEvent[] => {
  return [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};

// Check if date is today (same year, month, and day)
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Check if two events overlap
export const doEventsOverlap = (event1: TimelineEvent, event2: TimelineEvent): boolean => {
  return event1.startDate < event2.endDate && event2.startDate < event1.endDate;
};

// Calculate row position for overlapping events
export const calculateEventRow = (event: TimelineEvent, events: TimelineEvent[]): number => {
  const overlappingEvents = events.filter(e => 
    e.id !== event.id && 
    e.categoryId === event.categoryId && 
    doEventsOverlap(event, e)
  );
  
  if (overlappingEvents.length === 0) return 0;
  
  // Find the first available row
  let row = 0;
  let foundRow = false;
  
  while (!foundRow) {
    const eventsInRow = overlappingEvents.filter(e => e.row === row);
    if (eventsInRow.length === 0) {
      foundRow = true;
    } else {
      row++;
    }
  }
  
  return row;
};

// Export timeline data to YAML
export const exportToYAML = (data: any): string => {
  const parse = (obj: any): any => {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(parse);
    }
    if (obj && typeof obj === 'object') {
      const parsed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        parsed[key] = parse(value);
      }
      return parsed;
    }
    return obj;
  };
  
  return parse(data);
};

// Import timeline data from YAML
export const importFromYAML = (data: any): any => {
  const parse = (obj: any): any => {
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj)) {
      return new Date(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(parse);
    }
    if (obj && typeof obj === 'object') {
      const parsed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        parsed[key] = parse(value);
      }
      return parsed;
    }
    return obj;
  };
  
  return parse(data);
};