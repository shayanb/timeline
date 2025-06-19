// UI Components Module
// Handles general UI components, button handlers, tooltips, modals, zoom controls, and import/export UI

import { 
  randomColor, calculateEventRow, sortByDate, groupByCategory, 
  formatDate, formatMonth, easeOutQuint, easeInOutQuint, SmoothAnimation,
  normalizeCountryName
} from './utils.js';
import { 
  setUnsavedChanges, updateModificationStatus, isDevelopmentMode 
} from './config.js';

// =============================================================================
// FORM VISIBILITY FUNCTIONS
// =============================================================================

/**
 * Show the event form modal
 */
export function showForm() {
  const formContainer = document.getElementById('form-container');
  if (formContainer) {
    formContainer.classList.add('open');
  }
}

/**
 * Hide the event form modal
 */
export function hideForm() {
  const formContainer = document.getElementById('form-container');
  if (formContainer) {
    formContainer.classList.remove('open');
  }
}

// =============================================================================
// DROPDOWN POPULATION FUNCTIONS
// =============================================================================

/**
 * Populate category dropdown from existing categories in events
 * @param {Array} events - Array of events to extract categories from
 */
export function populateCategories(events = []) {
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
      
      // Set up parent removal button event handler
      const removeParentBtn = document.getElementById('remove-parent-btn');
      const parentInput = document.getElementById('parent-event');
      if (removeParentBtn) {
        removeParentBtn.onclick = function() {
          if (parentInput) {
            parentInput.value = '';
          }
          removeParentBtn.style.display = 'none';
          // Mark as modified
          setUnsavedChanges(true);
          updateModificationStatus();
        };
      }
      
      // Refresh the dropdown
      try {
        $('#category-dropdown').dropdown('refresh');
      } catch (e) {
        console.error('Error refreshing category dropdown:', e);
      }
    }
  }
}

/**
 * Populate row dropdown based on category's existing events
 * @param {string} category - Category to populate rows for
 * @param {number|null} currentRow - Currently selected row
 * @param {Array} events - Array of events to calculate rows from
 */
export function populateRowDropdown(category, currentRow = null, events = []) {
  const rowInput = document.getElementById('event-row');
  if (!rowInput) return;
  
  // Clear existing options
  rowInput.innerHTML = '';
  
  // Get max row number for this category + 1 for a new row
  let maxRow = 0;
  
  if (category) {
    // Get all range events in this category
    const categoryEvents = events.filter(e => 
      e.type === 'range' && e.category === category
    );
    
    // Find the highest row number
    for (const event of categoryEvents) {
      if (event.row !== undefined && event.row !== null) {
        maxRow = Math.max(maxRow, event.row);
      }
    }
  }
  
  // Add options from 0 to maxRow + 1
  for (let i = 0; i <= maxRow + 1; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i === 0 ? 'Top Row (0)' : i;
    rowInput.appendChild(option);
  }
  
  // If we have a current row value, try to select it
  if (currentRow !== null && currentRow !== undefined) {
    rowInput.value = currentRow;
  }
}

/**
 * Update parent dropdown with available parent events
 * @param {Array} events - Array of all events
 */
export function updateParentDropdown(events = []) {
  const parentInput = document.getElementById('parent-event');
  if (!parentInput) return;
  
  // Clear current options except the "None" option
  parentInput.innerHTML = '<option value="">None</option>';
  
  // Find all potential parents - range events that are marked as parent or that don't have a parent themselves
  const potentialParents = events.filter(ev => 
    ev.type === 'range' && (ev.isParent || !ev.parent)
  );
  
  // Add options sorted alphabetically
  potentialParents.sort((a, b) => a.title.localeCompare(b.title)).forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = ev.title;
    if (ev.isParent) {
      opt.textContent += ' (Parent)';
      opt.style.fontWeight = 'bold';
    }
    parentInput.appendChild(opt);
  });
  
  // Refresh the dropdown if using Semantic UI
  if (window.$ && $.fn.dropdown) {
    try {
      $('#parent-event').dropdown('refresh');
    } catch (e) {
      console.error('Error refreshing parent dropdown:', e);
    }
  }
}

// =============================================================================
// IMPORT STATS DISPLAY
// =============================================================================

/**
 * Display import statistics after file import
 * @param {Array} data - Imported event data
 * @param {string} fileType - Type of file imported (yaml, csv, etc.)
 */
export function showImportStats(data, fileType) {
  const statsElement = document.getElementById('import-stats');
  const statsText = document.getElementById('import-stats-text');
  
  if (!statsElement || !statsText) return;
  
  // Calculate stats
  const eventCount = data.length;
  const categories = new Set();
  const locations = new Set();
  let rangeEvents = 0;
  let lifeEvents = 0;
  let milestones = 0;
  
  data.forEach(event => {
    if (event.category) categories.add(event.category);
    if (event.location && event.location.country) locations.add(event.location.country);
    
    switch(event.type) {
      case 'range': rangeEvents++; break;
      case 'life': lifeEvents++; break;
      case 'milestone': milestones++; break;
    }
  });
  
  // Set stats text
  statsText.innerHTML = `Imported ${eventCount} events from ${fileType.toUpperCase()}. 
                       <br>Categories: ${categories.size}, Locations: ${locations.size}
                       <br>Types: ${rangeEvents} ranges, ${lifeEvents} life events, ${milestones} milestones`;
  
  // Show stats (don't auto-hide)
  statsElement.style.display = 'block';
}

// =============================================================================
// ZOOM AND PAN CONTROLS
// =============================================================================

/**
 * Initialize zoom and pan functionality for timeline
 * @param {HTMLElement} container - Timeline container element
 * @param {Date} initialStartDate - Initial start date for timeline
 * @param {Date} initialEndDate - Initial end date for timeline
 * @param {Function} updateCallback - Callback function to update timeline display
 */
export function initializeZoomAndPan(container, initialStartDate, initialEndDate, updateCallback) {
  const currentMonthDisplay = document.getElementById('current-month-display');
  
  // Store original date range globally to make it accessible to the update function
  if (!window.timelineState) {
    window.timelineState = {
      originalStartDate: new Date(initialStartDate),
      originalEndDate: new Date(initialEndDate),
      currentStartDate: new Date(initialStartDate),
      currentEndDate: new Date(initialEndDate),
      isZooming: false,
      isDragging: false,
      zoomControlsAdded: false,  // Flag to track if zoom controls have been added
      isZoomed: false           // Flag to track if currently zoomed
    };
  } else {
    // Keep original dates but update current dates if not zoomed
    if (!window.timelineState.isZoomed) {
      window.timelineState.currentStartDate = new Date(initialStartDate);
      window.timelineState.currentEndDate = new Date(initialEndDate);
    }
  }
  
  const state = window.timelineState;
  
  // Only add zoom controls if they haven't been added before
  if (!state.zoomControlsAdded) {
    // Remove any existing controls first (just to be safe)
    const existingControls = document.querySelector('.zoom-controls');
    if (existingControls) {
      existingControls.remove();
    }
    
    // Add zoom controls directly to the DOM, not depending on container
    const zoomControlsContainer = document.createElement('div');
    zoomControlsContainer.id = 'timeline-zoom-controls';
    zoomControlsContainer.className = 'zoom-controls';
    
    // Force inline styles to ensure visibility - position INSIDE timeline
    zoomControlsContainer.style.display = 'flex';
    zoomControlsContainer.style.flexDirection = 'column';
    zoomControlsContainer.style.position = 'fixed';
    zoomControlsContainer.style.top = 'auto';
    zoomControlsContainer.style.bottom = '30px';
    zoomControlsContainer.style.right = '30px';
    zoomControlsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    zoomControlsContainer.style.padding = '8px';
    zoomControlsContainer.style.borderRadius = '8px';
    zoomControlsContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
    zoomControlsContainer.style.zIndex = '1000';
    
    // Add directly to the timeline container for proper positioning
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
      timelineContainer.appendChild(zoomControlsContainer);
    } else {
      container.appendChild(zoomControlsContainer);
    }
    
    // Create zoom buttons
    createZoomButtons(zoomControlsContainer, state, currentMonthDisplay, updateCallback);
    
    // Mark that controls have been added
    state.zoomControlsAdded = true;
  }
  
  // Add scroll wheel zoom
  addScrollWheelZoom(container, state, currentMonthDisplay, updateCallback);
}

/**
 * Create zoom control buttons
 * @param {HTMLElement} container - Container to add buttons to
 * @param {Object} state - Timeline state object
 * @param {HTMLElement} currentMonthDisplay - Element showing current month range
 * @param {Function} updateCallback - Callback to update timeline
 */
function createZoomButtons(container, state, currentMonthDisplay, updateCallback) {
  // Zoom in button
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-button';
  zoomInBtn.innerHTML = '+';
  zoomInBtn.title = 'Zoom In';
  zoomInBtn.addEventListener('click', () => handleZoom(0.7, state, currentMonthDisplay, updateCallback));
  container.appendChild(zoomInBtn);
  
  // Zoom out button
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-button';
  zoomOutBtn.innerHTML = '−';
  zoomOutBtn.title = 'Zoom Out';
  zoomOutBtn.addEventListener('click', () => handleZoom(1.4, state, currentMonthDisplay, updateCallback));
  container.appendChild(zoomOutBtn);
  
  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'zoom-button reset-button';
  resetBtn.innerHTML = '↺';
  resetBtn.title = 'Reset View';
  resetBtn.addEventListener('click', () => resetView(state, currentMonthDisplay, updateCallback));
  container.appendChild(resetBtn);
}

/**
 * Handle manual zoom with buttons
 * @param {number} factor - Zoom factor (< 1 = zoom in, > 1 = zoom out)
 * @param {Object} state - Timeline state object
 * @param {HTMLElement} currentMonthDisplay - Element showing current month range
 * @param {Function} updateCallback - Callback to update timeline
 */
function handleZoom(factor, state, currentMonthDisplay, updateCallback) {
  // Don't handle if already zooming
  if (state.isZooming) return;
  state.isZooming = true;
  
  // Calculate new date range
  const currentRange = state.currentEndDate.getTime() - state.currentStartDate.getTime();
  const newRange = currentRange * factor;
  
  // Get the midpoint of the current view
  const midPoint = new Date(state.currentStartDate.getTime() + currentRange / 2);
  
  // Calculate new start and end dates
  const newStart = new Date(midPoint.getTime() - newRange / 2);
  const newEnd = new Date(midPoint.getTime() + newRange / 2);
  
  // Make sure to update the global timeline state for persistence
  if (window.timelineState) {
    window.timelineState.isZoomed = true;
  }
  
  // Store old dates for animation
  const oldStart = new Date(state.currentStartDate);
  const oldEnd = new Date(state.currentEndDate);
  
  // Use the animation system for smooth transition
  new SmoothAnimation({
    duration: 700,
    easing: easeInOutQuint,
    onUpdate: (progress) => {
      // Calculate interpolated dates
      const startDiff = newStart.getTime() - oldStart.getTime();
      const endDiff = newEnd.getTime() - oldEnd.getTime();
      
      const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
      const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
      
      // Update state and display
      state.currentStartDate = interpolatedStart;
      state.currentEndDate = interpolatedEnd;
      state.isZoomed = true;
      
      // Update the UI - always update the month display
      if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      }
      
      // Only do full visual updates on certain progress points
      const updatePoints = [0, 0.25, 0.5, 0.75, 0.9, 1];
      const nearestPoint = updatePoints.find(point => 
        Math.abs(progress - point) < 0.05
      );
      
      if (nearestPoint !== undefined && updateCallback) {
        updateCallback();
      }
    },
    onComplete: () => {
      // Final update with exact target dates
      state.currentStartDate = newStart;
      state.currentEndDate = newEnd;
      if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      }
      if (updateCallback) {
        updateCallback();
      }
      state.isZooming = false;
    }
  }).start();
}

/**
 * Reset zoom to original view
 * @param {Object} state - Timeline state object
 * @param {HTMLElement} currentMonthDisplay - Element showing current month range
 * @param {Function} updateCallback - Callback to update timeline
 */
function resetView(state, currentMonthDisplay, updateCallback) {
  // Don't handle if already zooming
  if (state.isZooming) return;
  state.isZooming = true;
  
  // Store target (original) dates from the global timeline state
  const newStart = window.timelineState ? 
    new Date(window.timelineState.originalStartDate) : new Date(state.originalStartDate);
  const newEnd = window.timelineState ? 
    new Date(window.timelineState.originalEndDate) : new Date(state.originalEndDate);
    
  // Clear the zoomed flag
  if (window.timelineState) {
    window.timelineState.isZoomed = false;
  }
  
  // Store current dates for animation
  const oldStart = new Date(state.currentStartDate);
  const oldEnd = new Date(state.currentEndDate);
  
  // Use the animation system for smooth reset
  new SmoothAnimation({
    duration: 800,
    easing: easeOutQuint,
    onUpdate: (progress) => {
      // Calculate interpolated dates
      const startDiff = newStart.getTime() - oldStart.getTime();
      const endDiff = newEnd.getTime() - oldEnd.getTime();
      
      const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
      const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
      
      // Update state and display
      state.currentStartDate = interpolatedStart;
      state.currentEndDate = interpolatedEnd;
      
      // Update the UI - always update month display for smooth visual feedback
      if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      }
      
      // Use strategic update points for better performance
      const updatePoints = [0, 0.2, 0.4, 0.6, 0.8, 1];
      const nearestPoint = updatePoints.find(point => 
        Math.abs(progress - point) < 0.05
      );
      
      if (nearestPoint !== undefined && updateCallback) {
        updateCallback();
      }
    },
    onComplete: () => {
      // Final update with exact target dates
      state.currentStartDate = newStart;
      state.currentEndDate = newEnd;
      state.isZoomed = false;
      
      // Update the global timeline state
      if (window.timelineState) {
        window.timelineState.currentStartDate = new Date(newStart);
        window.timelineState.currentEndDate = new Date(newEnd);
        window.timelineState.isZoomed = false;
      }
      
      if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      }
      if (updateCallback) {
        updateCallback();
      }
      state.isZooming = false;
    }
  }).start();
}

/**
 * Add scroll wheel zoom functionality
 * @param {HTMLElement} container - Container element
 * @param {Object} state - Timeline state object
 * @param {HTMLElement} currentMonthDisplay - Element showing current month range
 * @param {Function} updateCallback - Callback to update timeline
 */
function addScrollWheelZoom(container, state, currentMonthDisplay, updateCallback) {
  let zoomTimeout = null;
  let pendingZoom = null;
  let lastWheelTime = 0;
  
  // Function to process zoom events
  function processZoom(event) {
    if (state.isZooming) return;
    state.isZooming = true;
    
    // Determine direction and create zoom factor
    const direction = event.deltaY < 0 ? -1 : 1;
    const factor = direction < 0 ? 0.9 : 1.1;
    
    // Get mouse position for zoom target
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    
    // Adjust for the category label width (180px)
    const effectiveWidth = containerRect.width - 180;
    const effectiveMouseX = mouseX - 180; 
    
    if (effectiveMouseX > 0) { // Only zoom if mouse is in the timeline area
      const mousePosition = effectiveMouseX / effectiveWidth;
      const totalTime = state.currentEndDate.getTime() - state.currentStartDate.getTime();
      const zoomCenterDate = new Date(state.currentStartDate.getTime() + totalTime * mousePosition);
      
      // Ensure timeline state knows we're zoomed
      if (window.timelineState) {
        window.timelineState.isZoomed = true;
      }
      
      // Calculate new date range
      const newRange = totalTime * factor;
      const newStart = new Date(zoomCenterDate.getTime() - newRange * mousePosition);
      const newEnd = new Date(zoomCenterDate.getTime() + newRange * (1 - mousePosition));
      
      // Get current dates for animation
      const oldStart = new Date(state.currentStartDate);
      const oldEnd = new Date(state.currentEndDate);
      
      // Just update the display immediately for responsiveness
      if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${formatMonth(newStart)} - ${formatMonth(newEnd)}`;
      }
      
      // Use the smooth animation system
      new SmoothAnimation({
        duration: 500,
        easing: easeInOutQuint,
        onUpdate: (progress) => {
          // Calculate interpolated dates
          const startDiff = newStart.getTime() - oldStart.getTime();
          const endDiff = newEnd.getTime() - oldEnd.getTime();
          
          const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
          const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
          
          // Update state
          state.currentStartDate = interpolatedStart;
          state.currentEndDate = interpolatedEnd;
          state.isZoomed = true;
          
          // Update global state
          if (window.timelineState) {
            window.timelineState.currentStartDate = new Date(interpolatedStart);
            window.timelineState.currentEndDate = new Date(interpolatedEnd);
            window.timelineState.isZoomed = true;
          }
          
          // Selective updates for performance
          if (progress === 1 || Math.abs(progress - 0.5) < 0.1) {
            if (updateCallback) {
              updateCallback();
            }
          }
        },
        onComplete: () => {
          // Final state update
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          state.isZoomed = true;
          
          if (window.timelineState) {
            window.timelineState.currentStartDate = new Date(newStart);
            window.timelineState.currentEndDate = new Date(newEnd);
          }
          
          if (updateCallback) {
            updateCallback();
          }
          state.isZooming = false;
        }
      }).start();
    } else {
      state.isZooming = false;
    }
  }
  
  // Add wheel event listener with throttling
  container.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    const now = performance.now();
    if (now - lastWheelTime < 50) return; // Throttle to 20fps max
    lastWheelTime = now;
    
    // Clear existing timeout
    if (zoomTimeout) {
      clearTimeout(zoomTimeout);
    }
    
    // Store this zoom event
    pendingZoom = event;
    
    // Process zoom after a brief delay to allow for smooth interaction
    zoomTimeout = setTimeout(() => {
      if (pendingZoom) {
        processZoom(pendingZoom);
        pendingZoom = null;
      }
    }, 16); // ~60fps
  }, { passive: false });
}

// =============================================================================
// TOOLTIP MANAGEMENT
// =============================================================================

/**
 * Initialize tooltip functionality
 * @returns {Object} Tooltip object with show/hide/update methods
 */
export function initializeTooltip() {
  const tooltip = d3.select('#tooltip');
  
  return {
    show: (content, event) => {
      tooltip
        .style('opacity', 1)
        .style('display', 'block')
        .html(content)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`);
    },
    
    hide: () => {
      tooltip.style('opacity', 0);
    },
    
    update: (event) => {
      tooltip
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`);
    }
  };
}

/**
 * Create a map tooltip for geographic visualizations
 * @returns {Object} D3 selection for the tooltip
 */
export function createMapTooltip() {
  return d3.select('body').append('div')
    .attr('class', 'map-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000);
}

/**
 * Create a chart tooltip for data visualizations
 * @returns {Object} D3 selection for the tooltip
 */
export function createChartTooltip() {
  return d3.select('body').append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000);
}

// =============================================================================
// BUTTON EVENT HANDLERS SETUP
// =============================================================================

/**
 * Setup all UI button event handlers
 * @param {Object} config - Configuration object with callbacks and data
 */
export function setupButtonHandlers(config) {
  const {
    events = [],
    editingId,
    form,
    submitBtn,
    typeInput,
    importantCheckbox,
    isParentCheckbox,
    removeParentBtn,
    onAddEvent,
    onCloseForm,
    onCancelEdit,
    onImportFile,
    onExportYaml,
    onExportCsv,
    onExportPng,
    onParentChange,
    onTypeChange
  } = config;

  // Add event button
  const addEventBtn = document.getElementById('add-event-btn');
  if (addEventBtn && onAddEvent) {
    addEventBtn.addEventListener('click', onAddEvent);
  }

  // Close form button
  const closeFormBtn = document.getElementById('close-form-btn');
  if (closeFormBtn && onCloseForm) {
    closeFormBtn.addEventListener('click', onCloseForm);
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn && onCancelEdit) {
    cancelBtn.addEventListener('click', onCancelEdit);
  }

  // Import button
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    if (onImportFile) {
      importFile.addEventListener('change', onImportFile);
    }
  }

  // Export buttons
  const exportYamlBtn = document.getElementById('export-yaml');
  if (exportYamlBtn && onExportYaml) {
    exportYamlBtn.addEventListener('click', onExportYaml);
  }

  const exportCsvBtn = document.getElementById('export-csv');
  if (exportCsvBtn && onExportCsv) {
    exportCsvBtn.addEventListener('click', onExportCsv);
  }

  const exportPngBtn = document.getElementById('export-png');
  if (exportPngBtn && onExportPng) {
    exportPngBtn.addEventListener('click', onExportPng);
  }

  // Parent dropdown change handler
  const parentInput = document.getElementById('parent-event');
  if (parentInput && onParentChange) {
    // Semantic UI dropdown handler
    if (window.$ && $.fn.dropdown) {
      try {
        $('#parent-event').dropdown({
          onChange: onParentChange
        });
      } catch (e) {
        console.error('Error initializing parent dropdown:', e);
      }
    }
    
    // Fallback for non-Semantic UI environments
    parentInput.addEventListener('change', () => {
      if (onParentChange) {
        onParentChange(parentInput.value);
      }
    });
  }

  // Type change handler
  if (typeInput && onTypeChange) {
    typeInput.addEventListener('change', onTypeChange);
  }
}

// =============================================================================
// SEMANTIC UI DROPDOWN INITIALIZATION
// =============================================================================

/**
 * Initialize Semantic UI dropdown components
 * @param {Function} onCategoryChange - Callback for category changes
 */
export function initializeSemanticDropdowns(onCategoryChange) {
  if (window.$ && $.fn.dropdown) {
    // Basic dropdowns
    $('.ui.dropdown').not('#category-dropdown, #country-dropdown').dropdown();
    
    // Category dropdown with allowAdditions
    $('#category-dropdown').dropdown({
      allowAdditions: true,
      fullTextSearch: true,
      message: {
        addResult: 'Add <b>{term}</b>'
      },
      onChange: onCategoryChange || function(value) {
        // Default behavior - update row dropdown options when category changes
        const typeInput = document.getElementById('event-type');
        if (typeInput && typeInput.value === 'range') {
          // This would need to be passed in as a callback
          console.log('Category changed to:', value);
        }
      }
    });
    
    // Country dropdown with search
    $('#country-dropdown').dropdown({
      fullTextSearch: true,
      allowAdditions: true,
      message: {
        addResult: 'Add <b>{term}</b>'
      }
    });
    
    // Populate country dropdown
    populateCountryDropdown();
  }
  
  // Initialize checkboxes
  if (window.$ && $.fn.checkbox) {
    $('.ui.checkbox').checkbox();
  }
}

/**
 * Populate country dropdown with common countries
 */
function populateCountryDropdown() {
  const commonCountries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 
    'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 
    'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 
    'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 
    'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 
    'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 
    'Dominican Republic', 'DR Congo', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 
    'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 
    'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 
    'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 
    'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 
    'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 
    'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 
    'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 
    'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 
    'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 
    'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 
    'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 
    'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 
    'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];
  
  const countryMenu = document.getElementById('country-menu');
  if (countryMenu) {
    // Clear existing items first
    countryMenu.innerHTML = '';
    
    // Add each country to the dropdown
    commonCountries.forEach(country => {
      const item = document.createElement('div');
      item.className = 'item';
      item.setAttribute('data-value', country);
      item.textContent = country;
      countryMenu.appendChild(item);
    });
    
    // Refresh the dropdown to show the new items
    if (window.$ && $.fn.dropdown) {
      $('#country-dropdown').dropdown('refresh');
    }
  }
}

// =============================================================================
// CHART RENDERING FUNCTIONS
// =============================================================================

/**
 * Render world heatmap showing time spent by country
 * @param {Array} events - Array of events to visualize
 * @param {Array} timeDomain - Time range [startDate, endDate]
 * @param {Object} worldGeoJson - GeoJSON data for world map
 */
export function renderWorldHeatmap(events, timeDomain, worldGeoJson) {
  const container = d3.select('#world-heatmap');
  container.selectAll('*').remove();
  
  if (!worldGeoJson) {
    container.append('p').text('Loading world map...');
    return;
  }
  
  const width = container.node().clientWidth || 800;
  const height = 400;
  const projection = d3.geoNaturalEarth1()
    .scale(width / 1.3 / Math.PI)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  
  // Calculate durations per country
  const countryDurations = {};
  const cityData = {};
  const cities = [];
  
  // City coordinates lookup
  const cityCoordinates = {
    // Major cities with coordinates - truncated for brevity
    "New York": [-74.0059, 40.7128],
    "London": [-0.1278, 51.5074],
    "Tokyo": [139.6917, 35.6895],
    "Paris": [2.3522, 48.8566],
    "Sydney": [151.2093, -33.8688],
    // Add more cities as needed...
    "Unknown": [0, 0]
  };
  
  // Apply time domain filtering
  const [startDomain, endDomain] = timeDomain || [new Date(0), new Date(Date.now() + 31536000000)];
  
  // Filter events within the time domain
  const filtered = events.filter(d => {
    if (d.type === 'range') {
      return d.end >= startDomain && d.start <= endDomain;
    }
    return d.start >= startDomain && d.start <= endDomain;
  });
  
  // Process events to calculate country durations
  filtered.forEach(d => {
    const hasDuration = d.type === 'range' && d.end > d.start;
    const isSingleEvent = d.type === 'milestone' || d.type === 'life';
    
    if (hasDuration || isSingleEvent) {
      let country = null;
      let city = null;
      
      // Extract location information
      if (d.location) {
        if (typeof d.location === 'object') {
          country = d.location.country || null;
          city = d.location.city || '';
        } else if (typeof d.location === 'string') {
          country = d.location;
        }
      } else if (d.place) {
        country = d.place;
      }
      
      if (country) {
        // Normalize the country name
        const normalizedCountry = normalizeCountryName(country);
        
        // Calculate duration
        let days = 1; // Default for milestone/life events
        
        if (hasDuration) {
          const visibleStart = d.start < startDomain ? startDomain : d.start;
          const visibleEnd = d.end > endDomain ? endDomain : d.end;
          days = (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24);
        }
        
        // Add to country totals using normalized name
        countryDurations[normalizedCountry] = (countryDurations[normalizedCountry] || 0) + days;
        
        // Track city data using normalized country name
        if (!cityData[normalizedCountry]) {
          cityData[normalizedCountry] = {};
        }
        
        if (city) {
          cityData[normalizedCountry][city] = (cityData[normalizedCountry][city] || 0) + days;
          
          // Add city coordinates for visualization
          const coordinates = cityCoordinates[city] || cityCoordinates[country] || cityCoordinates["Unknown"];
          const existingCity = cities.find(c => c.name === city);
          
          if (!existingCity) {
            cities.push({
              name: city || normalizedCountry,
              coordinates: coordinates,
              days: days,
              color: d.color || '#3B82F6',
              event: d.title,
              country: normalizedCountry
            });
          } else {
            existingCity.days += days;
          }
        }
      }
    }
  });
  
  // Create visualization
  const values = Object.values(countryDurations);
  const max = d3.max(values) || 1;
  const colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, max * 0.7]);
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create map tooltip
  const mapTooltip = createMapTooltip();
  
  // Render countries
  svg.append('g')
    .selectAll('path')
    .data(worldGeoJson.features)
    .join('path')
    .attr('d', path)
    .attr('fill', d => {
      const val = countryDurations[d.properties.name] || 0;
      return val ? colorScale(val) : '#e2e8f0';
    })
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.5)
    .on('mouseover', function(event, d) {
      const country = d.properties.name;
      const days = countryDurations[country] || 0;
      
      if (days > 0) {
        let tooltipContent = `<strong>${country}</strong>: ${Math.round(days)} days<br>`;
        
        if (cityData[country]) {
          tooltipContent += '<ul style="margin: 5px 0; padding-left: 20px;">';
          Object.entries(cityData[country])
            .sort((a, b) => b[1] - a[1])
            .forEach(([city, cityDays]) => {
              tooltipContent += `<li>${city}: ${Math.round(cityDays)} days</li>`;
            });
          tooltipContent += '</ul>';
        }
        
        mapTooltip.html(tooltipContent)
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      }
    })
    .on('mousemove', function(event) {
      mapTooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      mapTooltip.style('opacity', 0);
    });
  
  // Add city dots
  svg.selectAll('circle.city-dot')
    .data(cities)
    .join('circle')
    .attr('class', 'city-dot')
    .attr('cx', d => {
      try {
        const proj = projection(d.coordinates);
        return proj ? proj[0] : null;
      } catch (e) {
        return null;
      }
    })
    .attr('cy', d => {
      try {
        const proj = projection(d.coordinates);
        return proj ? proj[1] : null;
      } catch (e) {
        return null;
      }
    })
    .attr('r', d => Math.min(12, Math.max(4, 3 + Math.sqrt(d.days) * 0.8)))
    .attr('fill', d => d.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', d => Math.min(15, Math.max(5, (3 + Math.sqrt(d.days) * 0.8) * 1.3)));
      
      const tooltipContent = `
        <div style="font-weight: bold; margin-bottom: 4px;">${d.name}, ${d.country}</div>
        <div style="margin-bottom: 3px;">${d.event}</div>
        <div>${Math.round(d.days)} days</div>
      `;
      
      mapTooltip.html(tooltipContent)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function(d) {
      d3.select(this).attr('r', d => Math.min(12, Math.max(4, 3 + Math.sqrt(d.days) * 0.8)));
      mapTooltip.style('opacity', 0);
    });
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(`Time Spent by Country (${formatMonth(startDomain)} - ${formatMonth(endDomain)})`);
}

/**
 * Render nested pie chart showing time by location and category
 * @param {Array} events - Array of events to visualize
 * @param {Array} timeDomain - Time range [startDate, endDate]
 * @param {Function} onCategoryClick - Callback for category click events
 */
export function renderNestedPieChart(events, timeDomain, onCategoryClick) {
  const container = d3.select('#nested-pie-chart');
  container.selectAll('*').remove();
  
  const [startDomain, endDomain] = timeDomain;
  
  // Filter events within the time domain
  const filteredEvents = events.filter(d => 
    (d.type === 'range' ? 
      (d.end >= startDomain && d.start <= endDomain) : 
      (d.start >= startDomain && d.start <= endDomain))
  );
  
  if (filteredEvents.length === 0) {
    container.append('p')
      .attr('class', 'text-gray-500 text-center')
      .text('No data in selected range.');
    return;
  }
  
  // Process data for visualization
  const totalPeriodDays = (endDomain - startDomain) / (1000 * 60 * 60 * 24);
  const milestoneValue = totalPeriodDays * 0.01;
  const lifeEventValue = totalPeriodDays * 0.05;
  
  const locationData = {};
  const categoryByLocationData = {};
  
  filteredEvents.forEach(event => {
    let duration = 0;
    
    if (event.type === 'range') {
      const s = event.start < startDomain ? startDomain : event.start;
      const e = event.end > endDomain ? endDomain : event.end;
      duration = (e - s) / (1000 * 60 * 60 * 24);
    } else if (event.type === 'milestone') {
      duration = milestoneValue;
    } else if (event.type === 'life') {
      duration = lifeEventValue;
    }
    
    const location = event.location && event.location.country 
      ? event.location.country 
      : (event.location && event.location.city ? event.location.city : "Other");
    
    const category = event.category || "Uncategorized";
    
    // Add to location data
    if (!locationData[location]) {
      locationData[location] = { name: location, value: 0, children: [] };
    }
    locationData[location].value += duration;
    
    // Track category data
    if (!categoryByLocationData[location]) {
      categoryByLocationData[location] = {};
    }
    
    if (!categoryByLocationData[location][category]) {
      categoryByLocationData[location][category] = {
        name: category,
        value: 0,
        parent: location,
        type: event.type
      };
    }
    
    categoryByLocationData[location][category].value += duration;
  });
  
  // Create hierarchical data
  const nestedData = {
    name: "Time Spent",
    children: Object.values(locationData).map(location => {
      const locationNode = {
        name: location.name,
        value: location.value,
        children: []
      };
      
      if (categoryByLocationData[location.name]) {
        Object.values(categoryByLocationData[location.name]).forEach(category => {
          if (category.value > 0) {
            locationNode.children.push({
              name: category.name,
              value: category.value,
              parent: location.name
            });
          }
        });
      }
      
      return locationNode;
    }).filter(location => location.value > 0)
  };
  
  // Setup SVG
  const width = container.node().clientWidth || 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 20;
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width/2},${height/2})`);
  
  // Create color scales
  const locationColorScale = d3.scaleOrdinal()
    .domain(Object.keys(locationData))
    .range(d3.schemeSet3);
  
  const categoryColorScale = d3.scaleOrdinal()
    .domain(Object.keys(categoryByLocationData).flatMap(loc => 
      Object.keys(categoryByLocationData[loc])
    ))
    .range(d3.schemeCategory10);
  
  // Create hierarchy and partition
  const root = d3.hierarchy(nestedData).sum(d => d.value);
  const partition = d3.partition().size([2 * Math.PI, radius]);
  partition(root);
  
  // Create arc generator
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.depth === 1 ? d.y0 * 0.8 : d.y0 * 1.1)
    .outerRadius(d => d.depth === 1 ? d.y1 * 0.8 : d.y1)
    .padAngle(0.03);
  
  // Create tooltip
  const tooltip = createChartTooltip();
  
  // Add arcs
  svg.selectAll('path')
    .data(root.descendants().filter(d => d.depth > 0))
    .enter().append('path')
    .attr('class', d => d.depth === 2 ? 'category-slice' : 'location-slice')
    .attr('d', arc)
    .attr('fill', d => {
      if (d.depth === 1) return locationColorScale(d.data.name);
      if (d.depth === 2) return categoryColorScale(d.data.name);
      return '#ccc';
    })
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .style('opacity', 0.8)
    .on('mouseover', function(event, d) {
      const content = d.depth === 1 
        ? `<strong>${d.data.name}</strong><br>${Math.round(d.value)} days`
        : `<strong>${d.data.name}</strong> in ${d.parent.data.name}<br>${Math.round(d.value)} days`;
      
      tooltip.html(content)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      
      d3.select(this).style('transform', 'scale(1.03)');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
      d3.select(this).style('transform', 'scale(1)');
    })
    .on('click', function(event, d) {
      if (d.depth === 2 && onCategoryClick) {
        onCategoryClick(d.data.name);
      }
    });
  
  // Add center label
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('font-size', '13px')
    .attr('fill', '#333')
    .text('Places');
}

// =============================================================================
// DEVELOPMENT MODE FEATURES
// =============================================================================

/**
 * Initialize development mode features
 */
export function initializeDevelopmentFeatures() {
  const runTestsBtn = document.getElementById('run-tests');
  const isDevelopment = isDevelopmentMode();
  
  if (runTestsBtn && isDevelopment) {
    runTestsBtn.style.display = 'inline-block';
    runTestsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🧪 Running import/export tests...');
      
      if (window.testComprehensiveImportExport) {
        window.testComprehensiveImportExport().then(results => {
          // Create results notification
          const resultsDiv = document.createElement('div');
          resultsDiv.className = 'ui message';
          
          if (results.yamlToCsv.success && results.csvToCsv.success) {
            resultsDiv.classList.add('positive');
            resultsDiv.innerHTML = '<div class="header">✅ All tests passed!</div>' +
                                  '<p>YAML ↔ CSV and CSV ↔ CSV import/export tests completed successfully.</p>';
          } else {
            resultsDiv.classList.add('negative');
            resultsDiv.innerHTML = '<div class="header">❌ Some tests failed</div>' +
                                '<p>Check the console for details.</p>';
          }
          
          // Add to page
          const importStatsContainer = document.getElementById('import-stats');
          if (importStatsContainer) {
            importStatsContainer.innerHTML = '';
            importStatsContainer.appendChild(resultsDiv);
            importStatsContainer.style.display = 'block';
            
            // Scroll to results
            importStatsContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Automatically hide after 10 seconds
            setTimeout(() => {
              importStatsContainer.style.display = 'none';
            }, 10000);
          }
        });
      }
    });
  }
}