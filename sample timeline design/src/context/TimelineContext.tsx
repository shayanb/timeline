import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  TimelineEvent, 
  Category, 
  TimelineConfig, 
  Quarter 
} from '../types';
import { 
  initialEvents, 
  initialCategories, 
  timelineConfig as defaultTimelineConfig,
  quarters as defaultQuarters
} from '../data/initialData';

interface TimelineContextType {
  events: TimelineEvent[];
  categories: Category[];
  timelineConfig: TimelineConfig;
  quarters: Quarter[];
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (event: TimelineEvent) => void;
  deleteEvent: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  updateTimelineConfig: (config: Partial<TimelineConfig>) => void;
  setTimelineData: (data: { events: TimelineEvent[]; categories: Category[]; timelineConfig: TimelineConfig }) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const TimelineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>(defaultTimelineConfig);
  const [quarters, setQuarters] = useState<Quarter[]>(defaultQuarters);

  const addEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent = {
      ...event,
      id: uuidv4(),
    };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (updatedEvent: TimelineEvent) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: uuidv4(),
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(categories.map(category => 
      category.id === updatedCategory.id ? updatedCategory : category
    ));
  };

  const deleteCategory = (id: string) => {
    // First check if there are any events using this category
    const eventsUsingCategory = events.some(event => event.categoryId === id);
    
    if (eventsUsingCategory) {
      alert("Cannot delete category that has events. Please remove or reassign those events first.");
      return;
    }
    
    setCategories(categories.filter(category => category.id !== id));
  };

  const updateTimelineConfig = (config: Partial<TimelineConfig>) => {
    setTimelineConfig({ ...timelineConfig, ...config });
  };

  const setTimelineData = (data: { 
    events: TimelineEvent[]; 
    categories: Category[]; 
    timelineConfig: TimelineConfig 
  }) => {
    setEvents(data.events);
    setCategories(data.categories);
    setTimelineConfig(data.timelineConfig);
  };

  const value = {
    events,
    categories,
    timelineConfig,
    quarters,
    addEvent,
    updateEvent,
    deleteEvent,
    addCategory,
    updateCategory,
    deleteCategory,
    updateTimelineConfig,
    setTimelineData,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};