// Testing Module
// This module contains all testing functionality for import/export validation

import { eventsToCSV, parseFileContent, processImportedData, compareEvents, createTestEvents } from './data-manager.js';
import { randomColor, normalizeValue, areValuesEqual } from './utils.js';
import { isDevelopmentMode } from './config.js';

/**
 * Test parent-child relationship preservation through CSV import/export
 * @param {Array} testEvents - Optional test events to use
 * @returns {Object} Test results
 */
export function testParentChildPreservation(testEvents = null) {
  console.log('Running parent-child relationship preservation test...');
  
  // Use provided test events or create default ones
  const events = testEvents || createDefaultTestEvents();
  
  // Convert to internal event format
  const internalEvents = events.map((ev, idx) => {
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
      id: idx + 1000,
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
  
  // Resolve parent references for reimported events
  reimportedEvents.forEach(evt => {
    if (evt.parentId) {
      const parent = reimportedEvents.find(m => m.eventId === evt.parentId);
      if (parent) {
        evt.parent = parent.id;
      }
    }
  });
  
  console.log('Re-imported events with resolved parents:', reimportedEvents);
  
  // Compare original and reimported events
  let allTestsPassed = true;
  const testResults = [];
  
  internalEvents.forEach(originalEvent => {
    const reimportedEvent = reimportedEvents.find(ev => ev.eventId === originalEvent.eventId);
    
    if (!reimportedEvent) {
      console.error(`Event ${originalEvent.eventId} not found in reimported data`);
      testResults.push({ eventId: originalEvent.eventId, passed: false, error: 'Event not found' });
      allTestsPassed = false;
      return;
    }
    
    // Compare key properties
    const comparison = {
      eventId: originalEvent.eventId,
      passed: true,
      details: {}
    };
    
    // Check basic properties
    if (originalEvent.title !== reimportedEvent.title) {
      comparison.passed = false;
      comparison.details.title = { original: originalEvent.title, reimported: reimportedEvent.title };
    }
    
    if (originalEvent.type !== reimportedEvent.type) {
      comparison.passed = false;
      comparison.details.type = { original: originalEvent.type, reimported: reimportedEvent.type };
    }
    
    if (originalEvent.isParent !== reimportedEvent.isParent) {
      comparison.passed = false;
      comparison.details.isParent = { original: originalEvent.isParent, reimported: reimportedEvent.isParent };
    }
    
    if (originalEvent.parentId !== reimportedEvent.parentId) {
      comparison.passed = false;
      comparison.details.parentId = { original: originalEvent.parentId, reimported: reimportedEvent.parentId };
    }
    
    testResults.push(comparison);
    if (!comparison.passed) {
      allTestsPassed = false;
      console.error(`Test failed for event ${originalEvent.eventId}:`, comparison.details);
    }
  });
  
  console.log(allTestsPassed ? '✅ All parent-child tests passed!' : '❌ Some parent-child tests failed');
  
  return {
    success: allTestsPassed,
    results: testResults,
    originalEvents: internalEvents,
    reimportedEvents: reimportedEvents
  };
}

/**
 * Comprehensive import/export test for YAML and CSV formats
 * @returns {Promise<Object>} Test results
 */
export async function testComprehensiveImportExport() {
  console.log('🧪 Starting comprehensive import/export tests...');
  
  const results = {
    yamlToCsv: { success: false, issues: [] },
    csvToCsv: { success: false, issues: [] }
  };
  
  try {
    // Test 1: YAML → CSV → YAML roundtrip
    console.log('📄 Testing YAML ↔ CSV roundtrip...');
    
    const yamlTestData = createTestYAMLData();
    console.log('Original YAML test data:', yamlTestData);
    
    // Process as if imported from YAML
    const processedFromYAML = processImportedData(yamlTestData, 1);
    console.log('Processed from YAML:', processedFromYAML);
    
    // Export to CSV
    const csvExport = eventsToCSV(processedFromYAML.events);
    console.log('CSV Export:', csvExport);
    
    // Re-import from CSV
    const csvData = parseFileContent(csvExport, 'csv');
    const processedFromCSV = processImportedData(csvData, 100);
    console.log('Re-imported from CSV:', processedFromCSV);
    
    // Compare original and final
    const yamlComparison = compareImportExportResults(processedFromYAML.events, processedFromCSV.events);
    results.yamlToCsv = yamlComparison;
    
    // Test 2: CSV → CSV roundtrip
    console.log('📊 Testing CSV ↔ CSV roundtrip...');
    
    const csvTestData = createTestCSVData();
    console.log('Original CSV test data:', csvTestData);
    
    // Process as if imported from CSV
    const processedFromCSV1 = processImportedData(csvTestData, 200);
    console.log('First CSV processing:', processedFromCSV1);
    
    // Export to CSV again
    const csvExport2 = eventsToCSV(processedFromCSV1.events);
    console.log('Second CSV Export:', csvExport2);
    
    // Re-import from CSV again
    const csvData2 = parseFileContent(csvExport2, 'csv');
    const processedFromCSV2 = processImportedData(csvData2, 300);
    console.log('Second CSV processing:', processedFromCSV2);
    
    // Compare original and final
    const csvComparison = compareImportExportResults(processedFromCSV1.events, processedFromCSV2.events);
    results.csvToCsv = csvComparison;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    results.yamlToCsv.issues.push(`Test execution error: ${error.message}`);
    results.csvToCsv.issues.push(`Test execution error: ${error.message}`);
  }
  
  // Summary
  const allPassed = results.yamlToCsv.success && results.csvToCsv.success;
  console.log(allPassed ? '✅ All comprehensive tests passed!' : '❌ Some comprehensive tests failed');
  
  if (!allPassed) {
    console.log('YAML ↔ CSV issues:', results.yamlToCsv.issues);
    console.log('CSV ↔ CSV issues:', results.csvToCsv.issues);
  }
  
  return results;
}

/**
 * Compare import/export results for data integrity
 * @param {Array} original - Original events
 * @param {Array} processed - Processed events
 * @returns {Object} Comparison results
 */
function compareImportExportResults(original, processed) {
  const issues = [];
  
  // Check event count
  if (original.length !== processed.length) {
    issues.push(`Event count mismatch: ${original.length} vs ${processed.length}`);
  }
  
  // Check each event
  original.forEach((origEvent, index) => {
    const procEvent = processed.find(e => e.eventId === origEvent.eventId);
    
    if (!procEvent) {
      issues.push(`Event ${origEvent.eventId} missing in processed data`);
      return;
    }
    
    // Use the existing compareEvents function
    const comparison = compareEvents(origEvent, procEvent, `Event ${origEvent.eventId}`);
    if (comparison.issues.length > 0) {
      issues.push(...comparison.issues.map(issue => `${origEvent.eventId}: ${issue}`));
    }
  });
  
  return {
    success: issues.length === 0,
    issues: issues
  };
}

/**
 * Create default test events for parent-child testing
 * @returns {Array} Test events
 */
function createDefaultTestEvents() {
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
 * Create test YAML data structure
 * @returns {Array} Test YAML data
 */
function createTestYAMLData() {
  return [
    {
      id: 'yaml-test-1',
      title: 'YAML Test Event 1',
      start: '2023-03-01',
      end: '2023-03-05',
      type: 'range',
      category: 'Work',
      color: '#ff6b6b',
      isImportant: true,
      isParent: false,
      location: {
        city: 'New York',
        country: 'USA'
      },
      metadata: 'Test metadata'
    },
    {
      id: 'yaml-test-2',
      title: 'YAML Test Milestone',
      start: '2023-03-03',
      type: 'milestone',
      category: 'Personal',
      color: '#4ecdc4',
      parentId: 'yaml-test-1'
    },
    {
      id: 'yaml-test-3',
      title: 'YAML Life Event',
      start: '2023-03-10',
      type: 'life',
      color: '#45b7d1',
      isImportant: true
    }
  ];
}

/**
 * Create test CSV data structure
 * @returns {Array} Test CSV data
 */
function createTestCSVData() {
  return [
    {
      eventId: 'csv-test-1',
      title: 'CSV Test Event 1',
      start: '2023-04-01',
      end: '2023-04-05',
      type: 'range',
      category: 'Projects',
      color: '#ff9ff3',
      isImportant: 'true',
      isParent: 'false',
      city: 'San Francisco',
      country: 'USA',
      metadata: 'CSV test metadata'
    },
    {
      eventId: 'csv-test-2',
      title: 'CSV Test Milestone',
      start: '2023-04-03',
      end: '2023-04-03',
      type: 'milestone',
      category: 'Projects',
      color: '#f9ca24',
      parentId: 'csv-test-1',
      isImportant: 'false',
      isParent: 'false'
    }
  ];
}

/**
 * Initialize development test features
 * @param {Function} updateCallback - Function to call after tests complete
 */
export function initializeDevelopmentTests(updateCallback) {
  if (!isDevelopmentMode()) return;
  
  const runTestsBtn = document.getElementById('run-tests');
  if (!runTestsBtn) return;
  
  runTestsBtn.style.display = 'inline-block';
  runTestsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('🧪 Running import/export tests...');
    
    try {
      const results = await testComprehensiveImportExport();
      displayTestResults(results);
      
      if (updateCallback) {
        updateCallback();
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      displayTestError(error);
    }
  });
}

/**
 * Display test results in the UI
 * @param {Object} results - Test results
 */
function displayTestResults(results) {
  const importStatsContainer = document.getElementById('import-stats');
  if (!importStatsContainer) return;
  
  const resultsDiv = document.createElement('div');
  resultsDiv.className = 'ui message';
  
  if (results.yamlToCsv.success && results.csvToCsv.success) {
    resultsDiv.classList.add('positive');
    resultsDiv.innerHTML = `
      <div class="header">✅ All tests passed!</div>
      <p>YAML ↔ CSV and CSV ↔ CSV import/export tests completed successfully.</p>
    `;
  } else {
    resultsDiv.classList.add('negative');
    const issues = [
      ...results.yamlToCsv.issues.map(issue => `YAML ↔ CSV: ${issue}`),
      ...results.csvToCsv.issues.map(issue => `CSV ↔ CSV: ${issue}`)
    ];
    
    resultsDiv.innerHTML = `
      <div class="header">❌ Some tests failed</div>
      <p>Issues found:</p>
      <ul>
        ${issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
      <p>Check the console for details.</p>
    `;
  }
  
  importStatsContainer.innerHTML = '';
  importStatsContainer.appendChild(resultsDiv);
  importStatsContainer.style.display = 'block';
  
  // Scroll to results
  importStatsContainer.scrollIntoView({ behavior: 'smooth' });
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    importStatsContainer.style.display = 'none';
  }, 10000);
}

/**
 * Display test error in the UI
 * @param {Error} error - Error object
 */
function displayTestError(error) {
  const importStatsContainer = document.getElementById('import-stats');
  if (!importStatsContainer) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'ui negative message';
  errorDiv.innerHTML = `
    <div class="header">❌ Test execution failed</div>
    <p>Error: ${error.message}</p>
    <p>Check the console for more details.</p>
  `;
  
  importStatsContainer.innerHTML = '';
  importStatsContainer.appendChild(errorDiv);
  importStatsContainer.style.display = 'block';
  
  setTimeout(() => {
    importStatsContainer.style.display = 'none';
  }, 5000);
}

// Utility function for CSV parsing (moved from utils to avoid circular dependency)
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = splitCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        row[header] = values[index];
      }
    });
    
    data.push(row);
  }
  
  return data;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}