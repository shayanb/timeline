/**
 * Timeline Interactions Module
 * Comprehensive module for all timeline interaction functionality including:
 * - Zoom and pan functionality
 * - Mouse and touch interactions
 * - Smooth animations and transitions
 * - Timeline navigation controls
 * - Interactive zoom controls UI
 * - Scroll wheel zoom
 * - Animation systems
 */

import { 
  formatMonth,
  easeOutQuint, 
  easeInOutQuint, 
  SmoothAnimation 
} from './utils.js';

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

/**
 * Cubic ease-in-out function for smoother animations
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased progress value
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =============================================================================
// ZOOM AND PAN FUNCTIONALITY
// =============================================================================

/**
 * Initialize zoom and pan functionality for timeline container
 * Sets up all interaction handlers including zoom controls, wheel zoom, and drag pan
 * @param {HTMLElement} container - Timeline container element
 * @param {Date} initialStartDate - Initial timeline start date
 * @param {Date} initialEndDate - Initial timeline end date
 * @param {Function} updateCallback - Callback function to update timeline display
 * @param {HTMLElement} monthDisplay - Element to display current month range
 */
export function initializeZoomAndPan(container, initialStartDate, initialEndDate, updateCallback, monthDisplay) {
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
  
  // Add zoom controls UI
  addZoomControls(container, state, updateCallback, monthDisplay);
  
  // Add scroll wheel zoom functionality
  addScrollWheelZoom(container, state, updateCallback, monthDisplay);
  
  // Note: Drag functionality is now handled directly in main script
  // addDragToPan(container, state, updateCallback, monthDisplay);
  
  // Note: Cursor style is set by the working drag implementation in main script
}

/**
 * Add zoom control buttons to the timeline
 * @param {HTMLElement} container - Timeline container
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
function addZoomControls(container, state, updateCallback, monthDisplay) {
  // Only add zoom controls if they haven't been added before
  if (!state.zoomControlsAdded) {
    // Remove any existing controls first (just to be safe)
    const existingControls = document.querySelector('.zoom-controls');
    if (existingControls) {
      existingControls.remove();
    }
    
    // Create zoom controls container
    const zoomControlsContainer = document.createElement('div');
    zoomControlsContainer.id = 'timeline-zoom-controls';
    zoomControlsContainer.className = 'zoom-controls';
    
    // Apply styles for proper positioning
    Object.assign(zoomControlsContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 'auto',
      bottom: '30px',
      right: '30px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '8px',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      zIndex: '1000'
    });
    
    // Add to appropriate container
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
      timelineContainer.appendChild(zoomControlsContainer);
    } else {
      container.appendChild(zoomControlsContainer);
    }
    
    // Mark that controls have been added
    state.zoomControlsAdded = true;
    
    // Create zoom buttons
    createZoomButton(zoomControlsContainer, '+', 'Zoom In', () => 
      handleZoom(0.7, state, updateCallback, monthDisplay));
    createZoomButton(zoomControlsContainer, '−', 'Zoom Out', () => 
      handleZoom(1.4, state, updateCallback, monthDisplay));
    createZoomButton(zoomControlsContainer, '↺', 'Reset View', () => 
      resetView(state, updateCallback, monthDisplay), 'reset-button');
  }
}

/**
 * Create a zoom control button
 * @param {HTMLElement} container - Container for the button
 * @param {string} symbol - Button symbol/text
 * @param {string} title - Button tooltip
 * @param {Function} clickHandler - Click event handler
 * @param {string} extraClass - Additional CSS class
 */
function createZoomButton(container, symbol, title, clickHandler, extraClass = '') {
  const button = document.createElement('button');
  button.className = `zoom-button ${extraClass}`.trim();
  button.innerHTML = symbol;
  button.title = title;
  button.addEventListener('click', clickHandler);
  container.appendChild(button);
}

/**
 * Handle zoom operation with smooth animation
 * @param {number} factor - Zoom factor (< 1 = zoom in, > 1 = zoom out)
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
export function handleZoom(factor, state, updateCallback, monthDisplay) {
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
  
  // Update zoom state
  if (window.timelineState) {
    window.timelineState.isZoomed = true;
  }
  
  // Store old dates for animation
  const oldStart = new Date(state.currentStartDate);
  const oldEnd = new Date(state.currentEndDate);
  
  // Animate the zoom transition
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
      
      // Update month display
      monthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      
      // Strategic updates for performance
      const updatePoints = [0, 0.25, 0.5, 0.75, 0.9, 1];
      const nearestPoint = updatePoints.find(point => 
        Math.abs(progress - point) < 0.05
      );
      
      if (nearestPoint !== undefined) {
        updateCallback();
      }
    },
    onComplete: () => {
      // Final update with exact target dates
      state.currentStartDate = newStart;
      state.currentEndDate = newEnd;
      monthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      updateCallback();
      state.isZooming = false;
    }
  }).start();
}

/**
 * Reset timeline view to original date range with smooth animation
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
export function resetView(state, updateCallback, monthDisplay) {
  // Don't handle if already zooming
  if (state.isZooming) return;
  state.isZooming = true;
  
  // Get target (original) dates
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
  
  // Animate the reset transition
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
      
      // Update month display
      monthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      
      // Strategic updates for performance
      const updatePoints = [0, 0.2, 0.4, 0.6, 0.8, 1];
      const nearestPoint = updatePoints.find(point => 
        Math.abs(progress - point) < 0.05
      );
      
      if (nearestPoint !== undefined) {
        updateCallback();
      }
    },
    onComplete: () => {
      // Final update with exact target dates
      state.currentStartDate = newStart;
      state.currentEndDate = newEnd;
      state.isZoomed = false;
      
      // Update global timeline state
      if (window.timelineState) {
        window.timelineState.currentStartDate = new Date(newStart);
        window.timelineState.currentEndDate = new Date(newEnd);
        window.timelineState.isZoomed = false;
      }
      
      monthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      updateCallback();
      state.isZooming = false;
    }
  }).start();
}

// =============================================================================
// SCROLL WHEEL ZOOM FUNCTIONALITY
// =============================================================================

/**
 * Add scroll wheel zoom functionality to container
 * @param {HTMLElement} container - Timeline container
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
function addScrollWheelZoom(container, state, updateCallback, monthDisplay) {
  let zoomTimeout = null;
  let pendingZoom = null;
  let lastWheelTime = 0;
  
  // Process zoom events with smooth animation
  function processZoom(event) {
    if (state.isZooming) return;
    state.isZooming = true;
    
    // Determine zoom direction and factor
    const direction = event.deltaY < 0 ? -1 : 1;
    const factor = direction < 0 ? 0.9 : 1.1;
    
    // Get mouse position for zoom target
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    
    // Adjust for category label width (180px)
    const effectiveWidth = containerRect.width - 180;
    const effectiveMouseX = mouseX - 180; 
    
    if (effectiveMouseX > 0) { // Only zoom if mouse is in timeline area
      const mousePosition = effectiveMouseX / effectiveWidth;
      const totalTime = state.currentEndDate.getTime() - state.currentStartDate.getTime();
      const zoomCenterDate = new Date(state.currentStartDate.getTime() + totalTime * mousePosition);
      
      // Mark as zoomed
      if (window.timelineState) {
        window.timelineState.isZoomed = true;
      }
      
      // Calculate new date range
      const newRange = totalTime * factor;
      const newStart = new Date(zoomCenterDate.getTime() - newRange * mousePosition);
      const newEnd = new Date(zoomCenterDate.getTime() + newRange * (1 - mousePosition));
      
      // Store current dates for animation
      const oldStart = new Date(state.currentStartDate);
      const oldEnd = new Date(state.currentEndDate);
      
      // Update display immediately for responsiveness
      monthDisplay.textContent = `${formatMonth(newStart)} - ${formatMonth(newEnd)}`;
      
      // Animate the wheel zoom
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
          
          // Update month display
          monthDisplay.textContent = `${formatMonth(interpolatedStart)} - ${formatMonth(interpolatedEnd)}`;
          
          // Strategic UI updates
          if (progress === 0 || progress === 1 || progress >= 0.5) {
            updateCallback();
          }
        },
        onComplete: () => {
          // Final update
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          updateCallback();
          state.isZooming = false;
        }
      }).start();
    } else {
      state.isZooming = false;
    }
  }
  
  // Add wheel event listener with throttling
  container.addEventListener('wheel', function(event) {
    event.preventDefault();
    
    // Don't handle events during zoom animation
    if (state.isZooming && !pendingZoom) return;
    
    // Throttle wheel events for performance
    const now = Date.now();
    if (now - lastWheelTime < 16) { // 60fps max
      if (pendingZoom) {
        // Update pending zoom parameters
        pendingZoom.deltaY += event.deltaY;
      } else {
        // Create new pending zoom
        pendingZoom = {
          deltaY: event.deltaY,
          clientX: event.clientX
        };
      }
      
      // Clear existing timeout
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }
      
      // Set timeout to process zoom
      zoomTimeout = setTimeout(() => {
        processZoom(pendingZoom);
        pendingZoom = null;
        zoomTimeout = null;
      }, 50);
      
      return;
    }
    
    lastWheelTime = now;
    processZoom(event);
  }, { passive: false });
}

// =============================================================================
// DRAG TO PAN FUNCTIONALITY
// =============================================================================

/**
 * Add drag to pan functionality to container
 * @param {HTMLElement} container - Timeline container
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
function addDragToPan(container, state, updateCallback, monthDisplay) {
  console.log('addDragToPan called with container:', container);
  
  // Temporarily disable duplicate check
  console.log('Setting up drag functionality (ignoring duplicate check)');
  
  let dragStartX = 0;
  let dragStartTime = 0;
  let isDraggingStarted = false;
  let activeDragAnimation = null;
  let lastDragTime = 0;
  let dragPositions = [];
  
  // Target the timeline area specifically for better drag detection
  const timelineDiv = container.querySelector('#timeline');
  const dragTarget = timelineDiv || container;
  console.log('Setting up drag on:', dragTarget.id || 'container', dragTarget);
  
  // Set cursor to indicate draggable area
  dragTarget.style.cursor = 'grab';
  
  // Add a visual indicator that drag is set up
  dragTarget.title = 'Drag to pan timeline';
  
  // Mouse down event - start dragging  
  const handleMouseDown = function(event) {
    console.log('Mouse down detected on timeline, target:', event.target.className, event.target.id);
    
    // Don't start drag on interactive elements
    if (event.target.closest('.action-button') || 
        event.target.closest('.milestone-dot') || 
        event.target.classList.contains('timeline-event')) {
      console.log('Ignoring drag on interactive element');
      return;
    }
    
    console.log('Starting drag operation');
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    console.log(`Mouse X position: ${mouseX}, container width: ${containerRect.width}`);
    
    // Stop any active animations
    if (activeDragAnimation) {
      activeDragAnimation.stop();
      activeDragAnimation = null;
    }
    
    state.isDragging = true;
    isDraggingStarted = true;
    dragStartX = event.clientX;
    dragStartTime = performance.now();
    dragPositions = [{x: dragStartX, time: dragStartTime}];
    dragTarget.style.cursor = 'grabbing';
    
    // Prevent text selection during drag
    event.preventDefault();
    event.stopPropagation();
  };
  
  dragTarget.addEventListener('mousedown', handleMouseDown, true); // Use capture phase
  
  // Mouse move event - handle dragging
  document.addEventListener('mousemove', function(event) {
    if (!state.isDragging) return;
    console.log('Mouse move during drag');
    
    // Process mouse movement
    const currentX = event.clientX;
    const currentTime = performance.now();
    const deltaX = currentX - dragStartX;
    
    // Record position for velocity calculation
    dragPositions.push({x: currentX, time: currentTime});
    if (dragPositions.length > 5) {
      dragPositions.shift();
    }
    
    // Calculate date range shift
    const containerRect = container.getBoundingClientRect();
    const effectiveWidth = containerRect.width - 180;
    const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
    const millisPerPixel = dateRangeMillis / effectiveWidth;
    
    // Dynamic damping based on zoom level
    const dateRangeInDays = dateRangeMillis / (1000 * 60 * 60 * 24);
    const zoomFactor = Math.min(1, Math.max(0.1, 180 / dateRangeInDays));
    const damping = 0.3 * zoomFactor;
    
    const shift = deltaX * millisPerPixel * -1 * damping;
    
    // Update dates
    const newStartDate = new Date(state.currentStartDate.getTime() + shift);
    const newEndDate = new Date(state.currentEndDate.getTime() + shift);
    
    // Store initial state if this is start of drag
    if (dragPositions.length <= 1) {
      window.dragInitialState = {
        startDate: new Date(state.currentStartDate),
        endDate: new Date(state.currentEndDate),
        timeStamp: performance.now()
      };
    }
    
    // Update state for real-time responsiveness
    state.currentStartDate = newStartDate;
    state.currentEndDate = newEndDate;
    
    // Update header display
    monthDisplay.textContent = `${formatMonth(newStartDate)} - ${formatMonth(newEndDate)}`;
    
    // Update drag start position
    dragStartX = currentX;
    
    // Update global timeline state
    window.timelineState.currentStartDate = newStartDate;
    window.timelineState.currentEndDate = newEndDate;
    
    // Efficient element movement
    moveTimelineElements(container, state, shift);
    
    // Throttled full updates
    const now = performance.now();
    if (now - lastDragTime > 100) {
      requestAnimationFrame(() => {
        moveTimelineElements(container, state, shift);
        lastDragTime = now;
      });
    }
  });
  
  // Mouse up event - end dragging
  document.addEventListener('mouseup', function() {
    if (state.isDragging) {
      console.log('Mouse up - ending drag');
      const releaseTime = performance.now();
      state.isDragging = false;
      isDraggingStarted = false;
      dragTarget.style.cursor = 'grab';
      
      // Update timeline state
      if (window.timelineState) {
        window.timelineState.isZoomed = true;
        window.timelineState.currentStartDate = new Date(state.currentStartDate);
        window.timelineState.currentEndDate = new Date(state.currentEndDate);
      }
      
      // Calculate velocity for momentum
      let velocity = 0;
      
      if (dragPositions.length >= 2) {
        const positionsToConsider = Math.min(5, dragPositions.length);
        const recentPositions = dragPositions.slice(-positionsToConsider);
        
        const firstPos = recentPositions[0];
        const lastPos = recentPositions[recentPositions.length - 1];
        const totalDeltaX = lastPos.x - firstPos.x;
        const totalDeltaTime = lastPos.time - firstPos.time;
        
        if (totalDeltaTime > 0) {
          velocity = totalDeltaX / totalDeltaTime; // pixels per millisecond
        }
      }
      
      // Apply momentum animation if sufficient velocity
      if (Math.abs(velocity) > 0.05) {
        applyMomentumAnimation(container, state, updateCallback, monthDisplay, velocity);
      } else {
        // No momentum - quick settle animation
        applySettleAnimation(state, updateCallback, monthDisplay);
      }
      
      // Clear tracking
      dragPositions = [];
    }
  });
}

/**
 * Apply momentum animation after drag release
 * @param {HTMLElement} container - Timeline container
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 * @param {number} velocity - Drag velocity in pixels/ms
 */
function applyMomentumAnimation(container, state, updateCallback, monthDisplay, velocity) {
  const containerRect = container.getBoundingClientRect();
  const effectiveWidth = containerRect.width - 180;
  const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
  const millisPerPixel = dateRangeMillis / effectiveWidth;
  
  // Dynamic momentum damping based on zoom level
  const dateRangeInDays = dateRangeMillis / (1000 * 60 * 60 * 24);
  const zoomFactor = Math.min(1, Math.max(0.1, 180 / dateRangeInDays));
  const momentumDamping = 0.3 * zoomFactor;
  
  const momentumDistance = velocity * 400 * momentumDamping;
  const momentumShift = momentumDistance * millisPerPixel * -1;
  
  // Calculate target dates
  const targetStartDate = new Date(state.currentStartDate.getTime() + momentumShift);
  const targetEndDate = new Date(state.currentEndDate.getTime() + momentumShift);
  
  const dragStartDate = new Date(state.currentStartDate);
  const dragEndDate = new Date(state.currentEndDate);
  
  // Start momentum animation
  const activeDragAnimation = new SmoothAnimation({
    duration: 800,
    easing: t => 1 - Math.pow(1 - t, 4), // Quartic ease-out
    targetFPS: 60,
    onUpdate: (progress) => {
      const startDiff = targetStartDate.getTime() - dragStartDate.getTime();
      const endDiff = targetEndDate.getTime() - dragEndDate.getTime();
      
      const interpolatedStart = new Date(dragStartDate.getTime() + startDiff * progress);
      const interpolatedEnd = new Date(dragEndDate.getTime() + endDiff * progress);
      
      state.currentStartDate = interpolatedStart;
      state.currentEndDate = interpolatedEnd;
      
      monthDisplay.textContent = `${formatMonth(interpolatedStart)} - ${formatMonth(interpolatedEnd)}`;
      
      if (progress < 0.9) {
        const totalShift = startDiff * progress;
        const frameShift = totalShift / 10;
        
        if (progress % 0.1 < 0.02) {
          moveTimelineElements(container, state, frameShift);
        }
      } else {
        updateCallback();
      }
    },
    onComplete: () => {
      state.currentStartDate = targetStartDate;
      state.currentEndDate = targetEndDate;
      
      if (window.timelineState) {
        window.timelineState.currentStartDate = new Date(targetStartDate);
        window.timelineState.currentEndDate = new Date(targetEndDate);
        window.timelineState.isZoomed = true;
      }
      
      updateCallback();
    }
  }).start();
}

/**
 * Apply settle animation for drag without momentum
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
function applySettleAnimation(state, updateCallback, monthDisplay) {
  const finalStartDate = new Date(state.currentStartDate);
  const finalEndDate = new Date(state.currentEndDate);
  
  new SmoothAnimation({
    duration: 50,
    easing: t => t, // Linear for short animation
    onUpdate: (progress) => {
      if (progress >= 0.5) {
        updateCallback();
      }
    },
    onComplete: () => {
      state.currentStartDate = finalStartDate;
      state.currentEndDate = finalEndDate;
      
      if (window.timelineState) {
        window.timelineState.currentStartDate = new Date(finalStartDate);
        window.timelineState.currentEndDate = new Date(finalEndDate);
        window.timelineState.isZoomed = true;
      }
      
      updateCallback();
    }
  }).start();
}

// =============================================================================
// TIMELINE ELEMENT MOVEMENT UTILITIES
// =============================================================================

/**
 * Efficiently move timeline elements without full redraw
 * @param {HTMLElement} container - Timeline container
 * @param {Object} state - Timeline state object
 * @param {number} shift - Shift amount in milliseconds
 */
export function moveTimelineElements(container, state, shift) {
  // Calculate visual shift as percentage
  const containerRect = container.getBoundingClientRect();
  const effectiveWidth = containerRect.width - 180;
  const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
  
  // Calculate shift percentage for all elements
  const shiftPercentage = (shift / dateRangeMillis) * 100;
  
  // Move all event elements and lifelines
  document.querySelectorAll('.timeline-event, .life-line, .milestone-container').forEach(el => {
    const currentLeft = parseFloat(el.style.left) || 0;
    el.style.left = `${currentLeft - shiftPercentage}%`;
  });
  
  // Move month markers
  document.querySelectorAll('.month-marker').forEach(el => {
    const currentLeft = parseFloat(el.style.left) || 0;
    el.style.left = `${currentLeft - shiftPercentage}%`;
  });
  
  // Move life labels below chart
  document.querySelectorAll('.life-label.below-chart').forEach(el => {
    const currentLeft = parseFloat(el.style.left) || 0;
    el.style.left = `${currentLeft - shiftPercentage}%`;
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Update date range and redraw timeline
 * @param {Date} newStart - New start date
 * @param {Date} newEnd - New end date
 * @param {Object} state - Timeline state object
 * @param {Function} updateCallback - Update callback function
 * @param {HTMLElement} monthDisplay - Month display element
 */
export function updateDateRange(newStart, newEnd, state, updateCallback, monthDisplay) {
  state.currentStartDate = newStart;
  state.currentEndDate = newEnd;
  state.isZoomed = true;
  
  // Update UI with new date range
  monthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
  
  // Recreate timeline with new date range
  updateCallback();
}

/**
 * Get current timeline state
 * @returns {Object} Current timeline state object
 */
export function getTimelineState() {
  return window.timelineState;
}

/**
 * Set timeline state
 * @param {Object} newState - New state object to merge
 */
export function setTimelineState(newState) {
  if (!window.timelineState) {
    window.timelineState = {};
  }
  Object.assign(window.timelineState, newState);
}