// Interactive Timeline Script - Main Application Entry Point
// This is the main orchestrator that coordinates all the modular components

// Import modular functionality
import { 
  // Configuration and constants
  APP_VERSION, COPYRIGHT, DEFAULT_MILESTONE_EMOJI,
  updateModificationStatus, setUnsavedChanges, getUnsavedChanges,
  initializePNGExport, initializeAppMetadata, isDevelopmentMode
} from './js/config.js';

import { 
  // Date formatting and calculations
  formatDate, formatMonth, getMonthsBetween,
  // Position and width calculations
  calculatePosition, calculateWidth,
  // Event overlap detection and row calculations
  eventsOverlap, calculateEventRow,
  // Sorting and grouping utilities
  sortByDate, groupByCategory,
  // General utility functions
  randomColor, getMilestoneEmoji, normalizeCountryName,
  // CSV parsing utilities
  splitCSVLine, parseCSV,
  // Animation and easing utilities
  easeOutQuint, easeInOutQuint, SmoothAnimation
} from './js/utils.js';

import {
  // Data management functions
  processImportedData, parseFileContent, eventsToCSV, eventsToYAMLData,
  normalizeEventsForExport, showImportStats, downloadFile, readFile, getFileExtension,
  testComprehensiveImportExport, testParentChildPreservation
} from './js/data-manager.js';

import {
  // Event manager functions
  EventManager, initializeEventManager, getEvents, setEvents,
  addEvent, updateEvent, removeEvent, findEventById,
  showForm, hideForm, resetForm, editEvent, deleteEvent
} from './js/event-manager.js';

import {
  // Timeline rendering functions
  updateTimeline, renderMonthHeaders, renderCategoryRows,
  renderRangeEvents, renderMilestoneEvents, renderLifeEvents,
  renderTodayMarker, getCurrentTimelineRange, setTimelineRange
} from './js/timeline-renderer.js';

import {
  // UI components and controls
  populateCategories, populateRowDropdown, updateParentDropdown,
  setupButtonHandlers, initializeSemanticDropdowns,
  initializeZoomAndPan
} from './js/ui-components.js';

import {
  // Interaction functionality
  handleZoom, resetView, moveTimelineElements, updateDateRange,
  getTimelineState, setTimelineState
} from './js/interactions.js';

import {
  // Visualization functions
  initializeWorldData, renderWorldHeatmap, renderNestedPieChart,
  renderAllVisualizations, clearVisualizations
} from './js/visualizations.js';

import {
  // Testing functions
  initializeDevelopmentTests
} from './js/tests.js';

// =============================================================================
// GLOBAL APPLICATION STATE
// =============================================================================

// Application state
let events = [];
let nextId = 1;
let startDate = new Date(2018, 0, 1);  // Set to match actual data range
let endDate = new Date(2025, 11, 31);

// =============================================================================
// MAIN APPLICATION INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Timeline Application...');
  
  // Initialize app metadata (version and copyright)
  initializeAppMetadata();
  
  // Initialize PNG export functionality
  initializePNGExport();
  
  // Initialize event manager
  initializeEventManager();
  
  // Initialize modification status
  updateModificationStatus();
  
  // Initialize world data for visualizations
  try {
    await initializeWorldData();
    console.log('World geographic data loaded successfully');
  } catch (error) {
    console.warn('Failed to load world geographic data:', error);
  }
  
  // Setup UI components
  setupUIComponents();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize development features if in development mode
  initializeDevelopmentTests(update);
  
  // Load initial data
  console.log('About to load initial data...');
  await loadInitialData();
  console.log('Data loaded, now calling update()...');
  
  // Initial render
  update();
  
  console.log('Timeline Application initialized successfully');
});

// =============================================================================
// UI SETUP AND EVENT LISTENERS
// =============================================================================

/**
 * Setup UI components and dropdowns
 */
function setupUIComponents() {
  // Initialize Semantic UI dropdowns
  initializeSemanticDropdowns((value) => {
    // Category change handler
    const typeInput = document.getElementById('event-type');
    if (typeInput && typeInput.value === 'range') {
      populateRowDropdown(value, null, events);
    }
  });
  
  // Populate parent dropdown
  updateParentDropdown(events);
}

/**
 * Setup main event listeners
 */
function setupEventListeners() {
  // Setup button handlers
  setupButtonHandlers({
    events,
    onAddEvent: handleAddEvent,
    onCloseForm: hideForm,
    onCancelEdit: handleCancelEdit,
    onImportFile: handleImportFile,
    onExportYaml: handleExportYaml,
    onExportCsv: handleExportCsv,
    onExportPng: handleExportPng,
    onClearAll: handleClearAll,
    onParentChange: handleParentChange,
    onTypeChange: handleTypeChange
  });
  
  // Listen for events updated from event manager
  document.addEventListener('eventsUpdated', (e) => {
    events = e.detail.events;
    update();
  });
  
  // Window resize listener
  window.addEventListener('resize', debounce(() => {
    if (events.some(event => event.type === 'life')) {
      update();
    }
  }, 250));
}

// =============================================================================
// DATA LOADING AND MANAGEMENT
// =============================================================================

/**
 * Load initial data from YAML file
 */
async function loadInitialData() {
  try {
    const response = await fetch('data/events.yaml');
    const yamlText = await response.text();
    
    if (typeof jsyaml !== 'undefined') {
      const yamlData = jsyaml.load(yamlText);
      if (Array.isArray(yamlData)) {
        const result = processImportedData(yamlData, nextId);
        events = result.mappedEvents;
        nextId = result.nextId;
        
        // Update event manager with loaded events
        setEvents(events);
        
        // Update date range based on loaded events
        updateDateRangeFromEvents();
        
        // Force reset of timeline state to use new date range
        if (window.timelineState) {
          console.log('Resetting timeline state with new date range');
          window.timelineState.currentStartDate = new Date(startDate);
          window.timelineState.currentEndDate = new Date(endDate);
          window.timelineState.originalStartDate = new Date(startDate);
          window.timelineState.originalEndDate = new Date(endDate);
          window.timelineState.isZoomed = false;
        }
        
        console.log(`Loaded ${events.length} events from data/events.yaml`);
        
        // Force an immediate update after data loading
        console.log('Forcing timeline update after data load...');
        update();
      }
    }
  } catch (error) {
    console.log('No initial data file found or error loading:', error.message);
    console.log('Starting with empty timeline');
  }
}

/**
 * Update date range based on current events to center them in the timeline
 */
function updateDateRangeFromEvents() {
  console.log('updateDateRangeFromEvents called with', events.length, 'events');
  if (events.length === 0) return;
  
  const dates = events.map(e => e.start).concat(
    events.filter(e => e.type === 'range').map(e => e.end)
  );
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  console.log('Date range calculated:', formatDate(minDate), 'to', formatDate(maxDate));
  
  // Calculate the actual data range
  const dataRange = maxDate.getTime() - minDate.getTime();
  
  // Add smart padding based on data density
  // For shorter data ranges, add more relative padding to center items better
  const dayInMs = 24 * 60 * 60 * 1000;
  const dataRangeInDays = dataRange / dayInMs;
  
  let paddingDays;
  if (dataRangeInDays <= 30) {
    // For very short ranges, add 6 months padding on each side
    paddingDays = 180;
  } else if (dataRangeInDays <= 365) {
    // For ranges up to a year, add 3 months padding
    paddingDays = 90;
  } else {
    // For longer ranges, add 6 months padding
    paddingDays = 180;
  }
  
  startDate = new Date(minDate.getTime() - (paddingDays * dayInMs));
  endDate = new Date(maxDate.getTime() + (paddingDays * dayInMs));
  
  console.log(`Auto-scaled timeline: ${formatDate(startDate)} to ${formatDate(endDate)} (data: ${formatDate(minDate)} to ${formatDate(maxDate)})`);
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle add event button click
 */
function handleAddEvent() {
  populateCategories(events);
  updateParentDropdown(events);
  showForm();
}

/**
 * Handle cancel edit
 */
function handleCancelEdit() {
  resetForm();
  hideForm();
}

/**
 * Handle file import
 */
async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const fileContent = await readFile(file);
    const fileType = getFileExtension(file.name);
    
    const data = parseFileContent(fileContent, fileType);
    const result = processImportedData(data, nextId);
    
    // Replace existing events with imported data
    events = result.mappedEvents;
    nextId = result.nextId;
    
    // Update event manager
    setEvents(events);
    
    // Update date range
    updateDateRangeFromEvents();
    
    // Show import stats
    showImportStats(result.mappedEvents, fileType);
    
    // Mark as having unsaved changes
    setUnsavedChanges(true);
    updateModificationStatus();
    
    // Re-render timeline
    update();
    
    console.log(`Successfully imported ${result.mappedEvents.length} events`);
  } catch (error) {
    console.error('Import failed:', error);
    alert(`Import failed: ${error.message}`);
  }
  
  // Clear the file input
  event.target.value = '';
}

/**
 * Handle YAML export
 */
function handleExportYaml() {
  try {
    if (typeof jsyaml === 'undefined') {
      alert('YAML export not available - js-yaml library not loaded');
      return;
    }
    
    const exportData = eventsToYAMLData(normalizeEventsForExport(events));
    const yamlContent = jsyaml.dump(exportData);
    const filename = `timeline-events-${new Date().toISOString().slice(0, 10)}.yaml`;
    
    downloadFile(yamlContent, filename, 'text/yaml');
    
    // Clear unsaved changes flag
    setUnsavedChanges(false);
    updateModificationStatus();
  } catch (error) {
    console.error('YAML export failed:', error);
    alert(`Export failed: ${error.message}`);
  }
}

/**
 * Handle CSV export
 */
function handleExportCsv() {
  try {
    const csvContent = eventsToCSV(normalizeEventsForExport(events));
    const filename = `timeline-events-${new Date().toISOString().slice(0, 10)}.csv`;
    
    downloadFile(csvContent, filename, 'text/csv');
    
    // Clear unsaved changes flag
    setUnsavedChanges(false);
    updateModificationStatus();
  } catch (error) {
    console.error('CSV export failed:', error);
    alert(`Export failed: ${error.message}`);
  }
}

/**
 * Handle PNG export
 */
function handleExportPng() {
  if (typeof html2canvas === 'undefined') {
    alert('PNG export not available - html2canvas library not loaded');
    return;
  }
  
  const timelineContainer = document.getElementById('timeline-container');
  if (!timelineContainer) {
    alert('Timeline container not found');
    return;
  }
  
  // Hide any temporary elements that shouldn't be in the export
  const tooltip = document.getElementById('tooltip');
  const originalTooltipDisplay = tooltip ? tooltip.style.display : '';
  if (tooltip) tooltip.style.display = 'none';
  
  html2canvas(timelineContainer, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true
  }).then(canvas => {
    // Restore tooltip
    if (tooltip) tooltip.style.display = originalTooltipDisplay;
    
    // Create download link
    const link = document.createElement('a');
    link.download = `timeline-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }).catch(error => {
    // Restore tooltip on error
    if (tooltip) tooltip.style.display = originalTooltipDisplay;
    console.error('PNG export failed:', error);
    alert(`PNG export failed: ${error.message}`);
  });
}

/**
 * Handle clear all data
 */
function handleClearAll() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    events = [];
    nextId = 1;
    setEvents(events);
    update();
    console.log('All data cleared');
  }
}

/**
 * Handle parent input change
 */
function handleParentChange(value) {
  const removeParentBtn = document.getElementById('remove-parent-btn');
  if (removeParentBtn) {
    removeParentBtn.style.display = value ? 'block' : 'none';
  }
}

/**
 * Handle type input change
 */
function handleTypeChange() {
  const typeInput = document.getElementById('event-type');
  const endDateField = document.getElementById('end-date-field');
  const rowField = document.getElementById('row-field');
  
  if (!typeInput) return;
  
  const type = typeInput.value;
  
  // Show/hide end date field
  if (endDateField) {
    endDateField.style.display = (type === 'range') ? 'block' : 'none';
  }
  
  // Show/hide row field for range and milestone events
  if (rowField) {
    if (type === 'range' || type === 'milestone') {
      rowField.style.display = 'block';
      
      // Populate row dropdown options
      const categoryInput = document.getElementById('category');
      const currentCategory = categoryInput ? categoryInput.value : '';
      populateRowDropdown(currentCategory, null, events);
    } else {
      rowField.style.display = 'none';
    }
  }
}

// =============================================================================
// MAIN UPDATE FUNCTION
// =============================================================================

/**
 * Main update function - renders the entire timeline
 */
function update() {
  console.log('Updating timeline...');
  
  // Get current timeline state for zoom/pan
  const timelineState = getTimelineState();
  let currentStartDate, currentEndDate;
  
  // On initial load or when not zoomed, use the calculated date range
  if (!timelineState || !timelineState.isZoomed) {
    currentStartDate = startDate;
    currentEndDate = endDate;
    console.log('Using calculated date range:', formatDate(currentStartDate), 'to', formatDate(currentEndDate));
    
    // Update timeline state to match our calculated range
    if (timelineState) {
      timelineState.currentStartDate = new Date(startDate);
      timelineState.currentEndDate = new Date(endDate);
    }
  } else {
    // Use zoomed/panned dates when available
    currentStartDate = timelineState.currentStartDate || startDate;
    currentEndDate = timelineState.currentEndDate || endDate;
    console.log('Using timeline state dates:', formatDate(currentStartDate), 'to', formatDate(currentEndDate));
  }
  
  // Update timeline using the timeline renderer
  updateTimeline(events, currentStartDate, currentEndDate, editEvent);
  
  // Update month display
  const currentMonthDisplay = document.getElementById('current-month-display');
  if (currentMonthDisplay) {
    currentMonthDisplay.textContent = `${formatMonth(currentStartDate)} - ${formatMonth(currentEndDate)}`;
  }
  
  // Update UI components
  populateCategories(events);
  updateParentDropdown(events);
  
  // Render visualizations
  renderAllVisualizations(events, [currentStartDate, currentEndDate], update, {
    showCategoryEventsCallback: null // Will be set up by the visualization module
  });
  
  // Initialize zoom and pan functionality (zoom controls + scroll wheel zoom)
  const timelineContainer = document.getElementById('timeline-container');
  const monthDisplay = document.getElementById('current-month-display');
  if (timelineContainer && !timelineContainer.dataset.panInitialized) {
    console.log('Initializing zoom controls and scroll wheel zoom...');
    timelineContainer.dataset.panInitialized = 'true';
    initializeZoomAndPan(
      timelineContainer, 
      currentStartDate, 
      currentEndDate, 
      update,
      monthDisplay
    );
  }
  
  // Drag functionality - Working implementation  
  const timelineDiv = document.getElementById('timeline');
  if (timelineDiv && !timelineDiv.dataset.directDragSetup) {
    console.log('Setting up drag functionality on timeline');
    timelineDiv.dataset.directDragSetup = 'true';
    timelineDiv.style.cursor = 'grab';
    timelineDiv.title = 'Drag to pan timeline';
    
    let isDragging = false;
    let dragStartX = 0;
    let lastUpdateTime = 0;
    
    // Ensure timeline state exists (should be created by initializeZoomAndPan above)
    if (!window.timelineState) {
      console.warn('Timeline state not found, creating minimal state for drag');
      window.timelineState = {
        currentStartDate: new Date(currentStartDate),
        currentEndDate: new Date(currentEndDate),
        isZoomed: false
      };
    }
    
    timelineDiv.addEventListener('mousedown', function(e) {
      console.log('Starting drag operation');
      
      // Skip interactive elements
      if (e.target.closest('.action-button') || 
          e.target.closest('.milestone-dot') || 
          e.target.classList.contains('timeline-event')) {
        return;
      }
      
      isDragging = true;
      dragStartX = e.clientX;
      timelineDiv.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      // console.log('Mouse move during drag'); // Commented out to reduce console spam
      const currentX = e.clientX;
      const deltaX = currentX - dragStartX;
      
      // Get current timeline state
      const timelineState = getTimelineState();
      if (!timelineState) return;
      
      // Calculate date range shift
      const container = document.getElementById('timeline-container');
      const containerRect = container.getBoundingClientRect();
      const effectiveWidth = containerRect.width - 180; // Account for category labels
      const dateRangeMillis = timelineState.currentEndDate.getTime() - timelineState.currentStartDate.getTime();
      const millisPerPixel = dateRangeMillis / effectiveWidth;
      
      // Apply shift with damping
      const shift = deltaX * millisPerPixel * -0.5; // Damping factor
      
      // Update dates
      const newStartDate = new Date(timelineState.currentStartDate.getTime() + shift);
      const newEndDate = new Date(timelineState.currentEndDate.getTime() + shift);
      
      // Update timeline state
      timelineState.currentStartDate = newStartDate;
      timelineState.currentEndDate = newEndDate;
      timelineState.isZoomed = true;
      
      // Update month display
      const monthDisplay = document.getElementById('current-month-display');
      if (monthDisplay) {
        monthDisplay.textContent = `${formatMonth(newStartDate)} - ${formatMonth(newEndDate)}`;
      }
      
      // Update drag start position for next movement
      dragStartX = currentX;
      
      // Throttle updates for performance
      const now = Date.now();
      if (now - lastUpdateTime > 50) { // Update every 50ms
        requestAnimationFrame(() => {
          update();
          lastUpdateTime = now;
        });
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        console.log('Mouse up - ending drag');
        isDragging = false;
        timelineDiv.style.cursor = 'grab';
        
        // Final update
        update();
      }
    });
  }
  
  console.log(`Timeline updated with ${events.length} events`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// =============================================================================
// GLOBAL EXPORTS FOR TESTING AND DEBUGGING
// =============================================================================

// Export functions to global scope for testing and debugging
if (isDevelopmentMode()) {
  window.testParentChildPreservation = testParentChildPreservation;
  window.testComprehensiveImportExport = testComprehensiveImportExport;
  window.timelineApp = {
    events: () => events,
    update,
    addEvent,
    removeEvent,
    editEvent,
    exportYaml: handleExportYaml,
    exportCsv: handleExportCsv
  };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Timeline Application Error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

console.log('Timeline Application script loaded successfully');