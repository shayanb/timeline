// Timeline Rendering Module
// This module contains all functions related to rendering the main timeline view

import { formatDate, formatMonth, calculatePosition, calculateWidth, sortByDate, groupByCategory, calculateEventRow, getMonthsBetween } from './utils.js';
import { setUnsavedChanges, DEFAULT_MILESTONE_EMOJI } from './config.js';

// Timeline state
let currentStartDate = null;
let currentEndDate = null;
let zoomLevel = 1;
let panOffset = 0;

/**
 * Initialize timeline container and setup
 * @param {HTMLElement} container - Timeline container element
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 */
export function initializeTimeline(container, startDate, endDate) {
  currentStartDate = startDate;
  currentEndDate = endDate;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create timeline structure
  const timelineDiv = document.createElement('div');
  timelineDiv.id = 'timeline';
  timelineDiv.className = 'relative';
  container.appendChild(timelineDiv);
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.className = 'tooltip';
  container.appendChild(tooltip);
  
  return { timelineDiv, tooltip };
}

/**
 * Render month headers for the timeline
 * @param {HTMLElement} monthsContainer - Container for month headers
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 */
export function renderMonthHeaders(monthsContainer, startDate, endDate) {
  const months = getMonthsBetween(startDate, endDate);
  const totalMonths = months.length;
  
  monthsContainer.innerHTML = '';
  
  months.forEach((month, index) => {
    const monthDiv = document.createElement('div');
    monthDiv.className = 'month-column';
    monthDiv.style.flex = '1';
    monthDiv.style.minWidth = '60px';
    monthDiv.style.position = 'relative';
    
    // Month label
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = formatMonth(month);
    monthDiv.appendChild(monthLabel);
    
    // Year label (show on January or first month)
    if (month.getMonth() === 0 || index === 0) {
      const yearLabel = document.createElement('div');
      yearLabel.className = 'year-label';
      yearLabel.textContent = month.getFullYear().toString();
      monthDiv.appendChild(yearLabel);
    }
    
    monthsContainer.appendChild(monthDiv);
  });
}

/**
 * Render category rows for the timeline
 * @param {HTMLElement} timeline - Timeline container
 * @param {Array} categories - Array of category names
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Object} groupedEvents - Events grouped by category
 * @returns {Object} Map of category names to their DOM elements
 */
export function renderCategoryRows(timeline, categories, startDate, endDate, groupedEvents = {}) {
  const categoryElements = {};
  
  categories.forEach(category => {
    // Calculate the maximum row for this category to determine height
    const categoryEvents = groupedEvents[category] || [];
    const maxRow = Math.max(0, ...categoryEvents.map(event => event.row || 0));
    const categoryHeight = Math.max(56, 56 + (maxRow * 40)); // Base height + row spacing
    const categoryRow = document.createElement('div');
    categoryRow.className = 'category-row';
    categoryRow.dataset.category = category || 'uncategorized';
    categoryRow.style.height = `${categoryHeight}px`;
    
    // Category label
    const categoryLabel = document.createElement('div');
    categoryLabel.className = 'category-label';
    categoryLabel.textContent = category || 'Uncategorized';
    categoryLabel.style.height = `${categoryHeight}px`;
    categoryRow.appendChild(categoryLabel);
    
    // Category timeline area
    const categoryTimeline = document.createElement('div');
    categoryTimeline.className = 'category-timeline';
    categoryTimeline.style.position = 'relative';
    categoryTimeline.style.height = `${categoryHeight}px`;
    
    // Add month markers
    const months = getMonthsBetween(startDate, endDate);
    months.forEach((month, index) => {
      const monthMarker = document.createElement('div');
      monthMarker.className = 'month-marker';
      const position = (index / months.length) * 100;
      monthMarker.style.left = `${position}%`;
      categoryTimeline.appendChild(monthMarker);
    });
    
    categoryRow.appendChild(categoryTimeline);
    timeline.appendChild(categoryRow);
    
    categoryElements[category || 'uncategorized'] = {
      row: categoryRow,
      timeline: categoryTimeline
    };
  });
  
  return categoryElements;
}

/**
 * Render range events on the timeline
 * @param {Array} events - Array of range events
 * @param {Object} categoryElements - Map of category elements
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} editEventCallback - Callback for editing events
 */
export function renderRangeEvents(events, categoryElements, startDate, endDate, editEventCallback) {
  const tooltip = document.getElementById('tooltip');
  
  events.forEach(event => {
    if (event.type !== 'range') return;
    
    const categoryKey = event.category || 'uncategorized';
    const categoryElement = categoryElements[categoryKey];
    
    if (!categoryElement) return;
    
    try {
      // Calculate position and width
      const leftPosition = calculatePosition(event.start, startDate, endDate);
      const width = calculateWidth(event.start, event.end, startDate, endDate);
      
      // Calculate row offset
      const rowOffset = (event.row || 0) * 40;
      const topOffset = event.isParent ? 2 : 8;
      
      // Add slight horizontal offset for higher rows to show hierarchy
      const horizontalOffset = (event.row || 0) * 2; // 2px offset per row
      
      // Create event element
      const eventDiv = document.createElement('div');
      eventDiv.className = `timeline-event ${event.isParent ? 'parent-event' : ''} ${event.parent ? 'child-event' : ''}`;
      eventDiv.style.left = `calc(${leftPosition}% + ${horizontalOffset}px)`;
      eventDiv.style.width = `calc(${width}% - ${horizontalOffset}px)`;
      eventDiv.style.top = `${topOffset + rowOffset}px`;
      eventDiv.style.backgroundColor = event.color;
      eventDiv.dataset.eventId = event.id;
      
      // Create event content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'event-content';
      
      // Title
      const titleSpan = document.createElement('span');
      titleSpan.className = 'event-title';
      titleSpan.textContent = event.title;
      contentDiv.appendChild(titleSpan);
      
      // Important indicator
      if (event.isImportant) {
        const starIcon = document.createElement('span');
        starIcon.className = 'event-important';
        starIcon.innerHTML = '★';
        contentDiv.appendChild(starIcon);
      }
      
      eventDiv.appendChild(contentDiv);
      
      // Action buttons on hover
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'event-actions';
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'action-button edit-button';
      editBtn.innerHTML = '✎';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editEventCallback(event);
      });
      actionsDiv.appendChild(editBtn);
      
      eventDiv.appendChild(actionsDiv);
      
      // Event click handler
      setupEventClickHandler(eventDiv, event, editEventCallback);
      
      // Tooltip handlers
      setupEventTooltip(eventDiv, event, tooltip);
      
      categoryElement.timeline.appendChild(eventDiv);
    } catch (error) {
      console.error("Error rendering range event:", event.title, error);
    }
  });
}

/**
 * Render milestone events on the timeline
 * @param {Array} events - Array of milestone events
 * @param {Object} categoryElements - Map of category elements
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} editEventCallback - Callback for editing events
 */
export function renderMilestoneEvents(events, categoryElements, startDate, endDate, editEventCallback) {
  events.forEach(event => {
    if (event.type !== 'milestone') return;
    
    const categoryKey = event.category || 'uncategorized';
    const categoryElement = categoryElements[categoryKey];
    
    if (!categoryElement || isNaN(event.start.getTime())) return;
    
    // Calculate position
    const leftPosition = calculatePosition(event.start, startDate, endDate);
    
    // Create milestone dot
    const milestoneDot = document.createElement('div');
    milestoneDot.className = 'milestone-dot timeline-milestone';
    milestoneDot.style.position = 'absolute';
    milestoneDot.style.left = `${leftPosition}%`;
    
    // Set attributes
    milestoneDot.setAttribute('data-milestone-id', event.id);
    milestoneDot.setAttribute('data-milestone-title', event.title);
    milestoneDot.setAttribute('data-event-type', 'milestone');
    
    // Calculate vertical position
    const rowOffset = (event.row || 0) * 40;
    let topPx = 8 + rowOffset;
    
    if (event.parent) {
      const parentEvent = events.find(e => e.id === event.parent);
      if (parentEvent) {
        const parentOffset = (parentEvent.row || 0) * 40;
        topPx = (parentEvent.isParent ? 2 : 8) + parentOffset;
      }
    }
    
    milestoneDot.style.top = `${topPx}px`;
    milestoneDot.style.backgroundColor = event.color;
    
    // Handle custom emoji
    if (event.emoji) {
      milestoneDot.textContent = event.emoji;
      milestoneDot.style.setProperty('width', 'auto', 'important');
      milestoneDot.style.setProperty('height', 'auto', 'important');
      milestoneDot.style.setProperty('font-size', '20px', 'important');
      milestoneDot.style.backgroundColor = 'transparent';
      milestoneDot.style.setProperty('border', 'none', 'important');
      milestoneDot.style.color = event.color || 'inherit';
    }
    
    // Click handler
    milestoneDot.addEventListener('click', (e) => {
      e.stopPropagation();
      editEventCallback(event);
    });
    
    // Tooltip
    const dateStr = formatDate(event.start);
    milestoneDot.title = `${event.title} (${dateStr})`;
    
    categoryElement.timeline.appendChild(milestoneDot);
  });
}

/**
 * Render life events as vertical lines across all categories
 * @param {Array} events - Array of life events
 * @param {HTMLElement} timeline - Timeline container
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} editEventCallback - Callback for editing events
 */
export function renderLifeEvents(events, timeline, startDate, endDate, editEventCallback) {
  const lifeEvents = events.filter(event => event.type === 'life');
  
  // Clear existing life event containers to prevent duplicates
  const existingLifeContainer = timeline.querySelector('.life-events-container');
  if (existingLifeContainer) {
    existingLifeContainer.remove();
  }
  
  const existingLabelsContainer = timeline.parentElement.querySelector('.life-labels-container');
  if (existingLabelsContainer) {
    existingLabelsContainer.remove();
  }
  
  if (lifeEvents.length === 0) return;
  
  // Create container for life event lines
  const lifeEventsContainer = document.createElement('div');
  lifeEventsContainer.className = 'life-events-container';
  timeline.appendChild(lifeEventsContainer);
  
  // Create container for life event labels below the timeline
  const lifeLabelsContainer = document.createElement('div');
  lifeLabelsContainer.className = 'life-labels-container';
  timeline.parentElement.appendChild(lifeLabelsContainer);
  
  lifeEvents.forEach(event => {
    if (isNaN(event.start.getTime())) return;
    
    const leftPosition = calculatePosition(event.start, startDate, endDate);
    
    // Create vertical line
    const lifeLine = document.createElement('div');
    lifeLine.className = 'life-line';
    lifeLine.style.left = `${leftPosition}%`;
    lifeLine.style.color = event.color;
    lifeLine.style.backgroundColor = event.color;
    lifeLine.setAttribute('data-life-event-id', event.id);
    
    // Click handler
    lifeLine.addEventListener('click', (e) => {
      e.stopPropagation();
      editEventCallback(event);
    });
    
    lifeEventsContainer.appendChild(lifeLine);
    
    // Create label below the timeline
    const lifeLabel = document.createElement('div');
    lifeLabel.className = 'life-label below-chart';
    lifeLabel.style.left = `${leftPosition}%`;
    lifeLabel.style.backgroundColor = event.color;
    lifeLabel.textContent = event.title;
    lifeLabel.setAttribute('data-life-event-id', event.id);
    
    // Click handler for label
    lifeLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      editEventCallback(event);
    });
    
    lifeLabelsContainer.appendChild(lifeLabel);
  });
}

/**
 * Render today marker on the timeline
 * @param {HTMLElement} timeline - Timeline container
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 */
export function renderTodayMarker(timeline, startDate, endDate) {
  const today = new Date();
  
  // Only show today marker if today is within the timeline range
  if (today >= startDate && today <= endDate) {
    const leftPosition = calculatePosition(today, startDate, endDate);
    
    const todayMarker = document.createElement('div');
    todayMarker.className = 'today-marker';
    todayMarker.style.left = `${leftPosition}%`;
    
    // Add today label
    const todayLabel = document.createElement('div');
    todayLabel.className = 'today-label';
    todayLabel.textContent = 'Today';
    todayLabel.style.position = 'absolute';
    todayLabel.style.top = '-20px';
    todayLabel.style.left = '5px';
    todayLabel.style.fontSize = '12px';
    todayLabel.style.fontWeight = 'bold';
    todayLabel.style.color = '#22c55e';
    todayLabel.style.backgroundColor = 'white';
    todayLabel.style.padding = '2px 4px';
    todayLabel.style.borderRadius = '4px';
    todayLabel.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    
    todayMarker.appendChild(todayLabel);
    timeline.appendChild(todayMarker);
  }
}

/**
 * Main timeline update function
 * @param {Array} events - Array of all events
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} editEventCallback - Callback for editing events
 */
export function updateTimeline(events, startDate, endDate, editEventCallback) {
  const timelineContainer = document.getElementById('timeline-container');
  const timeline = document.getElementById('timeline');
  const monthsContainer = document.getElementById('timeline-months');
  
  if (!timeline || !monthsContainer) return;
  
  // Update current dates
  currentStartDate = startDate;
  currentEndDate = endDate;
  
  // Clear existing content
  timeline.innerHTML = '';
  
  // Sort events by date
  const sortedEvents = sortByDate([...events]);
  
  // Group events by category
  const groupedEvents = groupByCategory(sortedEvents);
  const categories = Object.keys(groupedEvents);
  
  // Render month headers
  renderMonthHeaders(monthsContainer, startDate, endDate);
  
  // Render category rows with proper heights based on events
  const categoryElements = renderCategoryRows(timeline, categories, startDate, endDate, groupedEvents);
  
  // Calculate rows for events to prevent overlaps
  Object.entries(groupedEvents).forEach(([category, categoryEvents]) => {
    categoryEvents.forEach(event => {
      if (event.row === undefined || event.row === null) {
        event.row = calculateEventRow(event, categoryEvents);
      }
    });
  });
  
  // Render different event types
  renderRangeEvents(sortedEvents, categoryElements, startDate, endDate, editEventCallback);
  renderMilestoneEvents(sortedEvents, categoryElements, startDate, endDate, editEventCallback);
  renderLifeEvents(sortedEvents, timeline, startDate, endDate, editEventCallback);
  
  // Render today marker
  renderTodayMarker(timeline, startDate, endDate);
  
  console.log(`Timeline updated with ${events.length} events between ${formatDate(startDate)} and ${formatDate(endDate)}`);
}

/**
 * Setup event click handler with drag detection
 * @param {HTMLElement} eventDiv - Event DOM element
 * @param {Object} event - Event data
 * @param {Function} editEventCallback - Callback for editing events
 */
function setupEventClickHandler(eventDiv, event, editEventCallback) {
  eventDiv.addEventListener('mousedown', (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;
    
    const handleMouseUp = (upEvent) => {
      const deltaX = Math.abs(upEvent.clientX - startX);
      const deltaY = Math.abs(upEvent.clientY - startY);
      
      if (!hasMoved && deltaX < 5 && deltaY < 5) {
        editEventCallback(event);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    const handleMouseMove = () => {
      hasMoved = true;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Don't prevent default immediately - let drag operations work
    // e.preventDefault();
  });
}

/**
 * Setup event tooltip handlers
 * @param {HTMLElement} eventDiv - Event DOM element
 * @param {Object} event - Event data
 * @param {HTMLElement} tooltip - Tooltip element
 */
function setupEventTooltip(eventDiv, event, tooltip) {
  eventDiv.addEventListener('mouseenter', () => {
    tooltip.style.opacity = '1';
    tooltip.style.display = 'block';
    tooltip.innerHTML = `
      <div class="font-medium">${event.title}</div>
      <div>${formatDate(event.start)} - ${formatDate(event.end)}</div>
      ${event.metadata ? `<div class="text-gray-300 mt-1">${event.metadata}</div>` : ''}
    `;
  });
  
  eventDiv.addEventListener('mousemove', (e) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  });
  
  eventDiv.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
  });
}

// Export timeline state getters
export function getCurrentTimelineRange() {
  return {
    startDate: currentStartDate,
    endDate: currentEndDate,
    zoomLevel,
    panOffset
  };
}

export function setTimelineRange(startDate, endDate) {
  currentStartDate = startDate;
  currentEndDate = endDate;
}