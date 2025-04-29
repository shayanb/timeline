import React, { useState } from 'react';
import { TimelineProvider } from './context/TimelineContext';
import TimelineHeader from './components/TimelineHeader';
import TimelineGrid from './components/TimelineGrid';
import TimelineControls from './components/TimelineControls';
import EventModal from './components/EventModal';
import CategoryModal from './components/CategoryModal';
import { TimelineEvent } from './types';

// Add required packages
// npm i uuid

const App: React.FC = () => {
  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  
  // Open modal to add event
  const handleAddEvent = (categoryId?: string) => {
    setSelectedEvent(undefined);
    setSelectedCategoryId(categoryId);
    setEventModalOpen(true);
  };
  
  // Open modal to edit event
  const handleEditEvent = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setSelectedCategoryId(undefined);
    setEventModalOpen(true);
  };
  
  // Open modal to add category
  const handleAddCategory = () => {
    setCategoryModalOpen(true);
  };
  
  // Close event modal
  const handleCloseEventModal = () => {
    setEventModalOpen(false);
    setSelectedEvent(undefined);
    setSelectedCategoryId(undefined);
  };
  
  // Close category modal
  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
  };
  
  return (
    <TimelineProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Timeline header with title and month display */}
          <TimelineHeader />
          
          {/* Controls for adding events, import/export */}
          <TimelineControls onAddEvent={() => handleAddEvent()} />
          
          {/* Main timeline grid */}
          <TimelineGrid 
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onAddCategory={handleAddCategory}
          />
          
          {/* Modals */}
          <EventModal 
            isOpen={eventModalOpen}
            onClose={handleCloseEventModal}
            event={selectedEvent}
            selectedCategoryId={selectedCategoryId}
          />
          
          <CategoryModal 
            isOpen={categoryModalOpen}
            onClose={handleCloseCategoryModal}
          />
        </div>
      </div>
    </TimelineProvider>
  );
};

export default App;