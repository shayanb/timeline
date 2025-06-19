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
  initializeZoomAndPan, initializeDevelopmentFeatures
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
let startDate = new Date(2020, 0, 1);
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
  initializeDevelopmentFeatures();
  initializeDevelopmentTests(update);
  
  // Load initial data
  await loadInitialData();
  
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
        
        console.log(`Loaded ${events.length} events from data/events.yaml`);
      }
    }
  } catch (error) {
    console.log('No initial data file found or error loading:', error.message);
    console.log('Starting with empty timeline');
  }
}

/**
 * Update date range based on current events
 */
function updateDateRangeFromEvents() {
  if (events.length === 0) return;
  
  const dates = events.map(e => e.start).concat(
    events.filter(e => e.type === 'range').map(e => e.end)
  );
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Add padding
  startDate = new Date(minDate.getFullYear() - 1, 0, 1);
  endDate = new Date(maxDate.getFullYear() + 1, 11, 31);
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
    
    // Merge with existing events
    events = [...events, ...result.mappedEvents];
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
  const currentStartDate = timelineState?.currentStartDate || startDate;
  const currentEndDate = timelineState?.currentEndDate || endDate;
  
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
  
  // Initialize zoom and pan functionality
  const timelineContainer = document.getElementById('timeline-container');
  if (timelineContainer) {
    initializeZoomAndPan(
      timelineContainer, 
      currentStartDate, 
      currentEndDate, 
      update,
      currentMonthDisplay
    );
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