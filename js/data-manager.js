/**
 * Data Manager Module
 * Comprehensive data import/export functionality for timeline events.
 * Handles CSV/YAML file parsing, conversion, validation, and statistics.
 */

import { 
  splitCSVLine, 
  parseCSV, 
  randomColor, 
  groupByCategory, 
  sortByDate, 
  calculateEventRow 
} from './utils.js';

import { 
  isDevelopmentMode 
} from './config.js';

// =============================================================================
// DATA IMPORT FUNCTIONALITY
// =============================================================================

/**
 * Process imported data and convert to internal event format
 * @param {Array} data - Raw imported data array
 * @param {number} nextId - Next available internal ID
 * @returns {Object} Object containing mapped events and updated nextId
 */
export function processImportedData(data, nextId) {
  // First pass: Map imported events with properties
  const mappedEvents = data.map(ev => {
    const type = ev.type || (ev.life_event ? 'life' : 'range');
    const start = new Date(ev.start);
    const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
    const color = ev.color || randomColor();
    const metadata = ev.metadata || '';
    // Only use explicit category; don't fall back to parent ID
    const category = ev.category || null;
    const place = ev.place || null;
    
    // Convert boolean fields with robust type handling
    const isImportant = typeof ev.isImportant === 'boolean' ? ev.isImportant :
                       (ev.isImportant === 'true' || ev.isImportant === '1');
                       
    const isParent = typeof ev.isParent === 'boolean' ? ev.isParent :
                    (ev.isParent === 'true' || ev.isParent === '1');
                    
    const categoryBgColor = ev.categoryBgColor || null;
    
    // Handle row number with improved null handling
    let row = null;
    if (ev.row !== undefined && ev.row !== null) {
      if (typeof ev.row === 'number') {
        row = ev.row;
      } else if (typeof ev.row === 'string') {
        if (ev.row !== '' && !isNaN(Number(ev.row))) {
          row = Number(ev.row);
        }
      }
    }
    
    // Track if this row came from imported data (custom) vs auto-assigned
    const _customRow = row !== null;
    
    // Handle location data in various formats
    let location = null;
    
    // Handle separated location_city and location_country fields (CSV import format)
    if (ev.location_city !== undefined || ev.location_country !== undefined) {
      location = {
        city: ev.location_city || '',
        country: ev.location_country || ''
      };
    }
    // Handle standard location object
    else if (ev.location) {
      // Handle object location format
      if (typeof ev.location === 'object') {
        location = {
          city: ev.location.city || '',
          country: ev.location.country || ''
        };
      } 
      // Handle string location format
      else if (typeof ev.location === 'string') {
        location = {
          city: '',
          country: ev.location
        };
      }
    }
    // Fallback to place field (legacy format)
    else if (place) {
      location = {
        city: '',
        country: place
      };
    }
    
    // Generate event ID if not provided - important for parent-child relationships
    // Convert ev.id to string if it exists, otherwise generate a new UUID
    const eventId = ev.id ? String(ev.id) : 
                    ev.eventId ? String(ev.eventId) : 
                    crypto.randomUUID();

    // Get the parent ID from various possible fields
    const parentId = ev.parentId || null;
    
    return { 
      id: nextId++, 
      eventId,
      title: ev.title, 
      start, 
      end, 
      type, 
      color, 
      metadata, 
      category, 
      place,  // Keep for backward compatibility
      location, // Add normalized location data
      isImportant,
      isParent,
      row,
      _customRow,
      categoryBgColor,
      // Raw parent identifier from CSV/YAML (string key)
      parentId
    };
  });
  
  // Log event IDs for debugging
  console.log('Imported events with IDs:', mappedEvents.map(e => ({ 
    title: e.title, 
    eventId: e.eventId, 
    parentId: e.parentId 
  })));
  
  // Second pass: Resolve raw parentId strings to numeric parent references
  // This is done in a separate pass to ensure all events are first loaded
  mappedEvents.forEach(evt => {
    if (evt.parentId) {
      const parent = mappedEvents.find(m => 
        // Match using eventId (from the current import)
        m.eventId === evt.parentId
      );
      
      if (parent) {
        console.log(`Resolved parentId ${evt.parentId} for "${evt.title}" to internal id ${parent.id}`);
        evt.parent = parent.id;
      } else {
        console.warn(`Could not find parent with eventId ${evt.parentId} for "${evt.title}"`);
      }
    }
  });
  
  // Third pass: Normalize row values within each category to avoid excessively tall timeline
  // Group events by category
  const eventsByCategory = {};
  mappedEvents.forEach(event => {
    if (event.type === 'range') {
      const category = event.category || 'uncategorized';
      if (!eventsByCategory[category]) {
        eventsByCategory[category] = [];
      }
      eventsByCategory[category].push(event);
    }
  });
  
  return {
    mappedEvents,
    nextId
  };
}

/**
 * Parse file content based on file type
 * @param {string} fileContent - File content as string
 * @param {string} fileType - File extension (csv, yaml, yml)
 * @returns {Array} Parsed data array
 */
export function parseFileContent(fileContent, fileType) {
  let data = [];
  
  if (fileType === 'csv') {
    data = parseCSV(fileContent);
  } else {
    // YAML or YML - use global jsyaml
    if (typeof jsyaml === 'undefined') {
      throw new Error('js-yaml library not loaded');
    }
    data = jsyaml.load(fileContent);
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Imported data must be an array of events');
  }
  
  return data;
}

// =============================================================================
// DATA EXPORT FUNCTIONALITY
// =============================================================================

/**
 * Convert events to CSV format
 * @param {Array} events - Array of event objects
 * @returns {string} CSV formatted string
 */
export function eventsToCSV(events) {
  if (events.length === 0) return '';
  
  // Get all possible headers from all events
  const headers = new Set();
  
  // Always include these critical headers to ensure they're in the export
  // even if no current event has them
  headers.add('start');
  headers.add('end');
  headers.add('title');
  headers.add('type');
  headers.add('color');
  headers.add('metadata');
  headers.add('category');
  headers.add('isImportant');
  headers.add('isParent');
  headers.add('row');
  headers.add('location_city');
  headers.add('location_country');
  headers.add('eventId');
  headers.add('parentId'); // Always include parentId field
  
  // Add additional headers from all events
  events.forEach(event => {
    Object.keys(event).forEach(key => {
      if (key === 'id') return; // Skip internal ID
      if (key === 'start' || key === 'end') {
        // Already added above
      } else if (key === 'location') {
        // Already added location_city and location_country above
      } else if (key !== 'parent') { // Skip 'parent' field as it's an internal reference
        headers.add(key);
      }
    });
  });
  
  // Convert headers set to array
  const headerArray = Array.from(headers);
  
  // Create CSV header row
  let csv = headerArray.join(',') + '\n';
  
  // Add each event as a row
  events.forEach(event => {
    // Pre-process parent information
    let parentIdValue = event.parentId || '';
    if (!parentIdValue && event.parent) {
      // If we don't have parentId but have parent reference, try to get the parent's eventId
      const parentEvent = events.find(e => e.id === event.parent);
      if (parentEvent && parentEvent.eventId) {
        parentIdValue = parentEvent.eventId;
      }
    }
    
    const row = headerArray.map(header => {
      if (header === 'start' || header === 'end') {
        return event[header] ? event[header].toISOString().slice(0, 10) : '';
      } else if (header === 'location_city') {
        return event.location ? (event.location.city || '') : '';
      } else if (header === 'location_country') {
        return event.location ? (event.location.country || '') : '';
      } else if (header === 'parentId') {
        return parentIdValue;
      } else if (header === 'isImportant') {
        // Special handling for isImportant to ensure it's always a proper boolean string
        return event.isImportant === true || event.isImportant === 'true' ? 'true' : 'false';
      } else if (header === 'isParent') {
        // Special handling for isParent to ensure it's always a proper boolean string
        return event.isParent === true || event.isParent === 'true' ? 'true' : 'false';
      } else if (typeof event[header] === 'boolean') {
        return event[header] ? 'true' : 'false';
      } else if (typeof event[header] === 'object' && event[header] !== null) {
        return JSON.stringify(event[header]).replace(/"/g, '""');
      } else {
        return event[header] !== undefined ? String(event[header]).replace(/"/g, '""') : '';
      }
    }).map(value => {
      // Enclose in quotes if contains comma, newline or double quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }
      return value;
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Convert events to YAML export format
 * @param {Array} events - Array of event objects
 * @returns {Object} Export data object ready for YAML conversion
 */
export function eventsToYAMLData(events) {
  // Update the state of all events by performing recalculations
  Object.keys(groupByCategory(events)).forEach(category => {
    const categoryEvents = events.filter(e => (e.category || 'General') === category && (e.type === 'range' || e.type === 'milestone'));
    const sortedEvents = sortByDate(categoryEvents);
    
    sortedEvents.forEach(event => {
      event.row = calculateEventRow(event, categoryEvents);
    });
  });
  
  const exportData = events.map(d => {
    // Start with basic required fields
    const ev = { 
      title: d.title, 
      start: d.start.toISOString().slice(0, 10)
    };
    
    // Include custom ID if available
    if (d.eventId) {
      ev.id = d.eventId;
    }
    
    // Add end date for range events
    if (d.type === 'range') {
      ev.end = d.end.toISOString().slice(0, 10);
    }
    
    // Always include type to avoid ambiguity
    ev.type = d.type;
    
    // Include all additional properties if they exist
    if (d.color) ev.color = d.color;
    if (d.metadata) ev.metadata = d.metadata;
    if (d.category) ev.category = d.category;
    if (d.categoryBgColor) ev.categoryBgColor = d.categoryBgColor;
    
    // Include custom emoji for milestone events
    if (d.type === 'milestone' && d.emoji) {
      ev.emoji = d.emoji;
    }
    
    // Explicitly include boolean flags
    if (d.isImportant) ev.isImportant = true;
    if (d.isParent) ev.isParent = true;
    
    // Include row position if specified
    if (d.row !== null && d.row !== undefined) {
      ev.row = d.row;
    }
    
    // Handle parent references
    if (d.parentId) {
      // If we have a direct parentId, use it
      ev.parentId = d.parentId;
    } else if (d.parent) {
      // Otherwise try to find the parent's eventId
      const parent = events.find(event => event.id === d.parent);
      if (parent && parent.eventId) {
        ev.parentId = parent.eventId;
      }
    }
    
    // Export location data in structured format
    if (d.location) {
      ev.location = {
        city: d.location.city || '',
        country: d.location.country || ''
      };
    }
    
    return ev;
  });
  
  return exportData;
}

/**
 * Normalize events data for consistent export
 * @param {Array} events - Array of event objects
 * @returns {Array} Normalized events array
 */
export function normalizeEventsForExport(events) {
  // Update the state of all events by performing recalculations
  Object.keys(groupByCategory(events)).forEach(category => {
    const categoryEvents = events.filter(e => (e.category || 'General') === category && (e.type === 'range' || e.type === 'milestone'));
    const sortedEvents = sortByDate(categoryEvents);
    
    sortedEvents.forEach(event => {
      event.row = calculateEventRow(event, categoryEvents);
    });
  });
  
  // Preprocess events to normalize data for consistent CSV export
  const normalizedEvents = events.map(event => {
    // Create a copy to avoid modifying the original event
    const normalizedEvent = {...event};
    
    // Ensure boolean fields are properly formatted
    normalizedEvent.isImportant = normalizedEvent.isImportant === true ? true : false;
    normalizedEvent.isParent = normalizedEvent.isParent === true ? true : false;
    
    // Ensure parentId is a string or null
    if (normalizedEvent.parentId !== undefined && normalizedEvent.parentId !== null) {
      normalizedEvent.parentId = String(normalizedEvent.parentId);
    }
    
    // Ensure row is a number or null
    if (normalizedEvent.row !== undefined && normalizedEvent.row !== null && normalizedEvent.row !== '') {
      normalizedEvent.row = Number(normalizedEvent.row);
    } else {
      normalizedEvent.row = null;
    }
    
    return normalizedEvent;
  });
  
  return normalizedEvents;
}

// =============================================================================
// DATA VALIDATION AND STATISTICS
// =============================================================================

/**
 * Display import statistics
 * @param {Array} data - Imported event data array
 * @param {string} fileType - File type (csv, yaml, etc.)
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

/**
 * Calculate comprehensive statistics for events data
 * @param {Array} data - Event data array
 * @returns {Object} Statistics object
 */
export function calculateDataStats(data) {
  const stats = {
    totalEvents: data.length,
    categories: new Set(),
    locations: new Set(),
    types: {
      range: 0,
      life: 0,
      milestone: 0
    },
    parentChildRelations: 0,
    importantEvents: 0,
    parentEvents: 0,
    dateRange: {
      earliest: null,
      latest: null
    }
  };
  
  data.forEach(event => {
    // Count categories
    if (event.category) stats.categories.add(event.category);
    
    // Count locations
    if (event.location && event.location.country) {
      stats.locations.add(event.location.country);
    }
    
    // Count event types
    if (stats.types[event.type] !== undefined) {
      stats.types[event.type]++;
    }
    
    // Count parent-child relationships
    if (event.parentId || event.parent) {
      stats.parentChildRelations++;
    }
    
    // Count important events
    if (event.isImportant) {
      stats.importantEvents++;
    }
    
    // Count parent events
    if (event.isParent) {
      stats.parentEvents++;
    }
    
    // Track date range
    const eventDate = event.start instanceof Date ? event.start : new Date(event.start);
    if (!stats.dateRange.earliest || eventDate < stats.dateRange.earliest) {
      stats.dateRange.earliest = eventDate;
    }
    if (!stats.dateRange.latest || eventDate > stats.dateRange.latest) {
      stats.dateRange.latest = eventDate;
    }
  });
  
  // Convert sets to counts
  stats.categoriesCount = stats.categories.size;
  stats.locationsCount = stats.locations.size;
  
  return stats;
}

// =============================================================================
// DATA COMPARISON AND TESTING UTILITIES
// =============================================================================

/**
 * Helper to normalize values for comparison
 * @param {*} value - Value to normalize
 * @param {string} type - Type hint for normalization
 * @returns {*} Normalized value
 */
export function normalizeValue(value, type) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    switch (type) {
      case 'boolean':
        // Convert to canonical boolean
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return !!value;
        
      case 'number': 
        // Convert to canonical number or null
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        const num = Number(value);
        return isNaN(num) ? null : num;
        
      case 'string':
        // Convert to canonical string, but preserve null/undefined
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return String(value).trim();
        
      case 'date':
        // Convert to YYYY-MM-DD format
        if (value instanceof Date) {
          return value.toISOString().slice(0, 10);
        } else if (typeof value === 'string') {
          // Handle ISO string, YYYY-MM-DD, or other string formats
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toISOString().slice(0, 10);
            }
          } catch (e) {
            // If date parsing fails, return original string
          }
        }
        return value || null;
        
      default:
        return value;
    }
}

/**
 * Helper to compare two values with normalization
 * @param {*} originalVal - Original value
 * @param {*} importedVal - Imported value
 * @param {string} type - Type hint for comparison
 * @returns {boolean} True if values are equal after normalization
 */
export function areValuesEqual(originalVal, importedVal, type) {
  const normalizedOriginal = normalizeValue(originalVal, type);
  const normalizedImported = normalizeValue(importedVal, type);
  
  // If both are null-like, consider equal
  if (normalizedOriginal === null && normalizedImported === null) {
    return true;
  }
  
  return normalizedOriginal === normalizedImported;
}

/**
 * Compare two events for testing purposes
 * @param {Object} original - Original event object
 * @param {Object} imported - Imported event object
 * @param {string} context - Context string for debugging
 * @returns {Object} Comparison results with issues array
 */
export function compareEvents(original, imported, context) {
  const issues = [];
  
  // Simple utility to add an issue
  function addIssue(field, originalValue, importedValue) {
    // Format values for display, handling null/undefined properly
    const formatValue = (val) => {
      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (val === '') return '(empty)';
      return `'${val}'`;
    };
    
    const message = `${field} mismatch: expected ${formatValue(originalValue)} but got ${formatValue(importedValue)}`;
    issues.push(message);
  }
  
  // Compare important fields
  const fieldsToCompare = [
    { name: 'title', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'metadata', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'color', type: 'string' },
    { name: 'isImportant', type: 'boolean' },
    { name: 'isParent', type: 'boolean' },
    { name: 'row', type: 'number' },
    { name: 'eventId', type: 'string' },
    { name: 'parentId', type: 'string' }
  ];
  
  fieldsToCompare.forEach(field => {
    const fieldName = field.name;
    const fieldType = field.type;
    
    // Skip comparison if both fields are missing/empty
    const origValue = original[fieldName];
    const impValue = imported[fieldName];
    
    // Consider undefined, null, and empty string as equivalent "empty" values
    const isOrigEmpty = origValue === undefined || origValue === null || origValue === '';
    const isImpEmpty = impValue === undefined || impValue === null || impValue === '';
    
    if (isOrigEmpty && isImpEmpty) {
      return;
    }
    
    if (!areValuesEqual(original[fieldName], imported[fieldName], fieldType)) {
      // Debug logging removed - comparison should work correctly now
      addIssue(fieldName, original[fieldName], imported[fieldName]);
    }
  });
  
  // Special handling for dates
  if (!areValuesEqual(original.start, imported.start, 'date')) {
    addIssue('start', original.start, imported.start);
  }
  
  if (original.type === 'range' && !areValuesEqual(original.end, imported.end, 'date')) {
    addIssue('end', original.end, imported.end);
  }
  
  // Special handling for location data
  if (original.location || imported.location || imported.location_city || imported.location_country) {
    const originalCity = original.location ? (original.location.city || '') : '';
    const originalCountry = original.location ? (original.location.country || '') : '';
    
    // Handle both location object and flattened location_city/location_country
    let importedCity = '';
    let importedCountry = '';
    
    if (imported.location) {
      importedCity = imported.location.city || '';
      importedCountry = imported.location.country || '';
    } else {
      importedCity = imported.location_city || '';
      importedCountry = imported.location_country || '';
    }
    
    if (!areValuesEqual(originalCity, importedCity, 'string')) {
      addIssue('location.city', originalCity, importedCity);
    }
    if (!areValuesEqual(originalCountry, importedCountry, 'string')) {
      addIssue('location.country', originalCountry, importedCountry);
    }
  }
  
  return {
    issues: issues,
    success: issues.length === 0
  };
}

/**
 * Create test events for import/export testing
 * @returns {Array} Array of test event objects
 */
export function createTestEvents() {
  return [
    {
      id: 'parent-1',
      title: 'Parent Event 1',
      start: '2023-01-01',
      type: 'milestone',
      isParent: true
    },
    {
      id: 'parent-2', 
      title: 'Parent Event 2',
      start: '2023-02-01',
      type: 'milestone',
      isParent: true
    },
    {
      id: 'child-1',
      title: 'Child Event 1',
      start: '2023-01-15',
      parentId: 'parent-1',
      type: 'milestone'
    },
    {
      id: 'grandchild-1',
      title: 'Grandchild Event 1',
      start: '2023-01-20',
      parentId: 'child-1',
      type: 'milestone'
    },
    {
      id: 'child-2',
      title: 'Child Event 2',
      start: '2023-02-15',
      parentId: 'parent-2',
      type: 'milestone'
    }
  ];
}

/**
 * Test parent-child relationship preservation in CSV import/export
 * @param {Array} testEvents - Array of test events
 * @returns {boolean} True if all relationships are preserved
 */
export function testParentChildPreservation(testEvents) {
  console.log('Running parent-child relationship preservation test...');
  
  // Convert to internal event format
  const internalEvents = testEvents.map((ev, idx) => {
    return {
      id: idx + 1,
      eventId: ev.id,
      title: ev.title,
      start: new Date(ev.start),
      end: new Date(ev.start),
      type: ev.type,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      metadata: '',
      isParent: !!ev.isParent,
      parentId: ev.parentId || null
    };
  });
  
  // Resolve parent references
  internalEvents.forEach(evt => {
    if (evt.parentId) {
      const parent = internalEvents.find(m => m.eventId === evt.parentId);
      if (parent) {
        evt.parent = parent.id;
      }
    }
  });
  
  console.log('Original test events:', internalEvents);
  
  // Export to CSV
  const csv = eventsToCSV(internalEvents);
  console.log('CSV Export:', csv);
  
  // Parse CSV back to objects
  const reimportedData = parseCSV(csv);
  console.log('Re-imported data:', reimportedData);
  
  // Map imported events to internal format
  const reimportedEvents = reimportedData.map((ev, idx) => {
    const start = new Date(ev.start);
    const end = new Date(ev.end || ev.start);
    return {
      id: idx + 1000, // Use different ID range to avoid conflicts
      eventId: ev.eventId,
      title: ev.title,
      start,
      end,
      type: ev.type,
      color: ev.color,
      isParent: ev.isParent === 'true',
      parentId: ev.parentId || null
    };
  });
  
  // Resolve parent references in reimported data
  reimportedEvents.forEach(evt => {
    if (evt.parentId) {
      const parent = reimportedEvents.find(m => m.eventId === evt.parentId);
      if (parent) {
        evt.parent = parent.id;
      } else {
        console.error(`Failed to resolve parent ID ${evt.parentId} for event ${evt.title}`);
      }
    }
  });
  
  console.log('Re-imported events:', reimportedEvents);
  
  // Verify parent-child relationships are preserved
  let allRelationshipsPreserved = true;
  
  // Check each original event
  internalEvents.forEach(original => {
    const reimported = reimportedEvents.find(r => r.eventId === original.eventId);
    
    if (!reimported) {
      console.error(`Event "${original.title}" (ID: ${original.eventId}) was not found in reimported data`);
      allRelationshipsPreserved = false;
      return;
    }
    
    // Check if parent relationship is preserved
    if (original.parentId !== reimported.parentId) {
      console.error(`Parent ID mismatch for "${original.title}": original=${original.parentId}, reimported=${reimported.parentId}`);
      allRelationshipsPreserved = false;
    }
    
    // Check if isParent flag is preserved
    if (original.isParent !== reimported.isParent) {
      console.error(`isParent flag mismatch for "${original.title}": original=${original.isParent}, reimported=${reimported.isParent}`);
      allRelationshipsPreserved = false;
    }
  });
  
  if (allRelationshipsPreserved) {
    console.log('✅ All parent-child relationships preserved successfully!');
  } else {
    console.error('❌ Some parent-child relationships were not preserved correctly.');
  }
  
  return allRelationshipsPreserved;
}

// =============================================================================
// FILE HANDLING UTILITIES
// =============================================================================

/**
 * Create and trigger file download
 * @param {string} content - File content
 * @param {string} filename - Filename for download
 * @param {string} mimeType - MIME type for the file
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Read file using FileReader API
 * @param {File} file - File object from input
 * @returns {Promise<string>} Promise resolving to file content
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename with extension
 * @returns {string} File extension in lowercase
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// =============================================================================
// FORMAT CONVERSION UTILITIES
// =============================================================================

/**
 * Convert between different data formats
 * @param {Array} data - Event data array
 * @param {string} fromFormat - Source format (yaml, csv)
 * @param {string} toFormat - Target format (yaml, csv)
 * @returns {string} Converted data string
 */
export function convertDataFormat(data, fromFormat, toFormat) {
  if (fromFormat === toFormat) {
    return data;
  }
  
  let events = data;
  
  // If converting from CSV string, parse it first
  if (fromFormat === 'csv' && typeof data === 'string') {
    events = parseCSV(data);
  }
  
  // If converting from YAML string, parse it first
  if (fromFormat === 'yaml' && typeof data === 'string') {
    if (typeof jsyaml === 'undefined') {
      throw new Error('js-yaml library not loaded');
    }
    events = jsyaml.load(data);
  }
  
  // Convert to target format
  if (toFormat === 'csv') {
    return eventsToCSV(events);
  } else if (toFormat === 'yaml') {
    if (typeof jsyaml === 'undefined') {
      throw new Error('js-yaml library not loaded');
    }
    const exportData = eventsToYAMLData(events);
    return jsyaml.dump(exportData);
  }
  
  throw new Error(`Unsupported format conversion: ${fromFormat} to ${toFormat}`);
}

// =============================================================================
// COMPREHENSIVE TESTING FUNCTIONALITY
// =============================================================================

/**
 * Run comprehensive import/export tests
 * @returns {Promise<Object>} Test results object
 */
export async function testComprehensiveImportExport() {
  console.log('🧪 Running comprehensive import/export tests...');
  
  // Create results object to collect test results
  const testResults = {
    yamlToCsv: { success: false, issues: [] },
    csvToCsv: { success: false, issues: [] }
  };
  
  try {
    // PART 1: Test YAML to CSV flow
    console.log('🔍 Testing YAML to CSV import/export flow...');
    
    // 1. Load YAML from data/events.yaml
    const yamlResponse = await fetch('data/events.yaml');
    const yamlText = await yamlResponse.text();
    
    if (typeof jsyaml === 'undefined') {
      throw new Error('js-yaml library not loaded');
    }
    const yamlData = jsyaml.load(yamlText);
    
    if (!Array.isArray(yamlData)) {
      throw new Error('YAML data is not an array of events');
    }
    
    console.log(`Loaded ${yamlData.length} events from YAML`);
    
    // 2. Convert to internal event format (similar to import logic)
    const eventsFromYaml = yamlData.map((ev, idx) => {
      const type = ev.type || (ev.life_event ? 'life' : 'range');
      const start = new Date(ev.start);
      const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
      
      // Handle location
      let location = null;
      if (ev.location) {
        if (typeof ev.location === 'object') {
          location = {
            city: ev.location.city || '',
            country: ev.location.country || ''
          };
        } else if (typeof ev.location === 'string') {
          location = {
            city: '',
            country: ev.location
          };
        }
      }
      
      // Use existing ID or generate a new one
      const eventId = ev.id || crypto.randomUUID();
      
      return {
        id: idx + 1,
        eventId,
        title: ev.title,
        start,
        end,
        type,
        color: ev.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
        metadata: ev.metadata || '',
        category: ev.category || null,
        location,
        isImportant: !!ev.isImportant,
        isParent: !!ev.isParent,
        row: ev.row !== undefined ? Number(ev.row) : null,
        parentId: ev.parentId || null,
        categoryBgColor: ev.categoryBgColor || null
      };
    });
    
    // Set parent references
    eventsFromYaml.forEach(evt => {
      if (evt.parentId) {
        const parent = eventsFromYaml.find(e => e.eventId === evt.parentId);
        if (parent) {
          evt.parent = parent.id;
        }
      }
    });
    
    // 3. Export to CSV
    const csv = eventsToCSV(eventsFromYaml);
    console.log('Exported YAML data to CSV successfully');
    
    // 4. Re-import the CSV
    const csvData = parseCSV(csv);
    
    // 5. Convert back to internal format for comparison
    const reimportedEvents = csvData.map((ev, idx) => {
      // Here we're being careful to keep string values as strings
      // to test if the comparison logic correctly handles type conversions
      return {
        id: idx + 1000, // Different ID range to avoid conflicts
        eventId: ev.eventId,
        title: ev.title,
        start: ev.start, // Keep as string
        end: ev.end, // Keep as string
        type: ev.type,
        color: ev.color,
        metadata: ev.metadata || '',
        category: ev.category || null,
        location_city: ev.location_city || '',
        location_country: ev.location_country || '',
        isImportant: ev.isImportant, // Keep as string 'true'/'false'
        isParent: ev.isParent, // Keep as string
        row: ev.row,
        parentId: ev.parentId || null,
        categoryBgColor: ev.categoryBgColor || null
      };
    });
    
    // 6. Compare events for field-by-field fidelity
    const yamlIssues = [];
    
    eventsFromYaml.forEach(original => {
      const reimported = reimportedEvents.find(e => e.eventId === original.eventId);
      
      if (!reimported) {
        yamlIssues.push({
          type: 'missing',
          eventTitle: original.title,
          eventId: original.eventId
        });
        return;
      }
      
      const eventIssues = compareEvents(original, reimported, 'yaml-to-csv');
      if (eventIssues.length > 0) {
        yamlIssues.push(...eventIssues);
      }
    });
    
    testResults.yamlToCsv.success = yamlIssues.length === 0;
    testResults.yamlToCsv.issues = yamlIssues;
    
    if (yamlIssues.length === 0) {
      console.log('✅ YAML to CSV test passed: All event data preserved during export/import cycle');
    } else {
      console.error(`❌ YAML to CSV test failed: ${yamlIssues.length} issues found`);
      
      // Group issues by field for better debugging
      const issuesByField = {};
      yamlIssues.forEach(issue => {
        if (!issue.field) return;
        
        if (!issuesByField[issue.field]) {
          issuesByField[issue.field] = [];
        }
        issuesByField[issue.field].push(issue);
      });
      
      // Log summary of issues by field
      console.log('Issues by field:');
      Object.keys(issuesByField).forEach(field => {
        const fieldIssues = issuesByField[field];
        console.log(`- ${field}: ${fieldIssues.length} issues`);
        
        // Show an example for each field
        if (fieldIssues.length > 0) {
          const example = fieldIssues[0];
          console.log(`  Example: "${example.eventTitle}" - Original: ${JSON.stringify(example.original)} | Imported: ${JSON.stringify(example.imported)}`);
        }
      });
      
      // Log the full issue details in a table
      console.table(yamlIssues);
    }
    
    // PART 2: Test CSV to CSV flow
    console.log('🔍 Testing CSV to CSV import/export flow...');
    
    // 1. Load CSV from data/events.csv
    const csvResponse = await fetch('data/events.csv');
    const csvText = await csvResponse.text();
    const csvOrigData = parseCSV(csvText);
    
    if (!Array.isArray(csvOrigData)) {
      throw new Error('CSV data is not an array of events');
    }
    
    console.log(`Loaded ${csvOrigData.length} events from CSV`);
    
    // 2. Convert to internal format
    const eventsFromCsv = csvOrigData.map((ev, idx) => {
      const type = ev.type || 'range';
      const start = new Date(ev.start);
      const end = new Date(ev.end || ev.start);
      
      // Create location object from location_city and location_country
      const location = {
        city: ev.location_city || '',
        country: ev.location_country || ''
      };
      
      // Use existing eventId or generate one
      const eventId = ev.eventId || crypto.randomUUID();
      
      // Convert boolean strings
      const isImportant = ev.isImportant === 'true' || ev.isImportant === true;
      const isParent = ev.isParent === 'true' || ev.isParent === true;
      
      return {
        id: idx + 2000, // Different ID range
        eventId,
        title: ev.title,
        start,
        end,
        type,
        color: ev.color || '#000000',
        metadata: ev.metadata || '',
        category: ev.category || null,
        location,
        isImportant,
        isParent,
        row: ev.row === '' || ev.row === null || ev.row === undefined ? null : Number(ev.row),
        parentId: ev.parentId || null,
        categoryBgColor: ev.categoryBgColor || null
      };
    });
    
    // Set parent references
    eventsFromCsv.forEach(evt => {
      if (evt.parentId) {
        const parent = eventsFromCsv.find(e => e.eventId === evt.parentId);
        if (parent) {
          evt.parent = parent.id;
        }
      }
    });
    
    // 3. Export to CSV
    const csvOutput = eventsToCSV(eventsFromCsv);
    console.log('Exported CSV data back to CSV successfully');
    
    // 4. Re-import the CSV
    const reExportedCsvData = parseCSV(csvOutput);
    
    // 5. Compare original CSV data with re-exported data
    const csvIssues = [];
    
    csvOrigData.forEach(original => {
      const reimported = reExportedCsvData.find(e => e.eventId === original.eventId);
      
      if (!reimported) {
        csvIssues.push({
          type: 'missing',
          eventTitle: original.title,
          eventId: original.eventId
        });
        return;
      }
      
      const eventIssues = compareEvents(original, reimported, 'csv-to-csv');
      if (eventIssues.length > 0) {
        csvIssues.push(...eventIssues);
      }
    });
    
    testResults.csvToCsv.success = csvIssues.length === 0;
    testResults.csvToCsv.issues = csvIssues;
    
    if (csvIssues.length === 0) {
      console.log('✅ CSV to CSV test passed: All event data preserved during export/import cycle');
    } else {
      console.error(`❌ CSV to CSV test failed: ${csvIssues.length} issues found`);
      
      // Group issues by field for better debugging
      const issuesByField = {};
      csvIssues.forEach(issue => {
        if (!issue.field) return;
        
        if (!issuesByField[issue.field]) {
          issuesByField[issue.field] = [];
        }
        issuesByField[issue.field].push(issue);
      });
      
      // Log summary of issues by field
      console.log('CSV-to-CSV Issues by field:');
      Object.keys(issuesByField).forEach(field => {
        const fieldIssues = issuesByField[field];
        console.log(`- ${field}: ${fieldIssues.length} issues`);
        
        // Show examples for each field (up to 3)
        const exampleCount = Math.min(fieldIssues.length, 3);
        for (let i = 0; i < exampleCount; i++) {
          const example = fieldIssues[i];
          console.log(`  Example ${i+1}: "${example.eventTitle}" - Original: ${JSON.stringify(example.original)} | Imported: ${JSON.stringify(example.imported)}`);
        }
      });
      
      // Log the full issue details in a table
      console.table(csvIssues);
    }
    
    // Report overall test results
    if (testResults.yamlToCsv.success && testResults.csvToCsv.success) {
      console.log('🎉 All import/export tests passed successfully!');
    } else {
      console.error('⚠️ Some import/export tests failed. See details above.');
      
      // Identify and report on common issues
      const commonIssues = new Set();
      const allIssues = [...testResults.yamlToCsv.issues, ...testResults.csvToCsv.issues];
      
      // Create a summary of all issues by field
      const fieldCounts = {};
      allIssues.forEach(issue => {
        if (!issue.field) return;
        
        if (!fieldCounts[issue.field]) {
          fieldCounts[issue.field] = 1;
        } else {
          fieldCounts[issue.field]++;
        }
      });
      
      // Add common issues
      Object.entries(fieldCounts)
        .sort((a, b) => b[1] - a[1])  // Sort by count descending
        .forEach(([field, count]) => {
          console.error(`⚠️ Field "${field}" has ${count} issues across both tests`);
          
          // Explain common issues
          switch(field) {
            case 'isImportant':
            case 'isParent':
              commonIssues.add(`Boolean values for ${field} are not consistently handled`);
              break;
              
            case 'row':
              commonIssues.add('Numeric row values might be handled inconsistently (null vs empty string vs number)');
              break;
              
            case 'parentId':
              commonIssues.add('Parent-child relationships are not being preserved correctly');
              break;
              
            case 'location.city':
            case 'location.country':
            case 'location_city':
            case 'location_country':
              commonIssues.add('Location format conversion between object and flat fields is inconsistent');
              break;
          }
        });
      
      if (commonIssues.size > 0) {
        console.log('\nPossible issues that need to be addressed:');
        [...commonIssues].forEach(issue => {
          console.log(`- ${issue}`);
        });
      }
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { error };
  }
}

// isDevelopmentMode is imported from config.js