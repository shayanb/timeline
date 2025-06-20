/**
 * Event Manager Module
 * Comprehensive event CRUD operations for timeline events.
 * Handles event creation, modification, deletion, form submission, and validation.
 */

import { 
  setUnsavedChanges, 
  updateModificationStatus, 
  DEFAULT_MILESTONE_EMOJI 
} from './config.js';

import { 
  randomColor, 
  calculateEventRow, 
  groupByCategory, 
  sortByDate 
} from './utils.js';

import { 
  processImportedData, 
  normalizeEventsForExport 
} from './data-manager.js';

// =============================================================================
// GLOBAL EVENT STATE AND VARIABLES
// =============================================================================

// Event data storage
let events = [];
let nextId = 1;
let editingId = null;

// DOM element references - initialized on module load
let formElements = {};
let timelineElements = {};

// =============================================================================
// INITIALIZATION AND DOM SETUP
// =============================================================================

/**
 * Initialize the event manager with DOM elements
 * This should be called after DOM is loaded
 */
export function initializeEventManager() {
  // Form elements
  formElements = {
    form: document.getElementById('event-form'),
    formTitle: document.getElementById('form-title'),
    formContainer: document.getElementById('form-container'),
    titleInput: document.getElementById('title'),
    startInput: document.getElementById('start-date'),
    endInput: document.getElementById('end-date'),
    typeInput: document.getElementById('event-type'),
    colorInput: document.getElementById('color'),
    metadataInput: document.getElementById('metadata'),
    categoryInput: document.getElementById('category'),
    parentInput: document.getElementById('parent-event'),
    importantCheckbox: document.getElementById('important'),
    isParentCheckbox: document.getElementById('is-parent'),
    eventIdInput: document.getElementById('event-id'),
    cityInput: document.getElementById('city'),
    countryInput: document.getElementById('country'),
    rowInput: document.getElementById('event-row'),
    rowField: document.getElementById('row-field'),
    submitBtn: document.getElementById('submit-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
    deleteBtn: document.getElementById('delete-btn'),
    removeParentBtn: document.getElementById('remove-parent-btn'),
    closeFormBtn: document.getElementById('close-form-btn'),
    addEventBtn: document.getElementById('add-event-btn')
  };

  // Timeline elements
  timelineElements = {
    timeline: document.getElementById('timeline'),
    timelineContainer: document.getElementById('timeline-container')
  };

  // Initialize form event listeners
  initializeFormListeners();
  
  // Initialize color input with random color
  if (formElements.colorInput) {
    formElements.colorInput.value = randomColor();
  }

  console.log('Event manager initialized successfully');
}

/**
 * Initialize form event listeners
 */
function initializeFormListeners() {
  if (!formElements.form) return;

  // Form submission handler
  formElements.form.addEventListener('submit', handleFormSubmit);

  // Add event button
  if (formElements.addEventBtn) {
    formElements.addEventBtn.addEventListener('click', handleAddEventClick);
  }

  // Close form button
  if (formElements.closeFormBtn) {
    formElements.closeFormBtn.addEventListener('click', hideForm);
  }

  // Cancel button
  if (formElements.cancelBtn) {
    formElements.cancelBtn.addEventListener('click', handleCancelClick);
  }

  // Type input change for toggling fields
  if (formElements.typeInput) {
    formElements.typeInput.addEventListener('change', handleTypeChange);
  }

  // Parent input change
  if (formElements.parentInput) {
    formElements.parentInput.addEventListener('change', handleParentChange);
  }

  // Remove parent button
  if (formElements.removeParentBtn) {
    formElements.removeParentBtn.addEventListener('click', handleRemoveParent);
  }
}

// =============================================================================
// EVENT DATA MANAGEMENT
// =============================================================================

/**
 * Get all events
 * @returns {Array} Array of event objects
 */
export function getEvents() {
  return [...events];
}

/**
 * Set events data
 * @param {Array} newEvents - Array of event objects
 */
export function setEvents(newEvents) {
  events = [...newEvents];
  
  // Update nextId to avoid conflicts
  if (events.length > 0) {
    nextId = Math.max(...events.map(e => e.id)) + 1;
  }
}

/**
 * Add a new event
 * @param {Object} eventData - Event data object
 * @returns {Object} The created event object
 */
export function addEvent(eventData) {
  const event = {
    id: nextId++,
    eventId: eventData.eventId || `auto-${nextId}`,
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    type: eventData.type,
    color: eventData.color || randomColor(),
    metadata: eventData.metadata || '',
    category: eventData.category || null,
    parent: eventData.parent || null,
    parentId: eventData.parentId || null,
    isImportant: !!eventData.isImportant,
    isParent: !!eventData.isParent,
    location: eventData.location || null,
    row: eventData.row || null,
    _customRow: !!eventData._customRow
  };

  events.push(event);
  
  // Mark as having unsaved changes
  setUnsavedChanges(true);
  updateModificationStatus();

  return event;
}

/**
 * Update an existing event
 * @param {number} id - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Object|null} The updated event object or null if not found
 */
export function updateEvent(id, eventData) {
  const eventIndex = events.findIndex(ev => ev.id === id);
  if (eventIndex === -1) return null;

  const event = events[eventIndex];
  
  // Update event properties
  Object.keys(eventData).forEach(key => {
    if (key !== 'id') {
      event[key] = eventData[key];
    }
  });

  // Mark as having unsaved changes
  setUnsavedChanges(true);
  updateModificationStatus();

  return event;
}

/**
 * Delete an event by ID
 * @param {number} id - Event ID to delete
 * @returns {boolean} True if event was deleted, false if not found
 */
export function removeEvent(id) {
  const initialLength = events.length;
  events = events.filter(ev => ev.id !== id);
  
  if (events.length < initialLength) {
    // Mark as having unsaved changes
    setUnsavedChanges(true);
    updateModificationStatus();
    return true;
  }
  
  return false;
}

/**
 * Find event by ID
 * @param {number} id - Event ID
 * @returns {Object|null} Event object or null if not found
 */
export function findEventById(id) {
  return events.find(ev => ev.id === id) || null;
}

/**
 * Find event by eventId (string identifier)
 * @param {string} eventId - Event string ID
 * @returns {Object|null} Event object or null if not found
 */
export function findEventByEventId(eventId) {
  return events.find(ev => ev.eventId === eventId) || null;
}

// =============================================================================
// FORM MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Show the event form
 */
export function showForm() {
  if (formElements.formContainer) {
    formElements.formContainer.classList.add('open');
  }
}

/**
 * Hide the event form
 */
export function hideForm() {
  if (formElements.formContainer) {
    formElements.formContainer.classList.remove('open');
  }
}

/**
 * Reset the form to default state
 */
export function resetForm() {
  if (!formElements.form) return;

  formElements.form.reset();
  editingId = null;
  
  if (formElements.colorInput) {
    formElements.colorInput.value = randomColor();
  }
  
  if (formElements.submitBtn) {
    formElements.submitBtn.textContent = 'Add';
  }
  
  if (formElements.formTitle) {
    formElements.formTitle.textContent = 'Add New Event';
  }

  // Hide delete button
  if (formElements.deleteBtn) {
    formElements.deleteBtn.style.display = 'none';
  }

  // Hide remove parent button
  if (formElements.removeParentBtn) {
    formElements.removeParentBtn.style.display = 'none';
  }

  // Reset dropdowns if using Semantic UI
  if (window.$ && $.fn.dropdown) {
    $('#category-dropdown').dropdown('clear');
    $('#parent-event').dropdown('clear');
    $('#country-dropdown').dropdown('clear');
  }
}

/**
 * Populate category dropdown from existing categories
 */
export function populateCategories() {
  if (window.$ && $.fn.dropdown) {
    const categoryMenu = document.getElementById('category-menu');
    if (categoryMenu) {
      // Get unique categories from events
      const categories = [...new Set(events.map(e => e.category).filter(Boolean))];
      
      // Clear existing items except the "None" option
      categoryMenu.innerHTML = '<div class="item" data-value="">None</div>';
      
      // Add each category to the dropdown
      categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('data-value', category);
        item.textContent = category;
        categoryMenu.appendChild(item);
      });
    }
  }
}

/**
 * Populate row dropdown based on category's existing events
 * @param {string} category - Category name
 * @param {number} currentRow - Current row number (for editing)
 */
export function populateRowDropdown(category, currentRow = null) {
  if (!formElements.rowInput) return;

  // Clear existing options
  formElements.rowInput.innerHTML = '';
  
  // Get max row number for this category + 1 for a new row
  let maxRow = 0;
  
  if (category) {
    // Get all range events in this category
    const categoryEvents = events.filter(e => 
      e.type === 'range' && e.category === category
    );
    
    // Find the highest row number in use
    categoryEvents.forEach(event => {
      if (event.row !== null && event.row !== undefined) {
        maxRow = Math.max(maxRow, event.row);
      }
    });
  }
  
  // Add row options (0 to maxRow + 1)
  for (let i = 0; i <= maxRow + 1; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Row ${i}`;
    formElements.rowInput.appendChild(option);
  }
  
  // Set the current row if provided
  if (currentRow !== null && currentRow !== undefined) {
    formElements.rowInput.value = currentRow;
  }
}

/**
 * Populate parent event dropdown
 */
export function populateParentDropdown() {
  if (window.$ && $.fn.dropdown) {
    const parentMenu = document.getElementById('parent-menu');
    if (parentMenu) {
      // Clear existing items
      parentMenu.innerHTML = '<div class="item" data-value="">None</div>';
      
      // Get events that can be parents (marked as isParent or have children)
      const potentialParents = events.filter(e => e.isParent || e.type === 'range');
      
      // Add each potential parent to the dropdown
      potentialParents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('data-value', event.id);
        item.textContent = `${event.title} (${event.type})`;
        parentMenu.appendChild(item);
      });
    }
  }
}

// =============================================================================
// EVENT FORM HANDLERS
// =============================================================================

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  const formData = extractFormData();
  
  // Validate form data
  const validation = validateEventData(formData);
  if (!validation.isValid) {
    alert(validation.errors.join('\n'));
    return;
  }

  if (editingId) {
    // Update existing event
    handleUpdateEvent(editingId, formData);
  } else {
    // Add new event
    handleCreateEvent(formData);
  }

  // Reset form and hide
  resetForm();
  hideForm();
  
  // Trigger update (this will need to be handled by the main app)
  triggerEventUpdate();
}

/**
 * Extract form data into an object
 * @returns {Object} Form data object
 */
function extractFormData() {
  const title = formElements.titleInput.value.trim();
  const start = new Date(formElements.startInput.value);
  const type = formElements.typeInput.value;
  const end = (type === 'range') ? new Date(formElements.endInput.value) : new Date(formElements.startInput.value);
  const color = formElements.colorInput.value;
  const metadata = formElements.metadataInput.value.trim();
  const customEventId = formElements.eventIdInput.value.trim();
  
  // Get category from dropdown or input
  let category = null;
  if (window.$ && $.fn.dropdown) {
    category = $('#category-dropdown').dropdown('get value') || null;
  } else {
    category = formElements.categoryInput.value ? formElements.categoryInput.value : null;
  }
  
  const isImportant = formElements.importantCheckbox.checked;
  const isParent = formElements.isParentCheckbox.checked;
  
  // Get custom row number if provided
  let customRow = null;
  if ((type === 'range' || type === 'milestone') && formElements.rowInput.value !== '') {
    customRow = parseInt(formElements.rowInput.value);
    if (isNaN(customRow) || customRow < 0) {
      customRow = null;
    }
  }
  
  // Get parent relationship
  const parentId = formElements.parentInput.value ? parseInt(formElements.parentInput.value) : null;
  
  // Get parent string ID if the parent exists
  let parentEventId = null;
  if (parentId) {
    const parentEvent = events.find(ev => ev.id === parentId);
    if (parentEvent && parentEvent.eventId) {
      parentEventId = parentEvent.eventId;
    }
  }

  // Get location data
  const city = formElements.cityInput.value.trim();
  let country = '';
  
  if (window.$ && $.fn.dropdown) {
    country = $('#country-dropdown').dropdown('get value') || '';
  } else {
    country = formElements.countryInput.value.trim();
  }
  
  const location = (city || country) ? { city, country } : null;

  return {
    title,
    start,
    end,
    type,
    color,
    metadata,
    category,
    isImportant,
    isParent,
    customRow,
    parentId,
    parentEventId,
    location,
    customEventId
  };
}

/**
 * Validate event data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateEventData(formData) {
  const errors = [];

  // Title is required
  if (!formData.title) {
    errors.push('Title is required');
  }

  // Start date is required
  if (!formData.start || isNaN(formData.start.getTime())) {
    errors.push('Valid start date is required');
  }

  // For range events, end date must be after start date
  if (formData.type === 'range') {
    if (!formData.end || isNaN(formData.end.getTime())) {
      errors.push('Valid end date is required for range events');
    } else if (formData.end < formData.start) {
      errors.push('End date must be on or after start date');
    }
  }

  // Event type is required
  if (!formData.type) {
    errors.push('Event type is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Handle creating a new event
 * @param {Object} formData - Form data
 */
function handleCreateEvent(formData) {
  // Generate or use provided event ID
  const eventId = formData.customEventId || `auto-${nextId}`;
  
  // Determine row value and track if custom
  const rowValue = formData.type === 'range' && formData.customRow !== null ? formData.customRow : null;
  const _customRow = formData.type === 'range' && formData.customRow !== null;
  
  const eventData = {
    eventId,
    title: formData.title,
    start: formData.start,
    end: formData.end,
    type: formData.type,
    color: formData.color,
    metadata: formData.metadata,
    category: formData.category,
    parent: formData.parentId,
    parentId: formData.parentEventId,
    isImportant: formData.isImportant,
    isParent: formData.isParent,
    location: formData.location,
    row: rowValue,
    _customRow
  };

  addEvent(eventData);
}

/**
 * Handle updating an existing event
 * @param {number} eventId - Event ID to update
 * @param {Object} formData - Form data
 */
function handleUpdateEvent(eventId, formData) {
  const event = findEventById(eventId);
  if (!event) return;

  // Check if this is changing from regular event to parent event
  const changingToParent = !event.isParent && formData.isParent;
  const originalCategory = event.category;

  // Update event properties
  event.title = formData.title;
  event.start = formData.start;
  event.end = formData.end;
  event.type = formData.type;
  event.color = formData.color;
  event.metadata = formData.metadata;
  event.category = formData.category;
  event.parent = formData.parentId;
  event.parentId = formData.parentEventId;
  event.isImportant = formData.isImportant;
  event.isParent = formData.isParent;
  event.location = formData.location;

  // Set custom row if provided
  if (formData.type === 'range') {
    if (formData.customRow !== null) {
      event.row = formData.customRow;
      event._customRow = true;
    } else {
      event._customRow = false;
    }
  }

  // Update eventId if provided
  if (formData.customEventId && formData.customEventId !== event.eventId) {
    event.eventId = formData.customEventId;
  }

  // Fix for milestone category bug
  if (changingToParent && originalCategory) {
    const milestonesInCategory = events.filter(e => 
      e.type === 'milestone' && 
      e.category === originalCategory &&
      e.id !== eventId
    );
    
    milestonesInCategory.forEach(milestone => {
      milestone.category = originalCategory;
      if (milestone.parent === eventId) {
        milestone.parent = null;
        milestone.parentId = null;
      }
    });
  }

  // Mark as having unsaved changes
  setUnsavedChanges(true);
  updateModificationStatus();
}

/**
 * Handle add event button click
 */
function handleAddEventClick() {
  editingId = null;
  resetForm();
  
  // Populate dropdowns
  populateCategories();
  populateParentDropdown();
  
  if (formElements.submitBtn) {
    formElements.submitBtn.textContent = 'Save';
  }
  
  if (formElements.formTitle) {
    formElements.formTitle.textContent = 'Add New Event';
  }

  showForm();
  
  if (formElements.formContainer) {
    formElements.formContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Handle cancel button click
 */
function handleCancelClick() {
  editingId = null;
  resetForm();
  hideForm();
}

/**
 * Handle type input change
 */
function handleTypeChange() {
  const type = formElements.typeInput.value;
  
  // Show/hide end date field
  const endDateField = document.getElementById('end-date-field');
  if (endDateField) {
    endDateField.style.display = (type === 'range') ? 'block' : 'none';
  }

  // Show/hide row field for range and milestone events
  if (formElements.rowField) {
    if (type === 'range' || type === 'milestone') {
      formElements.rowField.style.display = 'block';
      
      // Populate row dropdown options
      const currentCategory = formElements.categoryInput.value;
      populateRowDropdown(currentCategory);
      
      // Initialize dropdown
      if (window.$ && $.fn.dropdown) {
        try {
          $(formElements.rowInput).dropdown('refresh');
        } catch (e) {
          console.error('Error refreshing row dropdown:', e);
        }
      }
    } else {
      formElements.rowField.style.display = 'none';
    }
  }
}

/**
 * Handle parent input change
 */
function handleParentChange() {
  const selectedParent = formElements.parentInput.value;
  
  if (formElements.removeParentBtn) {
    formElements.removeParentBtn.style.display = selectedParent ? 'block' : 'none';
  }
}

/**
 * Handle remove parent button click
 */
function handleRemoveParent() {
  if (window.$ && $.fn.dropdown) {
    $('#parent-event').dropdown('clear');
  } else {
    formElements.parentInput.value = '';
  }
  
  if (formElements.removeParentBtn) {
    formElements.removeParentBtn.style.display = 'none';
  }
}

// =============================================================================
// EVENT EDITING AND DELETION
// =============================================================================

/**
 * Edit an event - populate form with event data
 * @param {Object} event - Event object to edit
 */
export function editEvent(event) {
  console.log("Editing event:", JSON.stringify(event, null, 2));
  
  editingId = event.id;
  
  if (formElements.formTitle) {
    formElements.formTitle.textContent = 'Edit Event';
  }
  
  // Show form immediately
  showForm();
  
  // Populate form fields
  if (formElements.titleInput) formElements.titleInput.value = event.title;
  if (formElements.startInput) formElements.startInput.value = event.start.toISOString().slice(0,10);
  
  // Set event type dropdown
  if (window.$ && $.fn.dropdown) {
    $('#event-type').dropdown('set selected', event.type);
  } else if (formElements.typeInput) {
    formElements.typeInput.value = event.type;
  }
  
  // Trigger change to toggle end-date field
  if (formElements.typeInput) {
    formElements.typeInput.dispatchEvent(new Event('change'));
  }
  
  if (event.type === 'range' && formElements.endInput) {
    formElements.endInput.value = event.end.toISOString().slice(0,10);
  }
  
  if (formElements.colorInput) formElements.colorInput.value = event.color;
  if (formElements.metadataInput) formElements.metadataInput.value = event.metadata || '';
  if (formElements.eventIdInput) formElements.eventIdInput.value = event.eventId || '';
  
  // Update parent event dropdown
  if (window.$ && $.fn.dropdown) {
    try {
      $('#parent-event').dropdown('refresh');
      
      if (event.parent) {
        $('#parent-event').dropdown('set selected', event.parent);
        if (formElements.removeParentBtn) {
          formElements.removeParentBtn.style.display = 'block';
        }
      } else {
        $('#parent-event').dropdown('clear');
        if (formElements.removeParentBtn) {
          formElements.removeParentBtn.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Error updating parent dropdown:', e);
      if (formElements.parentInput) {
        formElements.parentInput.value = event.parent || '';
      }
    }
  } else if (formElements.parentInput) {
    formElements.parentInput.value = event.parent || '';
  }
  
  // Populate categories
  populateCategories();
  
  // Set category using Semantic UI dropdown
  if (window.$ && $.fn.dropdown) {
    try {
      if (event.category) {
        $('#category-dropdown').dropdown('set selected', event.category);
      } else {
        $('#category-dropdown').dropdown('clear');
      }
      
      // Set location data
      if (event.location) {
        if (formElements.cityInput) formElements.cityInput.value = event.location.city || '';
        
        if (event.location.country) {
          $('#country-dropdown').dropdown('set selected', event.location.country);
        } else {
          $('#country-dropdown').dropdown('clear');
        }
      } else {
        if (formElements.cityInput) formElements.cityInput.value = '';
        $('#country-dropdown').dropdown('clear');
      }
    } catch (e) {
      console.error('Error setting dropdown values:', e);
      // Fallback
      if (formElements.categoryInput) formElements.categoryInput.value = event.category || '';
      if (event.location) {
        if (formElements.cityInput) formElements.cityInput.value = event.location.city || '';
        if (formElements.countryInput) formElements.countryInput.value = event.location.country || '';
      }
    }
  } else {
    // Fallback without jQuery
    if (formElements.categoryInput) formElements.categoryInput.value = event.category || '';
    if (event.location) {
      if (formElements.cityInput) formElements.cityInput.value = event.location.city || '';
      if (formElements.countryInput) formElements.countryInput.value = event.location.country || '';
    }
  }
  
  // Set row number if available
  if (event.type === 'range' || event.type === 'milestone') {
    if (formElements.rowField) {
      formElements.rowField.style.display = 'block';
    }
    
    // Populate the row dropdown with options
    populateRowDropdown(event.category, event.row);
    
    // Set selected value
    if (formElements.rowInput) {
      if (event.row !== undefined && event.row !== null) {
        formElements.rowInput.value = event.row;
      } else {
        formElements.rowInput.selectedIndex = 0;
      }
    }
    
    // Initialize Semantic UI dropdown
    if (window.$ && $.fn.dropdown) {
      $(formElements.rowInput).dropdown('refresh');
    }
  } else {
    if (formElements.rowField) {
      formElements.rowField.style.display = 'none';
    }
  }
  
  // Set checkbox values
  if (formElements.importantCheckbox) formElements.importantCheckbox.checked = !!event.isImportant;
  if (formElements.isParentCheckbox) formElements.isParentCheckbox.checked = !!event.isParent;
  
  // Set checkboxes with Semantic UI if available
  if (window.$ && $.fn.checkbox) {
    try {
      $('.ui.checkbox').checkbox('refresh');
      
      if (event.isImportant) {
        $('#important').checkbox('check');
      } else {
        $('#important').checkbox('uncheck');
      }
      
      if (event.isParent) {
        $('#is-parent').checkbox('check');
      } else {
        $('#is-parent').checkbox('uncheck');
      }
      
      setTimeout(() => {
        try {
          $('.ui.checkbox').checkbox('refresh');
        } catch (e) {
          console.error('Error refreshing checkboxes:', e);
        }
      }, 50);
    } catch (e) {
      console.error('Error setting checkbox values:', e);
    }
  }
  
  // Show and configure delete button
  if (formElements.deleteBtn) {
    formElements.deleteBtn.style.display = 'block';
    
    // Remove existing listeners and add new one
    const newDeleteBtn = formElements.deleteBtn.cloneNode(true);
    formElements.deleteBtn.parentNode.replaceChild(newDeleteBtn, formElements.deleteBtn);
    formElements.deleteBtn = newDeleteBtn;
    
    newDeleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this event?')) {
        deleteEvent(editingId);
        hideForm();
      }
    });
  }
  
  if (formElements.submitBtn) {
    formElements.submitBtn.textContent = 'Save';
  }
  
  // Scroll to form
  if (formElements.formContainer) {
    formElements.formContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Delete an event
 * @param {number} id - Event ID to delete
 */
export function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this event?')) {
    const success = removeEvent(id);
    if (success) {
      triggerEventUpdate();
    }
  }
}

// =============================================================================
// EVENT UPDATE NOTIFICATION
// =============================================================================

/**
 * Trigger event update notification
 * This function should be called whenever events are modified
 */
function triggerEventUpdate() {
  // Dispatch custom event for the main application to listen to
  const event = new CustomEvent('eventsUpdated', {
    detail: { events: getEvents() }
  });
  document.dispatchEvent(event);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get next available ID
 * @returns {number} Next available ID
 */
export function getNextId() {
  return nextId;
}

/**
 * Set next available ID
 * @param {number} id - Next ID to use
 */
export function setNextId(id) {
  nextId = id;
}

/**
 * Get current editing ID
 * @returns {number|null} Current editing ID or null
 */
export function getEditingId() {
  return editingId;
}

/**
 * Clear editing state
 */
export function clearEditingState() {
  editingId = null;
}

/**
 * Check if an event is currently being edited
 * @returns {boolean} True if editing, false otherwise
 */
export function isEditing() {
  return editingId !== null;
}

// =============================================================================
// EXPORT INTERFACE
// =============================================================================

// Main interface for external use
export const EventManager = {
  // Initialization
  initialize: initializeEventManager,
  
  // Data management
  getEvents,
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  findEventById,
  findEventByEventId,
  
  // Form management
  showForm,
  hideForm,
  resetForm,
  populateCategories,
  populateRowDropdown,
  populateParentDropdown,
  
  // Event operations
  editEvent,
  deleteEvent,
  
  // Utility
  getNextId,
  setNextId,
  getEditingId,
  clearEditingState,
  isEditing
};

// Default export
export default EventManager;