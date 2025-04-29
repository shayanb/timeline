import React, { useState, useEffect } from 'react';
import { TimelineEvent, Category } from '../types';
import { useTimeline } from '../context/TimelineContext';
import { X } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: TimelineEvent;
  selectedCategoryId?: string;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  selectedCategoryId 
}) => {
  const { categories, addEvent, updateEvent } = useTimeline();
  
  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setCategoryId(event.categoryId);
      setStartDate(formatDateForInput(event.startDate));
      setEndDate(formatDateForInput(event.endDate));
      setColor(event.color || '');
      setIsImportant(event.isImportant || false);
      setNotes(event.notes || '');
    } else {
      // New event, reset form
      setTitle('');
      setCategoryId(selectedCategoryId || categories[0]?.id || '');
      setStartDate(formatDateForInput(new Date()));
      
      // Default end date to one day later
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(formatDateForInput(tomorrow));
      
      setColor('');
      setIsImportant(false);
      setNotes('');
    }
  }, [event, selectedCategoryId, categories]);
  
  // Helper to format date for input[type="date"]
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !categoryId || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    const eventData = {
      title,
      categoryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color: color || undefined,
      isImportant,
      notes: notes || undefined,
    };
    
    if (event) {
      // Update existing event
      updateEvent({ ...eventData, id: event.id });
    } else {
      // Add new event
      addEvent(eventData);
    }
    
    onClose();
  };
  
  // Background click handler
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {event ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Event title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date range */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Color (optional)
              </label>
              <input
                type="color"
                id="color"
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md cursor-pointer"
                value={color || '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            
            {/* Important flag */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isImportant"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-700">
                Mark as important
              </label>
            </div>
            
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {event ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;