import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { useTimeline } from '../context/TimelineContext';
import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  category 
}) => {
  const { addCategory, updateCategory } = useTimeline();
  
  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  
  // Initialize form with category data if editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    } else {
      // New category, reset form
      setName('');
      setColor('#3b82f6');
    }
  }, [category]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !color) {
      alert('Please fill in all required fields');
      return;
    }
    
    const categoryData = {
      name,
      color,
    };
    
    if (category) {
      // Update existing category
      updateCategory({ ...categoryData, id: category.id });
    } else {
      // Add new category
      addCategory(categoryData);
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {category ? 'Edit Category' : 'Add New Category'}
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
            {/* Category name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            {/* Color */}
            <div>
              <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700 mb-1">
                Category Color *
              </label>
              <input
                type="color"
                id="categoryColor"
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md cursor-pointer"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            
            {/* Preview */}
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
              <div 
                className="h-8 w-full rounded-md flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: color }}
              >
                {name || 'Category Name'}
              </div>
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
              {category ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;