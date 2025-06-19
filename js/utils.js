/**
 * Timeline Utility Functions
 * Comprehensive utility module containing date formatting, calculations, 
 * positioning, overlap detection, and animation utilities.
 */

import { DEFAULT_MILESTONE_EMOJI } from './config.js';

// =============================================================================
// DATE FORMATTING AND CALCULATIONS
// =============================================================================

/**
 * Format a date to a readable string format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format a date to show month and year only
 * @param {Date} date - The date to format
 * @returns {string} Formatted month/year string
 */
export function formatMonth(date) {
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Get all months between start and end dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Date[]} Array of Date objects representing each month
 */
export function getMonthsBetween(start, end) {
  const months = [];
  const currentDate = new Date(start);
  
  // Set to first day of month
  currentDate.setDate(1);
  
  while (currentDate <= end) {
    months.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
}

// =============================================================================
// POSITION AND WIDTH CALCULATIONS
// =============================================================================

/**
 * Calculate position percentage for event placement with validation
 * @param {Date} date - The date to position
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @returns {number} Position percentage (0-100)
 */
export function calculatePosition(date, startDate, endDate) {
  // Validate dates as they might come from various sources
  if (!(date instanceof Date) || !(startDate instanceof Date) || !(endDate instanceof Date)) {
    console.error("Invalid date in calculatePosition:", date, startDate, endDate);
    return 0; // Safe default
  }
  
  if (isNaN(date.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error("Date is NaN in calculatePosition:", date, startDate, endDate);
    return 0; // Safe default
  }
  
  const timelineStart = startDate.getTime();
  const timelineEnd = endDate.getTime();
  const duration = timelineEnd - timelineStart;
  
  if (duration <= 0) {
    console.error("Invalid timeline duration:", duration, startDate, endDate);
    return 0; // Safe default
  }
  
  // Get the event time and clamp it to the timeline range
  const eventTime = Math.max(timelineStart, Math.min(timelineEnd, date.getTime()));
  
  // Calculate percentage position along the timeline
  let position = ((eventTime - timelineStart) / duration) * 100;
  
  // Ensure the position is within 0-100% range with boundary checks
  return Math.max(0, Math.min(100, position));
}

/**
 * Calculate width percentage for event with validation
 * @param {Date} startDate - Event start date
 * @param {Date} endDate - Event end date
 * @param {Date} timelineStart - Timeline start date
 * @param {Date} timelineEnd - Timeline end date
 * @returns {number} Width percentage (0.5-100)
 */
export function calculateWidth(startDate, endDate, timelineStart, timelineEnd) {
  // Validate all dates are proper Date objects
  if (!(startDate instanceof Date) || !(endDate instanceof Date) || 
      !(timelineStart instanceof Date) || !(timelineEnd instanceof Date)) {
    console.error("Invalid date object in calculateWidth", startDate, endDate, timelineStart, timelineEnd);
    return 0.5; // Minimal safe width
  }
  
  // Validate date values
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || 
      isNaN(timelineStart.getTime()) || isNaN(timelineEnd.getTime())) {
    console.error("NaN date in calculateWidth", startDate, endDate, timelineStart, timelineEnd);
    return 0.5; // Minimal safe width
  }
  
  // Handle reversed dates - ensure start is always before end
  const actualStartDate = new Date(Math.min(startDate.getTime(), endDate.getTime()));
  const actualEndDate = new Date(Math.max(startDate.getTime(), endDate.getTime()));
  
  const timelineStartMs = timelineStart.getTime();
  const timelineEndMs = timelineEnd.getTime();
  
  // Adjust dates if they fall outside the timeline
  const effectiveStartMs = Math.max(timelineStartMs, actualStartDate.getTime());
  const effectiveEndMs = Math.min(timelineEndMs, actualEndDate.getTime());
  
  const totalTimeMs = timelineEndMs - timelineStartMs;
  if (totalTimeMs <= 0) {
    console.error("Invalid timeline duration in calculateWidth", timelineStart, timelineEnd);
    return 0.5; // Minimal safe width
  }
  
  // Ensure we never have a negative duration
  const eventDurationMs = Math.max(0, effectiveEndMs - effectiveStartMs);
  
  // Calculate width percentage
  const width = (eventDurationMs / totalTimeMs) * 100;
  
  // Ensure minimum width and don't exceed 100%
  return Math.max(0.5, Math.min(100, width));
}

// =============================================================================
// EVENT OVERLAP DETECTION AND ROW CALCULATIONS
// =============================================================================

/**
 * Check if two events overlap in time
 * @param {Object} event1 - First event object
 * @param {Object} event2 - Second event object
 * @returns {boolean} True if events overlap
 */
export function eventsOverlap(event1, event2) {
  console.log(`[OVERLAP DEBUG] Checking overlap between "${event1.title}" (${event1.type}) and "${event2.title}" (${event2.type})`);
  
  // Special handling for milestone events - treat them as point events
  let event1Start = event1.start;
  let event1End = event1.type === 'milestone' ? new Date(event1.start.getTime()) : event1.end;
  
  let event2Start = event2.start;
  let event2End = event2.type === 'milestone' ? new Date(event2.start.getTime()) : event2.end;
  
  // First ensure both event dates are valid
  if (!(event1Start instanceof Date) || !(event1End instanceof Date) ||
      !(event2Start instanceof Date) || !(event2End instanceof Date)) {
    console.error("Invalid date objects in eventsOverlap", event1, event2);
    return false; // Can't determine overlap with invalid dates
  }
  
  // Test Case: Skip self comparison to avoid bugs
  if (event1.id === event2.id) {
    console.log(`[OVERLAP DEBUG] Self comparison, returning false`);
    return false;
  }
  
  // Log the actual date ranges being compared
  console.log(`[OVERLAP DEBUG] Event1: ${event1.title}, ${event1Start.toISOString().slice(0,10)} to ${event1End.toISOString().slice(0,10)}`);
  console.log(`[OVERLAP DEBUG] Event2: ${event2.title}, ${event2Start.toISOString().slice(0,10)} to ${event2End.toISOString().slice(0,10)}`);
  
  // Define what a true overlap is: one event starts before the other ends
  const hasDateOverlap = event1Start <= event2End && event2Start <= event1End;
  console.log(`[OVERLAP DEBUG] Overlap result: ${hasDateOverlap}`);
  
  // Debug the event comparison
  const event1DateStr = `${event1.title} (${event1.start.toISOString().slice(0,10)} to ${event1.end.toISOString().slice(0,10)})`;
  const event2DateStr = `${event2.title} (${event2.start.toISOString().slice(0,10)} to ${event2.end.toISOString().slice(0,10)})`;
  
  if (hasDateOverlap) {
    console.log(`Events DO overlap: ${event1DateStr} and ${event2DateStr}`);
  } else {
    console.log(`Events do NOT overlap: ${event1DateStr} and ${event2DateStr}`);
  }
  
  return hasDateOverlap;
}

/**
 * Calculate row for event to avoid overlaps
 * @param {Object} event - Event to calculate row for
 * @param {Array} eventsInCategory - Other events in the same category
 * @returns {number} Row number (0-based)
 */
export function calculateEventRow(event, eventsInCategory) {
  // DEBUG: Log event type and check row property
  console.log(`[ROW DEBUG] Calculating row for "${event.title}" (type: ${event.type})`);
  console.log(`[ROW DEBUG] Raw row value: ${event.row}, type: ${typeof event.row}`);
  
  // If the event already has a custom row defined, respect it but ensure it's a number
  if (event.row !== undefined && event.row !== null) {
    // Make sure it's converted to a number (especially important for CSV imports where values are strings)
    const rowNum = Number(event.row);
    console.log(`[ROW DEBUG] Using custom row ${rowNum} for event: ${event.title} (${event.type})`);
    return rowNum;
  }
  
  if (!eventsInCategory || eventsInCategory.length === 0) {
    console.log(`[ROW DEBUG] No events in category for ${event.title}, using row 0`);
    return 0;
  }
  
  console.log(`[ROW DEBUG] Need to calculate row for: ${event.title} (${event.type})`);
  console.log(`[ROW DEBUG] Category events count: ${eventsInCategory.length}`);
  
  // First, sort events by start date to ensure consistent row allocation
  const sortedEvents = [...eventsInCategory].sort((a, b) => a.start - b.start);
  
  // Create a list of events that potentially overlap with this one
  const overlappingEvents = [];
  
  for (const otherEvent of sortedEvents) {
    // Skip self events
    if (otherEvent.id === event.id) continue;
    
    // IMPORTANT: Changed to allow milestone events to be considered for overlap
    // Only skip if the event is not a range or milestone (e.g., life events)
    if (otherEvent.type !== 'range' && otherEvent.type !== 'milestone') {
      console.log(`[ROW DEBUG] Skipping non-range, non-milestone event: ${otherEvent.title} (${otherEvent.type})`);
      continue;
    }
    
    // Debug overlap check
    console.log(`[ROW DEBUG] Checking overlap: "${event.title}" vs "${otherEvent.title}"`);
    
    // Check if the other event's date range truly overlaps with this event
    if (eventsOverlap(event, otherEvent)) {
      console.log(`[ROW DEBUG] Found overlap between "${event.title}" and "${otherEvent.title}"`);
      overlappingEvents.push(otherEvent);
    }
  }
  
  // If no overlapping events, use first row (row 0)
  if (overlappingEvents.length === 0) {
    console.log(`No overlapping events for: ${event.title}, using row 0`);
    return 0;
  }
  
  // Find rows that are already taken by overlapping events
  const occupiedRows = new Set();
  overlappingEvents.forEach(e => {
    if (e.row !== undefined && e.row !== null) {
      // Convert to number to ensure consistent type comparison (especially for CSV imports)
      const rowNum = Number(e.row);
      occupiedRows.add(rowNum);
      console.log(`Event: ${e.title} occupies row ${rowNum}`);
    }
  });
  
  // Find the first available row
  let row = 0;
  while (occupiedRows.has(row)) {
    row++;
  }
  
  console.log(`Assigned row ${row} for: ${event.title}`);
  return row;
}

// =============================================================================
// SORTING AND GROUPING UTILITIES
// =============================================================================

/**
 * Sort events by date for better layout
 * @param {Array} events - Array of events to sort
 * @returns {Array} Sorted array of events
 */
export function sortByDate(events) {
  return [...events].sort((a, b) => a.start - b.start);
}

/**
 * Group events by category with date validation
 * @param {Array} events - Array of events to group
 * @returns {Object} Object with category names as keys and event arrays as values
 */
export function groupByCategory(events) {
  const categories = {};
  
  // Add events without category to "General" category, with date validation
  events.forEach(event => {
    // Validate dates are proper Date objects
    if (!(event.start instanceof Date) || (event.type === 'range' && !(event.end instanceof Date))) {
      console.error("Invalid date detected on event:", event.title, event.start, event.end);
      
      // Attempt to fix dates if they're strings
      if (typeof event.start === 'string') {
        event.start = new Date(event.start);
      }
      if (event.type === 'range' && typeof event.end === 'string') {
        event.end = new Date(event.end);
      }
      
      // Skip this event if dates still invalid
      if (isNaN(event.start.getTime()) || (event.type === 'range' && isNaN(event.end.getTime()))) {
        console.error("Couldn't fix invalid date, skipping event:", event.title);
        return;
      }
    }
    
    const categoryName = event.category || 'General';
    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }
    categories[categoryName].push(event);
  });
  
  return categories;
}

// =============================================================================
// GENERAL UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a random hex color
 * @returns {string} Random hex color string
 */
export function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Get the appropriate emoji for a milestone event
 * @param {Object} milestone - Milestone event object
 * @returns {string} Emoji string
 */
export function getMilestoneEmoji(milestone) {
  // Simplified function - always return the default emoji
  return DEFAULT_MILESTONE_EMOJI;
}

/**
 * Country name mapping for geographic data normalization
 */
export const COUNTRY_NAME_MAP = {
  "United States": "United States of America",
  "UK": "United Kingdom",
  "USA": "United States of America",
  "U.S.A.": "United States of America",
  "U.S.": "United States of America",
  "United Kingdom": "United Kingdom",
  "Great Britain": "United Kingdom",
  "French Guiana": "France", // Fix highlighting issue in South America - French Guiana is part of France
  "Guyane": "France"
  // Add more mappings as needed
};

/**
 * Normalize country names to match GeoJSON data
 * @param {string} name - Country name to normalize
 * @returns {string} Normalized country name
 */
export function normalizeCountryName(name) {
  if (!name) return name;
  // Return the mapped name or the original if no mapping exists
  return COUNTRY_NAME_MAP[name] || name;
}

// =============================================================================
// CSV PARSING UTILITIES
// =============================================================================

/**
 * Split CSV line handling quoted values properly
 * @param {string} line - CSV line to split
 * @returns {Array} Array of values
 */
export function splitCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

/**
 * Parse CSV text into objects with improved type handling
 * @param {string} text - CSV text to parse
 * @returns {Array} Array of objects
 */
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  const result = [];
  
  // Helper function to convert values to appropriate types
  function convertValue(header, value) {
    if (value === undefined || value === '') {
      return '';
    }
    
    // Handle boolean fields explicitly
    if (header === 'isImportant' || header === 'isParent' || header === 'isCustom' || header === '_customRow') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    
    // Handle numeric fields
    if (header === 'row') {
      // Empty, null, undefined, etc. become null
      if (value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    
    // Return string value for other fields
    return value;
  }
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = splitCSVLine(line);
    const obj = {};
    
    headers.forEach((header, idx) => {
      const rawValue = values[idx] !== undefined ? values[idx] : '';
      obj[header] = convertValue(header, rawValue);
    });
    
    result.push(obj);
  }
  return result;
}

// =============================================================================
// ANIMATION AND EASING UTILITIES
// =============================================================================

/**
 * Quintic ease-out function
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased progress value
 */
export function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Quintic ease-in-out function
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased progress value
 */
export function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Enhanced animation system using requestAnimationFrame
 * Provides smooth animations with configurable easing and frame rate control
 */
export class SmoothAnimation {
  constructor(options) {
    this.options = Object.assign({
      duration: 600,          // Animation duration in ms
      easing: easeInOutQuint, // Default easing function
      onUpdate: null,         // Update callback
      onComplete: null,       // Complete callback
      autoStart: true,        // Auto start the animation
      useRAF: true,           // Use requestAnimationFrame
      targetFPS: 60,          // Target frames per second
    }, options);
    
    this.startTime = null;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;
    this.frameDelay = 1000 / this.options.targetFPS;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.tick();
    return this;
  }
  
  stop() {
    if (this.animationFrameId) {
      if (this.options.useRAF) {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
    this.isRunning = false;
    return this;
  }
  
  tick() {
    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.options.duration, 1);
    const easedProgress = this.options.easing(progress);
    
    // Throttle updates based on targetFPS to prevent too many DOM changes
    const timeSinceLastFrame = now - this.lastFrameTime;
    const shouldUpdateFrame = timeSinceLastFrame >= this.frameDelay || progress >= 1;
    
    if (shouldUpdateFrame) {
      if (this.options.onUpdate) {
        this.options.onUpdate(easedProgress, progress);
      }
      this.lastFrameTime = now;
    }
    
    if (progress < 1) {
      // Schedule next frame
      if (this.options.useRAF) {
        this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
      } else {
        // Use setTimeout as a fallback with consistent timing
        const nextFrameDelay = Math.max(0, this.frameDelay - (performance.now() - now));
        this.animationFrameId = setTimeout(this.tick.bind(this), nextFrameDelay);
      }
    } else {
      this.isRunning = false;
      if (this.options.onComplete) {
        this.options.onComplete();
      }
    }
  }
}