/**
 * Comprehensive Testing Module for Timeline Application
 * 
 * This module contains all testing-related functionality including:
 * - Import/export testing (YAML ↔ CSV, CSV ↔ CSV)
 * - Parent-child relationship testing
 * - Test data creation and validation
 * - Event comparison and validation functions
 * - Test result reporting and UI
 * - Development mode test features
 */

import { eventsToCSV } from './data-manager.js';
import { parseCSV } from './utils.js';
import { isDevelopmentMode } from './config.js';

/**
 * Polyfill for crypto.randomUUID for browsers that don't support it
 */
function ensureUUID() {
  if (!crypto.randomUUID) {
    crypto.randomUUID = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
}

/**
 * Initialize test environment and polyfills
 */
export function initializeTestEnvironment() {
  ensureUUID();
}

/**
 * Test parent-child relationship preservation during CSV export/import
 * @returns {boolean} - True if all relationships are preserved
 */
export function testParentChildPreservation() {
  console.log('Running parent-child relationship preservation test...');
  
  // Create test events with parent-child relationships
  const testEvents = [
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
    if (original.parentId) {
      if (reimported.parentId !== original.parentId) {
        console.error(`Event "${original.title}" had parentId ${original.parentId} originally, but now has ${reimported.parentId}`);
        allRelationshipsPreserved = false;
      }
    }
  });
  
  if (allRelationshipsPreserved) {
    console.log('✅ TEST PASSED: All parent-child relationships were preserved during CSV export/import');
  } else {
    console.error('❌ TEST FAILED: Some parent-child relationships were lost during CSV export/import');
  }
  
  return allRelationshipsPreserved;
}

/**
 * Deep comparison function for events with flexible type conversion
 * @param {object} original - Original event
 * @param {object} imported - Imported event
 * @param {string} context - Context of the comparison (e.g., 'yaml-to-csv')
 * @returns {array} - Array of issues found
 */
export function compareEvents(original, imported, context) {
  const issues = [];
  
  // Simple utility to add an issue
  function addIssue(field, originalValue, importedValue) {
    issues.push({
      field,
      original: originalValue,
      imported: importedValue,
      eventTitle: original.title,
      context: context
    });
  }
  
  // Helper to normalize values for comparison
  function normalizeValue(value, type) {
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
        // Convert to canonical string
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
  
  // Helper to compare two values with normalization
  function areValuesEqual(originalVal, importedVal, type) {
    const normalizedOriginal = normalizeValue(originalVal, type);
    const normalizedImported = normalizeValue(importedVal, type);
    
    // If both are null-like, consider equal
    if (normalizedOriginal === null && normalizedImported === null) {
      return true;
    }
    
    return normalizedOriginal === normalizedImported;
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
    if (
      (original[fieldName] === undefined || original[fieldName] === null || original[fieldName] === '') &&
      (imported[fieldName] === undefined || imported[fieldName] === null || imported[fieldName] === '')
    ) {
      return;
    }
    
    if (!areValuesEqual(original[fieldName], imported[fieldName], fieldType)) {
      // Special case for automatically generated fields we shouldn't care about
      if (fieldName === 'eventId' && (!original.eventId || !imported.eventId)) {
        // Skip eventId comparison if one was auto-generated
        return;
      }
      
      addIssue(fieldName, original[fieldName], imported[fieldName]);
    }
  });
  
  // Compare date fields which may have different formats
  if (!areValuesEqual(original.start, imported.start, 'date')) {
    addIssue('start', original.start, imported.start);
  }
  
  // Compare end date if present in either object
  if (original.end || imported.end) {
    if (!areValuesEqual(original.end, imported.end, 'date')) {
      addIssue('end', original.end, imported.end);
    }
  }
  
  // Handle location comparison with flexibility for different formats
  
  // Case 1: Both have location object
  if (original.location && imported.location) {
    if (!areValuesEqual(original.location.city, imported.location.city, 'string')) {
      addIssue('location.city', original.location.city, imported.location.city);
    }
    
    if (!areValuesEqual(original.location.country, imported.location.country, 'string')) {
      addIssue('location.country', original.location.country, imported.location.country);
    }
  } 
  // Case 2: Original has location object, imported has separate fields
  else if (original.location && (imported.location_city !== undefined || imported.location_country !== undefined)) {
    if (!areValuesEqual(original.location.city, imported.location_city, 'string')) {
      addIssue('location.city/location_city', original.location.city, imported.location_city);
    }
    
    if (!areValuesEqual(original.location.country, imported.location_country, 'string')) {
      addIssue('location.country/location_country', original.location.country, imported.location_country);
    }
  }
  // Case 3: Original has separate fields, imported has location object
  else if (imported.location && (original.location_city !== undefined || original.location_country !== undefined)) {
    if (!areValuesEqual(original.location_city, imported.location.city, 'string')) {
      addIssue('location_city/location.city', original.location_city, imported.location.city);
    }
    
    if (!areValuesEqual(original.location_country, imported.location.country, 'string')) {
      addIssue('location_country/location.country', original.location_country, imported.location.country);
    }
  }
  // Case 4: Both have separate fields
  else if (
    (original.location_city !== undefined || original.location_country !== undefined) &&
    (imported.location_city !== undefined || imported.location_country !== undefined)
  ) {
    if (!areValuesEqual(original.location_city, imported.location_city, 'string')) {
      addIssue('location_city', original.location_city, imported.location_city);
    }
    
    if (!areValuesEqual(original.location_country, imported.location_country, 'string')) {
      addIssue('location_country', original.location_country, imported.location_country);
    }
  }
  
  return issues;
}

/**
 * Comprehensive test function to verify that import/export preserves all fields
 * Tests both YAML→CSV and CSV→CSV flows
 * @returns {object} - Test results object with success/failure status and issues
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

/**
 * Create test data for various scenarios
 * @param {string} scenario - The test scenario ('basic', 'parent-child', 'complex')
 * @returns {array} - Array of test events
 */
export function createTestData(scenario = 'basic') {
  switch (scenario) {
    case 'parent-child':
      return [
        {
          id: 'parent-1',
          title: 'Parent Event 1',
          start: '2023-01-01',
          type: 'milestone',
          isParent: true,
          color: '#FF0000'
        },
        {
          id: 'child-1',
          title: 'Child Event 1',
          start: '2023-01-15',
          parentId: 'parent-1',
          type: 'milestone',
          color: '#00FF00'
        },
        {
          id: 'grandchild-1',
          title: 'Grandchild Event 1',
          start: '2023-01-20',
          parentId: 'child-1',
          type: 'milestone',
          color: '#0000FF'
        }
      ];
      
    case 'complex':
      return [
        {
          id: 'event-1',
          title: 'Complex Event with Location',
          start: '2023-01-01',
          end: '2023-01-03',
          type: 'range',
          location: { city: 'New York', country: 'USA' },
          metadata: 'Important business meeting',
          category: 'Work',
          isImportant: true,
          color: '#FF5733'
        },
        {
          id: 'event-2',
          title: 'Life Event',
          start: '2023-02-14',
          type: 'life',
          metadata: 'Anniversary celebration',
          category: 'Personal',
          color: '#C70039'
        }
      ];
      
    case 'basic':
    default:
      return [
        {
          id: 'basic-1',
          title: 'Basic Event 1',
          start: '2023-01-01',
          type: 'milestone',
          color: '#333333'
        },
        {
          id: 'basic-2',
          title: 'Basic Range Event',
          start: '2023-01-15',
          end: '2023-01-20',
          type: 'range',
          color: '#666666'
        }
      ];
  }
}

/**
 * Run all tests in sequence
 * @returns {object} - Comprehensive test results
 */
export async function runAllTests() {
  console.log('🧪 Running all timeline tests...');
  
  const results = {
    parentChildTest: false,
    comprehensiveTest: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Initialize test environment
    initializeTestEnvironment();
    
    // Run parent-child preservation test
    console.log('\n--- PARENT-CHILD RELATIONSHIP TEST ---');
    results.parentChildTest = testParentChildPreservation();
    
    // Run comprehensive import/export test
    console.log('\n--- COMPREHENSIVE IMPORT/EXPORT TEST ---');
    results.comprehensiveTest = await testComprehensiveImportExport();
    
    // Overall result
    const allPassed = results.parentChildTest && 
                     results.comprehensiveTest && 
                     results.comprehensiveTest.yamlToCsv.success && 
                     results.comprehensiveTest.csvToCsv.success;
    
    console.log('\n=== FINAL TEST RESULTS ===');
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Timeline data integrity is maintained.');
    } else {
      console.error('❌ SOME TESTS FAILED. Check the logs above for details.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Display test results in a user-friendly format in the UI
 * @param {object} results - Test results object
 * @param {string} containerId - ID of the container element to display results
 */
export function displayTestResults(results, containerId = 'import-stats') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with ID '${containerId}' not found`);
    return;
  }
  
  // Create results notification
  const resultsDiv = document.createElement('div');
  resultsDiv.className = 'ui message';
  
  const allPassed = results.parentChildTest && 
                   results.comprehensiveTest && 
                   results.comprehensiveTest.yamlToCsv &&
                   results.comprehensiveTest.yamlToCsv.success && 
                   results.comprehensiveTest.csvToCsv &&
                   results.comprehensiveTest.csvToCsv.success;
  
  if (allPassed) {
    resultsDiv.classList.add('positive');
    resultsDiv.innerHTML = '<div class="header">✅ All tests passed!</div>' +
                          '<p>Parent-child relationships and import/export data integrity tests completed successfully.</p>';
  } else {
    resultsDiv.classList.add('negative');
    let failureDetails = '';
    
    if (!results.parentChildTest) {
      failureDetails += '<li>Parent-child relationship preservation test failed</li>';
    }
    
    if (results.comprehensiveTest) {
      if (!results.comprehensiveTest.yamlToCsv.success) {
        failureDetails += '<li>YAML to CSV test failed</li>';
      }
      if (!results.comprehensiveTest.csvToCsv.success) {
        failureDetails += '<li>CSV to CSV test failed</li>';
      }
    }
    
    resultsDiv.innerHTML = '<div class="header">❌ Some tests failed</div>' +
                          '<p>The following tests failed:</p>' +
                          '<ul>' + failureDetails + '</ul>' +
                          '<p>Check the console for detailed error information.</p>';
  }
  
  // Clear container and add results
  container.innerHTML = '';
  container.appendChild(resultsDiv);
  container.style.display = 'block';
  
  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth' });
  
  // Automatically hide after 10 seconds
  setTimeout(() => {
    container.style.display = 'none';
  }, 10000);
}

/**
 * Initialize test button and event handlers for development mode
 */
export function initializeTestUI() {
  const runTestsBtn = document.getElementById('run-tests');
  const isDevelopment = isDevelopmentMode();
  
  if (runTestsBtn && isDevelopment) {
    runTestsBtn.style.display = 'inline-block';
    runTestsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🧪 Running import/export tests...');
      
      try {
        const results = await runAllTests();
        displayTestResults(results);
      } catch (error) {
        console.error('Test execution failed:', error);
        displayTestResults({ error: error.message });
      }
    });
  }
}

/**
 * Auto-run tests if in test environment (URL parameter)
 */
export function autoRunTestsIfRequested() {
  if (window.location.search.includes('runTests=true')) {
    setTimeout(async () => {
      console.log('Auto-running tests due to URL parameter...');
      await runAllTests();
    }, 1000);
  }
}

// Export everything for global access if needed
export default {
  initializeTestEnvironment,
  testParentChildPreservation,
  compareEvents,
  testComprehensiveImportExport,
  createTestData,
  runAllTests,
  displayTestResults,
  initializeTestUI,
  autoRunTestsIfRequested
};