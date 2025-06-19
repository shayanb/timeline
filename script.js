// Interactive Timeline Script
// Import utility functions and config
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
  randomColor, getMilestoneEmoji, normalizeCountryName, COUNTRY_NAME_MAP,
  // CSV parsing utilities
  splitCSVLine, parseCSV,
  // Animation and easing utilities
  easeOutQuint, easeInOutQuint, SmoothAnimation
} from './js/utils.js';

import {
  // Zoom and pan functionality
  initializeZoomAndPan, handleZoom, resetView,
  // Timeline element movement utilities
  moveTimelineElements, updateDateRange,
  // Timeline state management
  getTimelineState, setTimelineState,
  // Easing functions
  easeInOutCubic
} from './js/interactions.js';

import { 
  APP_VERSION, COPYRIGHT, DEFAULT_MILESTONE_EMOJI,
  updateModificationStatus, setUnsavedChanges, getUnsavedChanges,
  initializePNGExport, initializeAppMetadata, isDevelopmentMode
} from './js/config.js';

import {
  // World data loading
  initializeWorldData,
  // Main visualization functions
  renderWorldHeatmap, renderNestedPieChart, renderAllVisualizations,
  // Utility functions
  clearVisualizations, createCategoryFilter,
  // Color and data processing utilities
  processGeographicData, processNestedPieData, getCategoryColor
} from './js/visualizations.js';
document.addEventListener('DOMContentLoaded', () => {
  // Initialize app metadata (version and copyright)
  initializeAppMetadata();
  
  // Initialize PNG export functionality
  initializePNGExport();
  
  // Enable test button in development mode with query param
  const runTestsBtn = document.getElementById('run-tests');
  const isDevelopment = isDevelopmentMode();
  
  if (runTestsBtn && isDevelopment) {
    runTestsBtn.style.display = 'inline-block';
    runTestsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🧪 Running import/export tests...');
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
        importStatsContainer.innerHTML = '';
        importStatsContainer.appendChild(resultsDiv);
        importStatsContainer.style.display = 'block';
        
        // Scroll to results
        importStatsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Automatically hide after 10 seconds
        setTimeout(() => {
          importStatsContainer.style.display = 'none';
        }, 10000);
      });
    });
  }
  
  // Initialize modification status
  updateModificationStatus();
  
  // Add window resize event listener to reposition labels when window size changes
  window.addEventListener('resize', () => {
    // Only update if we have life events
    if (events.some(event => event.type === 'life')) {
      // Debounce the resize event to avoid excessive updates
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
      }
      window.resizeTimeout = setTimeout(() => {
        update();
      }, 250);
    }
  });
  
  // Function to test CSV import/export parent-child relationship preservation
  // This is for debugging and testing purposes
  window.testParentChildPreservation = function() {
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
  };
  
  // Run the test if we're in a test environment
  if (window.location.search.includes('runTests=true')) {
    setTimeout(() => {
      window.testParentChildPreservation();
      window.testComprehensiveImportExport();
    }, 1000);
  }
  
  // Comprehensive test function to verify that import/export preserves all fields
  window.testComprehensiveImportExport = async function() {
    console.log('🧪 Running comprehensive import/export tests...');
    
    // Create results object to collect test results
    const testResults = {
      yamlToCsv: { success: false, issues: [] },
      csvToCsv: { success: false, issues: [] }
    };
    
    // Utility function to compare events deeply with more flexible comparison logic
    function compareEvents(original, imported, context) {
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
  };
  
  // Function to populate category dropdown from existing categories
  function populateCategories() {
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
        if (removeParentBtn) {
          removeParentBtn.onclick = function() {
            parentInput.value = '';
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
  // Polyfill for crypto.randomUUID which might be needed by testing frameworks
  if (!crypto.randomUUID) {
    crypto.randomUUID = function() {
      // Simple implementation of UUID for browsers that don't support it
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
  
  // Initialize Semantic UI components
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
      onChange: function(value) {
        // Update row dropdown options when category changes
        if (typeInput.value === 'range') {
          populateRowDropdown(value);
          
          // Refresh the row dropdown
          $(rowInput).dropdown('refresh');
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
    
    // Populate country dropdown with common countries
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
      // Clear existing items first (except the None option)
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
      $('#country-dropdown').dropdown('refresh');
    }
  }
  
  if (window.$ && $.fn.checkbox) {
    $('.ui.checkbox').checkbox();
  }

  // DOM Elements
  const form = document.getElementById('event-form');
  const formTitle = document.getElementById('form-title');
  const titleInput = document.getElementById('title');
  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');
  const typeInput = document.getElementById('event-type');
  const colorInput = document.getElementById('color');
  const metadataInput = document.getElementById('metadata');
  const categoryInput = document.getElementById('category');
  const parentInput = document.getElementById('parent-event');
  const importantCheckbox = document.getElementById('important');
  const isParentCheckbox = document.getElementById('is-parent');
  const eventIdInput = document.getElementById('event-id');
  const cityInput = document.getElementById('city');
  const countryInput = document.getElementById('country');
  const rowInput = document.getElementById('event-row');
  const rowField = document.getElementById('row-field');
  const importFile = document.getElementById('import-file');
  const importBtn = document.getElementById('import-btn');
  
  // Function to populate the row dropdown based on the category's existing events
  function populateRowDropdown(category, currentRow = null) {
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
  const exportButton = document.getElementById('export-yaml');
  const timelineDiv = document.getElementById('timeline');
  const timelineMonths = document.getElementById('timeline-months');
  const tooltip = d3.select('#tooltip');
  const currentMonthDisplay = document.getElementById('current-month-display');

  importBtn.addEventListener('click', () => importFile.click());

  // Initialize world data for heatmap visualization
  initializeWorldData().then(() => {
    update(); // Update visualizations after world data loads
  });

  // Form container for edit/add popup with animation
  const formContainer = document.getElementById('form-container');
  function showForm() { formContainer.classList.add('open'); }
  function hideForm() { formContainer.classList.remove('open'); }
  
  // Hide form initially
  hideForm();
  
  // Add-event button
  const addEventBtn = document.getElementById('add-event-btn');
  addEventBtn.addEventListener('click', () => {
    editingId = null;
    form.reset();
    
    // Reset and populate dropdowns
    if (window.$ && $.fn.dropdown) {
      $('#category-dropdown').dropdown('clear');
      $('#country-dropdown').dropdown('clear');
    }
    
    // Populate categories from existing ones
    populateCategories();
    
    submitBtn.textContent = 'Save';
    formTitle.textContent = 'Add New Event';
    
    // Hide delete button when adding new events
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'none';
    }
    
    if (window.$ && $.fn.checkbox) {
      $('#important').checkbox('uncheck');
      $('#is-parent').checkbox('uncheck');
    } else {
      importantCheckbox.checked = false;
      isParentCheckbox.checked = false;
    }
    
    showForm();
    formContainer.scrollIntoView({ behavior: 'smooth' });
  });

  let events = [];
  let nextId = 1;
  let editingId = null;
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const removeParentBtn = document.getElementById('remove-parent-btn');
  
  // Get the close button
  const closeFormBtn = document.getElementById('close-form-btn');
  
  // Close button handler
  closeFormBtn.addEventListener('click', () => {
    hideForm();
  });
  
  // Cancel edit action
  cancelBtn.addEventListener('click', () => {
    editingId = null;
    form.reset();
    submitBtn.textContent = 'Add';
    typeInput.dispatchEvent(new Event('change'));
    
    // Hide the remove parent button when canceling
    if (removeParentBtn) {
      removeParentBtn.style.display = 'none';
    }
    
    hideForm();
  });

  // Generate a random hex color for new entries

  // Emoji field removed
  
  // Toggle end-date field and row field based on event type
  // Add change event listener for parent dropdown
  // Initialize Semantic UI dropdown for parent field
  if (window.$ && $.fn.dropdown) {
    try {
      $('#parent-event').dropdown({
        onChange: function(value) {
          // Handle parent selection change
          const selectedParent = value;
          
          // Show/hide remove parent button based on selection
          if (selectedParent) {
            removeParentBtn.style.display = 'block';
          } else {
            removeParentBtn.style.display = 'none';
          }
          
          // Only enable important checkbox if no parent is selected
          if (importantCheckbox) {
            importantCheckbox.disabled = !!selectedParent;
            if (selectedParent) {
              importantCheckbox.checked = false;
              
              // Update Semantic UI checkbox if available
              if (window.$ && $.fn.checkbox) {
                try {
                  $('#important').checkbox('uncheck');
                } catch (e) {
                  console.error('Error updating important checkbox:', e);
                }
              }
            }
          }
          
          // Update modification status
          setUnsavedChanges(true);
          updateModificationStatus();
        }
      });
    } catch (e) {
      console.error('Error initializing parent dropdown:', e);
    }
  }
  
  // Fallback for non-Semantic UI environments
  parentInput.addEventListener('change', () => {
    const selectedParent = parentInput.value;
    
    // Show/hide remove parent button based on selection
    if (selectedParent) {
      removeParentBtn.style.display = 'block';
    } else {
      removeParentBtn.style.display = 'none';
    }
    
    // Only enable important checkbox if no parent is selected
    if (importantCheckbox) {
      importantCheckbox.disabled = !!selectedParent;
      if (selectedParent) {
        importantCheckbox.checked = false;
      }
    }
    
    // Update modification status
    setUnsavedChanges(true);
    updateModificationStatus();
  });
  
  typeInput.addEventListener('change', () => {
    // Show/hide end date field
    if (typeInput.value === 'range') {
      endInput.disabled = false;
      endInput.setAttribute('required', '');
      
      // Show row field for range events
      rowField.style.display = 'block';
      
      // Populate row dropdown options (current category from dropdown)
      const currentCategory = categoryInput.value;
      populateRowDropdown(currentCategory);
      
      // Initialize dropdown
      if (window.$ && $.fn.dropdown) {
        try {
          $(rowInput).dropdown('refresh');
        } catch (e) {
          console.error('Error refreshing row dropdown:', e);
        }
      }
    } else if (typeInput.value === 'milestone') {
      endInput.disabled = true;
      endInput.removeAttribute('required');
      
      // Show row field for milestone events too (new feature)
      rowField.style.display = 'block';
      
      // Populate row dropdown options (current category from dropdown)
      const currentCategory = categoryInput.value;
      populateRowDropdown(currentCategory);
      
      // Initialize dropdown
      if (window.$ && $.fn.dropdown) {
        try {
          $(rowInput).dropdown('refresh');
        } catch (e) {
          console.error('Error refreshing row dropdown:', e);
        }
      }
    } else {
      endInput.disabled = true;
      endInput.removeAttribute('required');
      
      // Hide row field for other event types
      rowField.style.display = 'none';
      
      // Hide emoji field for other event types
      emojiField.style.display = 'none';
    }
  });

  // Function to split a CSV line into fields, respecting quoted commas
  
  // Function to display import stats
  function showImportStats(data, fileType) {
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

  // Import events via YAML or CSV file input
  importFile.addEventListener('change', e => {
    const file = importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let data = [];
        const fileContent = reader.result;
        const fileType = file.name.split('.').pop().toLowerCase();
        
        // Parse based on file type
        if (fileType === 'csv') {
          data = parseCSV(fileContent);
        } else {
          // YAML or YML
          data = jsyaml.load(fileContent);
        }
        
        if (!Array.isArray(data)) {
          throw new Error('Imported data must be an array of events');
        }
        
        // Reset the parent removal button to ensure proper state
        if (removeParentBtn) {
          removeParentBtn.style.display = 'none';
        }
        
        // Reset the modified flag for new imports
        setUnsavedChanges(false);
        updateModificationStatus();
        
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
        
        // Second pass: Normalize row values within each category to avoid excessively tall timeline
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
        
        // For each category, normalize row values
        console.log("Normalizing rows by category to avoid tall timeline");
        Object.keys(eventsByCategory).forEach(category => {
          const categoryEvents = eventsByCategory[category];
          console.log(`Category: ${category} has ${categoryEvents.length} range events`);
          
          // Sort events by start date
          categoryEvents.sort((a, b) => a.start - b.start);
          
          // Calculate overlaps and assign efficient row values
          const rows = [];
          let maxRowAssigned = 0;
          
          categoryEvents.forEach(event => {
            // Skip events with explicitly defined row values
            if (event.row !== null && event.row !== undefined) {
              console.log(`Event "${event.title}" has predefined row ${event.row}`);
              // Track max row value to ensure we start from a higher value for auto-assignment
              maxRowAssigned = Math.max(maxRowAssigned, event.row);
              
              // Make sure this event is tracked in our row assignment structure
              const rowNum = Number(event.row);
              if (!rows[rowNum]) {
                rows[rowNum] = [];
              }
              rows[rowNum].push(event);
              return;
            }
            
            // Find the first row where this event doesn't overlap with any existing event
            let rowIndex = 0;
            let foundRow = false;
            
            while (!foundRow) {
              foundRow = true;
              
              // Check if this event would overlap with any event already in this row
              if (rows[rowIndex]) {
                for (const existingEvent of rows[rowIndex]) {
                  if (eventsOverlap(event, existingEvent)) {
                    foundRow = false;
                    break;
                  }
                }
              } else {
                // Create a new row if needed
                rows[rowIndex] = [];
              }
              
              if (foundRow) {
                // Assign this row to the event
                event.row = rowIndex;
                rows[rowIndex].push(event);
                console.log(`Assigned row ${rowIndex} to event "${event.title}"`);
                maxRowAssigned = Math.max(maxRowAssigned, rowIndex);
              } else {
                // Try the next row
                rowIndex++;
              }
            }
          });
          
          console.log(`Category ${category} has events in ${rows.length} rows, max row is ${maxRowAssigned}`);
          
          // Log row distribution
          rows.forEach((rowEvents, rowIndex) => {
            if (rowEvents && rowEvents.length > 0) {
              console.log(`Row ${rowIndex}: ${rowEvents.length} events - ${rowEvents.map(e => e.title).join(', ')}`);
            }
          });
        });
        
        // Use the normalized events
        events = mappedEvents;
        
        // Show import stats
        showImportStats(events, fileType);
        
        // Force reload the world map data to ensure heatmap shows imported locations
        if (worldGeoJson) {
          // Explicitly render the world heatmap and nested pie chart with current date range
          const minTime = d3.min(events, d => d.start);
          const maxTime = d3.max(events, d => d.end);
          const startDate = new Date(minTime);
          startDate.setMonth(startDate.getMonth() - 1);
          const endDate = new Date(maxTime);
          endDate.setMonth(endDate.getMonth() + 1);
          
          // Reset the timeline state to show the full range of events
          if (window.timelineState) {
            window.timelineState.currentStartDate = new Date(startDate);
            window.timelineState.currentEndDate = new Date(endDate);
            window.timelineState.originalStartDate = new Date(startDate);
            window.timelineState.originalEndDate = new Date(endDate);
            window.timelineState.isZoomed = false;
          }
          
          // First do a general update
          update();
          
          // Then explicitly render the charts again to ensure they display properly
          setTimeout(() => {
            // Clear and re-render visualizations with the new data
            renderAllVisualizations(events, [startDate, endDate], renderTimeline);
          }, 100);
        } else {
          update();
        }
        
        colorInput.value = randomColor();
      } catch (err) {
        // More descriptive error message that indicates file type
        const fileType = file.name.split('.').pop().toLowerCase();
        alert(`Error parsing ${fileType.toUpperCase()}: ${err}`);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // Function to convert event data to CSV format
  function eventsToCSV(events) {
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
  
  // Function to capture a PNG screenshot of the timeline
  function captureScreenshot() {
    // Show a loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'ui toast';
    loadingToast.innerHTML = `<div class="content"><div class="ui active tiny inline loader"></div> Generating PNG...</div>`;
    loadingToast.style.position = 'fixed';
    loadingToast.style.top = '1rem';
    loadingToast.style.right = '1rem';
    loadingToast.style.zIndex = '9999';
    loadingToast.style.padding = '0.75rem 1rem';
    loadingToast.style.backgroundColor = 'white';
    loadingToast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    loadingToast.style.borderRadius = '4px';
    document.body.appendChild(loadingToast);
    
    // Get title for filename
    const title = document.querySelector('header h1')?.textContent?.trim() || 'Interactive Timeline';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Store original state of elements we'll temporarily modify
    const controlsContainer = document.querySelector('.controls-container');
    const controlsDisplay = controlsContainer ? controlsContainer.style.display : 'flex';
    const modStatus = document.getElementById('modification-status');
    const modStatusDisplay = modStatus ? modStatus.style.display : 'none';
    
    // Temporarily hide controls and modification status
    if (controlsContainer) controlsContainer.style.display = 'none';
    if (modStatus) modStatus.style.display = 'none';
    
    // Add temporary version info to the header
    const header = document.querySelector('header');
    const versionInfo = document.createElement('div');
    versionInfo.id = 'temp-version-info';
    versionInfo.style.textAlign = 'center';
    versionInfo.style.fontSize = '12px';
    versionInfo.style.color = '#666';
    versionInfo.style.marginTop = '5px';
    versionInfo.textContent = `Version ${APP_VERSION} - ${COPYRIGHT}`;
    header.appendChild(versionInfo);
    
    // Fix any SVG visibility issues before screenshot
    const svgElements = document.querySelectorAll('svg');
    svgElements.forEach(svg => {
      svg.style.visibility = 'visible';
      svg.style.opacity = '1';
    });
    
    // Ensure life event labels are correctly positioned
    const lifeLabels = document.querySelectorAll('.life-label.below-chart');
    lifeLabels.forEach(label => {
      if (label.style.transform) {
      }
    });
    
    // Take screenshot of the entire app container
    const appContainer = document.getElementById('app');
    
    // Options for html2canvas
    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      onclone: function(clonedDoc) {
        // Additional fixes for the cloned document before screenshot
        
        // Make sure all SVGs are visible in the cloned document
        const clonedSvgs = clonedDoc.querySelectorAll('svg');
        clonedSvgs.forEach(svg => {
          svg.style.visibility = 'visible';
          svg.style.opacity = '1';
          svg.setAttribute('width', svg.getAttribute('width') || '100%');
          svg.setAttribute('height', svg.getAttribute('height') || 'auto');
        });
        
        // Fix for life event labels in the cloned document
        const clonedLifeLabels = clonedDoc.querySelectorAll('.life-label');
        clonedLifeLabels.forEach(label => {
          // Ensure the label is visible
          label.style.visibility = 'visible';
          label.style.opacity = '1';
        });
      }
    };
    
    // Take the screenshot
    html2canvas(appContainer, options)
      .then(canvas => {
        // Create download link
        const imgData = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${safeTitle}_export.png`;
        a.click();
        
        // Restore original state
        if (controlsContainer) controlsContainer.style.display = controlsDisplay;
        if (modStatus) modStatus.style.display = modStatusDisplay;
        if (document.getElementById('temp-version-info')) {
          document.getElementById('temp-version-info').remove();
        }
        document.body.removeChild(loadingToast);
      })
      .catch(error => {
        console.error('Error capturing screenshot:', error);
        
        // Restore original state
        if (controlsContainer) controlsContainer.style.display = controlsDisplay;
        if (modStatus) modStatus.style.display = modStatusDisplay;
        if (document.getElementById('temp-version-info')) {
          document.getElementById('temp-version-info').remove();
        }
        document.body.removeChild(loadingToast);
        
        alert('Failed to generate PNG. Please try again.');
      });
  }
  
  // Initialize export dropdown with fixed text option
  if (window.$ && $.fn.dropdown) {
    $('#export-dropdown').dropdown({
      action: 'hide',           // Just hide the menu but don't change the text
      selectOnKeydown: false,   // Disable automatic selection
      onChange: function() {
        // Force text to always be "Export"
        setTimeout(() => {
          $('.ui.dropdown .text').text('Export');
        }, 10);
      }
    });
  }
  
  // Setup export buttons
  const exportYamlBtn = document.getElementById('export-yaml');
  const exportCsvBtn = document.getElementById('export-csv');
  const exportPngBtn = document.getElementById('export-png');
  
  // Export YAML
  exportYamlBtn.addEventListener('click', () => {
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
    
    const yamlStr = jsyaml.dump(exportData);
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_export.yaml';
    a.click();
    
    // Reset unsaved changes flag after export
    setUnsavedChanges(false);
    updateModificationStatus();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  
  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    // Prepare data the same way as YAML export
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
    
    // Convert to CSV format
    const csv = eventsToCSV(normalizedEvents);
    
    // Download the CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_export.csv';
    a.click();
    
    // Reset unsaved changes flag after export
    setUnsavedChanges(false);
    updateModificationStatus();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  
  // Handle PNG export
  exportPngBtn.addEventListener('click', () => {
    captureScreenshot();
  });
  
  // PDF export removed
  
  // Backward compatibility for the old export button
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      // Just trigger the YAML export for compatibility
      exportYamlBtn.click();
    });
  }

  // Load predefined events from data/events.yaml
  fetch('data/events.yaml')
    .then(res => res.text())
    .then(text => {
      const data = jsyaml.load(text);
      const idMap = {}; // Map to store id-to-numeric id relationships
      
      // First pass: Load all events and keep track of their IDs
      data.forEach(ev => {
        // For "First Office" and similar entries without a type, explicitly check for both start and end dates
        // to determine if it should be a range event
        let type;
        if (ev.type) {
          type = ev.type;
        } else if (ev.life_event) {
          type = 'life';
        } else if (ev.end && ev.start) {
          // If both start and end dates are specified, it's a range event
          type = 'range';
        } else {
          type = 'milestone'; // Default for single-date events
        }
        
        // Ensure start date is valid
        const start = new Date(ev.start);
        if (isNaN(start.getTime())) {
          console.error("Invalid start date for event:", ev.title, ev.start);
          return; // Skip this event
        }
        
        // For range events, ensure end date is valid or default to start date
        let end;
        if (type === 'range') {
          if (ev.end) {
            end = new Date(ev.end);
            if (isNaN(end.getTime())) {
              console.error("Invalid end date for event:", ev.title, ev.end);
              end = new Date(start); // Fallback to start date
            }
          } else {
            end = new Date(start); // Default to start date if not specified
          }
        } else {
          end = new Date(start); // For non-range events, end equals start
        }
        
        const color = ev.color || randomColor();
        const metadata = ev.metadata || '';
        const category = ev.category || ev.parent || null;
        const isImportant = !!ev.isImportant;
        const isParent = !!ev.isParent;
        const row = ev.row !== undefined ? ev.row : null;
        const categoryBgColor = ev.categoryBgColor || null;
        
        // Handle new location structure
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
        } else if (ev.place) {
          // Backward compatibility for older format
          location = {
            city: '',
            country: ev.place
          };
        }
        
        // Use provided ID or generate a new one
        const numericId = nextId++;
        const eventId = ev.id || `auto-${numericId}`;
        
        // Store the mapping between string ID and numeric ID
        idMap[eventId] = numericId;
        
        // Log for debugging
        console.log(`Loading event: "${ev.title}" (${type}), Start: ${start.toISOString()}, End: ${end.toISOString()}`);
        
        // Add the event with both string and numeric IDs
        events.push({ 
          id: numericId,
          eventId: eventId,
          title: ev.title, 
          start, 
          end, 
          type, 
          color, 
          metadata, 
          category,
          location,
          isImportant,
          isParent,
          row,
          categoryBgColor,
          parentId: ev.parentId || null // Store the parent ID string for now
        });
      });
      
      // Second pass: Resolve parent IDs to numeric IDs
      events.forEach(event => {
        if (event.parentId) {
          const parentNumericId = idMap[event.parentId];
          if (parentNumericId !== undefined) {
            event.parent = parentNumericId;
          }
          // Keep parentId for export
        }
      });
      
      update();
      colorInput.value = randomColor();
      
      // Populate category dropdown after loading events
      populateCategories();
    })
    .catch(err => console.error('Error loading events.yaml:', err));

  // Handle event form submissions
  form.addEventListener('submit', e => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const start = new Date(startInput.value);
    const type = typeInput.value;
    const end = (type === 'range') ? new Date(endInput.value) : new Date(startInput.value);
    const color = colorInput.value;
    
    // No longer using custom emoji
    
    const metadata = metadataInput.value.trim();
    
    // Get category from dropdown or hidden input
    let category = null;
    if (window.$ && $.fn.dropdown) {
      category = $('#category-dropdown').dropdown('get value') || null;
    } else {
      category = categoryInput.value ? categoryInput.value : null;
    }
    
    const isImportant = importantCheckbox.checked;
    const isParent = isParentCheckbox.checked;
    const customEventId = eventIdInput.value.trim();
    
    // Get custom row number if provided (for range and milestone events)
    let customRow = null;
    if ((type === 'range' || type === 'milestone') && rowInput.value !== '') {
      customRow = parseInt(rowInput.value);
      // Make sure it's a valid number
      if (isNaN(customRow) || customRow < 0) {
        customRow = null;
      }
    }
    
    // Capture the original event (if editing) to check for category changes
    const originalEvent = editingId ? events.find(ev => ev.id === editingId) : null;
    
    // Get parent relationship
    const parentId = parentInput.value ? parseInt(parentInput.value) : null;
    
    // Get parent string ID if the parent exists
    let parentEventId = null;
    if (parentId) {
      const parentEvent = events.find(ev => ev.id === parentId);
      if (parentEvent && parentEvent.eventId) {
        parentEventId = parentEvent.eventId;
      }
    }
    
    // Get location data
    const city = cityInput.value.trim();
    let country = '';
    
    // Get country from dropdown or hidden input
    if (window.$ && $.fn.dropdown) {
      country = $('#country-dropdown').dropdown('get value') || '';
    } else {
      country = countryInput.value.trim();
    }
    
    const location = (city || country) ? { city, country } : null;
    
    if (type === 'range' && end < start) {
      alert('End date must be on or after start date');
      return;
    }
    
    if (editingId) {
      // Update existing event
      const ev = events.find(ev => ev.id === editingId);
      if (ev) {
        // Check if this is changing from regular event to parent event
        const changingToParent = !ev.isParent && isParent;
        
        // Store original category for use in child preservation logic
        const originalCategory = ev.category;
        
        // Update event properties
        ev.title = title;
        ev.start = start;
        ev.end = end;
        ev.type = type;
        ev.color = color;
        ev.metadata = metadata;
        ev.category = category;
        ev.parent = parentId;
        ev.parentId = parentEventId;
        ev.isImportant = isImportant;
        ev.isParent = isParent;
        ev.location = location;
        
        // Set custom row if provided (for range events only) and track custom flag
        if (type === 'range') {
          if (customRow !== null) {
            ev.row = customRow;
            ev._customRow = true;
          } else {
            // Clear custom row flag to allow auto-calculation if none provided
            ev._customRow = false;
          }
        }
        
        // Update eventId if provided
        if (customEventId && customEventId !== ev.eventId) {
          ev.eventId = customEventId;
        }
        
        // Fix for milestone category bug: 
        // If an event is being changed to a parent, preserve the category of
        // any milestone events in the same category rather than allowing them
        // to be implicitly tied to the parent
        if (changingToParent && originalCategory) {
          // Find all milestone events in the same category
          const milestonesInCategory = events.filter(event => 
            event.type === 'milestone' && 
            event.category === originalCategory &&
            event.id !== editingId
          );
          
          // Make sure they keep their original category and don't get linked to this parent
          milestonesInCategory.forEach(milestone => {
            // Ensure the milestone stays in its original category
            milestone.category = originalCategory;
            
            // If the milestone was parented to this event, remove the link
            if (milestone.parent === editingId) {
              milestone.parent = null;
              milestone.parentId = null;
            }
          });
        }
      }
    } else {
      // Generate or use provided event ID
      const eventId = customEventId || `auto-${nextId}`;
      const numericId = nextId++;
      
      // Add new event
      // Add row number if specified and valid for range events
      // Determine row value and track if custom
      const rowValue = type === 'range' && customRow !== null ? customRow : null;
      const _customRow = type === 'range' && customRow !== null;
      
      events.push({ 
        id: numericId,
        eventId: eventId,
        title, 
        start, 
        end, 
        type, 
        color, 
        metadata, 
        category,
        parent: parentId,
        parentId: parentEventId,
        isImportant,
        isParent,
        location,
        emoji, // Add custom emoji if specified
        row: rowValue, // Add the row number if provided (will be calculated during rendering if null)
        _customRow
      });
    }
    
    // Mark as having unsaved changes after adding/editing an event
    setUnsavedChanges(true);
    updateModificationStatus();
    
    form.reset();
    colorInput.value = randomColor();
    submitBtn.textContent = 'Add';
    cancelBtn.style.display = '';
    update();
    populateCategories(); // Update category dropdown after adding/editing
    hideForm();
  });

  // Edit an event
  function editEvent(d) {
    // Log the event object to debug values
    console.log("Editing event:", JSON.stringify(d, null, 2));
    console.log("isImportant:", d.isImportant, "isParent:", d.isParent);
    
    editingId = d.id;
    formTitle.textContent = 'Edit Event';
    
    // Show form immediately
    showForm();
    
    titleInput.value = d.title;
    startInput.value = d.start.toISOString().slice(0,10);
    
    // Set event type dropdown
    if (window.$ && $.fn.dropdown) {
      $('#event-type').dropdown('set selected', d.type);
    } else {
      typeInput.value = d.type;
    }
    
    // Trigger change to toggle end-date field
    typeInput.dispatchEvent(new Event('change'));
    
    if (d.type === 'range') {
      endInput.value = d.end.toISOString().slice(0,10);
    }
    
    colorInput.value = d.color;
    metadataInput.value = d.metadata || '';
    
    // No emoji field needed anymore (removed)
    
    // Update parent input and event ID input
    eventIdInput.value = d.eventId || '';
    
    // Update parent event dropdown
    if (window.$ && $.fn.dropdown) {
      try {
        // First refresh the parent dropdown to ensure it's initialized
        $('#parent-event').dropdown('refresh');
        
        // Now set the selected value if we have a parent
        if (d.parent) {
          $('#parent-event').dropdown('set selected', d.parent);
          removeParentBtn.style.display = 'block';
        } else {
          $('#parent-event').dropdown('clear');
          removeParentBtn.style.display = 'none';
        }
      } catch (e) {
        console.error('Error updating parent dropdown:', e);
        // Fallback to direct value setting
        parentInput.value = d.parent || '';
        
        // Show/hide remove parent button based on whether a parent is selected
        if (d.parent) {
          removeParentBtn.style.display = 'block';
        } else {
          removeParentBtn.style.display = 'none';
        }
      }
    } else {
      // Fallback for when jQuery is not available
      parentInput.value = d.parent || '';
      
      // Show/hide remove parent button based on whether a parent is selected
      if (d.parent) {
        removeParentBtn.style.display = 'block';
      } else {
        removeParentBtn.style.display = 'none';
      }
    }
    
    // Populate categories from existing ones
    populateCategories();
    
    // Set category using Semantic UI dropdown
    if (window.$ && $.fn.dropdown) {
      try {
        if (d.category) {
          $('#category-dropdown').dropdown('set selected', d.category);
        } else {
          $('#category-dropdown').dropdown('clear');
        }
        
        // Set location data using Semantic UI dropdown for country
        if (d.location) {
          cityInput.value = d.location.city || '';
          
          if (d.location.country) {
            $('#country-dropdown').dropdown('set selected', d.location.country);
          } else {
            $('#country-dropdown').dropdown('clear');
          }
        } else {
          cityInput.value = '';
          $('#country-dropdown').dropdown('clear');
        }
      } catch (e) {
        console.error('Error setting dropdown values:', e);
        // Fallback if dropdown function fails
        categoryInput.value = d.category || '';
        
        if (d.location) {
          cityInput.value = d.location.city || '';
          countryInput.value = d.location.country || '';
        } else {
          cityInput.value = '';
          countryInput.value = '';
        }
      }
    } else {
      // Fallback if jQuery is not available
      categoryInput.value = d.category || '';
      
      if (d.location) {
        cityInput.value = d.location.city || '';
        countryInput.value = d.location.country || '';
      } else {
        cityInput.value = '';
        countryInput.value = '';
      }
    }
    
    // Set row number if available
    if (d.type === 'range' || d.type === 'milestone') {
      rowField.style.display = 'block'; // Show row field for range and milestone events
      
      // Populate the row dropdown with options
      populateRowDropdown(d.category, d.row);
      
      // Set selected value
      if (d.row !== undefined && d.row !== null) {
        rowInput.value = d.row;
      } else {
        rowInput.selectedIndex = 0; // Default to first option
      }
      
      // Initialize Semantic UI dropdown
      if (window.$ && $.fn.dropdown) {
        $(rowInput).dropdown('refresh');
      }
    } else {
      rowField.style.display = 'none'; // Hide row field for other event types
    }
    
    // IMPORTANT: Always directly set the checkbox values before using Semantic UI
    // This ensures the value is set even if Semantic UI fails
    importantCheckbox.checked = !!d.isImportant;
    isParentCheckbox.checked = !!d.isParent;
    
    // Now also set them with Semantic UI if available
    if (window.$ && $.fn.checkbox) {
      try {
        // Force a refresh of the checkbox components
        $('.ui.checkbox').checkbox('refresh');
        
        // Important checkbox
        if (d.isImportant) {
          $('#important').checkbox('check');
        } else {
          $('#important').checkbox('uncheck');
        }
        
        // Parent event checkbox
        if (d.isParent) {
          $('#is-parent').checkbox('check');
        } else {
          $('#is-parent').checkbox('uncheck');
        }
        
        // Force a refresh again after setting values
        setTimeout(function() {
          try {
            $('.ui.checkbox').checkbox('refresh');
          } catch (e) {
            console.error('Error refreshing checkboxes:', e);
          }
        }, 50);
      } catch (e) {
        console.error('Error setting checkbox values:', e);
        // Fallback is already handled with direct checkbox setting above
      }
    }
    
    // Show and configure delete button for editing
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
      // Show the delete button
      deleteBtn.style.display = 'block';
      
      // Remove any existing event listeners to prevent duplicates
      const newDeleteBtn = deleteBtn.cloneNode(true);
      deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
      
      // Add click event handler
      newDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Ask for confirmation before deleting
        if (confirm('Are you sure you want to delete this event?')) {
          deleteEvent(editingId);
          hideForm();
        }
      });
    }
    
    submitBtn.textContent = 'Save';
    
    // Form is already shown at the beginning of the function
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // Delete an event
  function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
      events = events.filter(ev => ev.id !== id);
      
      // Mark as having unsaved changes
      setUnsavedChanges(true);
      updateModificationStatus();
      
      update();
    }
  }

  // Format date for display


  // Visualization functions have been moved to js/visualizations.js module

  // Main rendering function
  // Function to update parent dropdown with available parent events
  function updateParentDropdown() {
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

  function update() {
    if (!events.length) return;
    
    // Update parent dropdown when updating the timeline
    updateParentDropdown();
    
    // Clear timeline and remove any existing life label containers
    d3.select(timelineDiv).selectAll('*').remove();
    d3.select(timelineMonths).selectAll('*').remove();
    
    // Clear any existing life labels container
    const existingLabelsContainer = document.querySelector('.life-labels-container');
    if (existingLabelsContainer) {
      existingLabelsContainer.remove();
    }
    
    // Create a map of parent range events to their milestone children
    const parentToMilestones = {};
    
    // Debug milestone data
    console.log("All events before processing:", events.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type,
      parent: e.parent,
      emoji: e.emoji
    })));
    
    // Identify milestones with range parents
    events.forEach(event => {
      if (event.type === 'milestone' && event.parent) {
        // Find the parent event
        const parentEvent = events.find(e => e.id === event.parent);
        if (parentEvent && parentEvent.type === 'range') {
          if (!parentToMilestones[parentEvent.id]) {
            parentToMilestones[parentEvent.id] = [];
          }
          parentToMilestones[parentEvent.id].push(event);
          console.log(`Added milestone '${event.title}' to parent '${parentEvent.title}'`);
          console.log(`Milestone emoji value: ${event.emoji}`);
        } else {
          console.log(`Warning: Milestone '${event.title}' has parent ID ${event.parent} but parent not found or not a range event`);
        }
      }
    });
    
    // Debug parent-to-milestone mapping after processing
    console.log("Parent-to-milestone mapping:", Object.keys(parentToMilestones).map(parentId => {
      const parent = events.find(e => e.id === parseInt(parentId));
      return {
        parentId,
        parentTitle: parent ? parent.title : 'Unknown Parent',
        milestones: parentToMilestones[parentId].map(m => m.title)
      };
    }));
    
    // Debug milestone placement in same row as parents
    console.log("Milestones using parent rows:", events
      .filter(e => e.type === 'milestone' && e.parent)
      .map(m => {
        const parent = events.find(e => e.id === m.parent);
        return {
          id: m.id,
          title: m.title,
          parentId: m.parent,
          parentTitle: parent ? parent.title : 'Unknown',
          parentType: parent ? parent.type : 'Unknown'
        };
      }));
    
    // Find timeline date range
    const minTime = d3.min(events, d => d.start);
    const maxTime = d3.max(events, d => d.end);
    
    // Get date range - either from zoom state or calculate new one
    let startDate, endDate;
    
    // Initialize timeline state if it doesn't exist
    if (!window.timelineState) {
      // Ensure reasonable padding for initial view
      startDate = new Date(minTime);
      startDate.setMonth(startDate.getMonth() - 1);
      
      endDate = new Date(maxTime);
      endDate.setMonth(endDate.getMonth() + 1);
      
      window.timelineState = {
        originalStartDate: new Date(startDate),
        originalEndDate: new Date(endDate),
        currentStartDate: new Date(startDate),
        currentEndDate: new Date(endDate),
        isZooming: false,
        isDragging: false,
        zoomControlsAdded: false,
        isZoomed: false
      };
    } else if (window.timelineState.isZoomed) {
      // Use the stored zoom state if available and it's marked as zoomed
      startDate = new Date(window.timelineState.currentStartDate);
      endDate = new Date(window.timelineState.currentEndDate);
    } else {
      // Not zoomed, so calculate a fresh view with padding
      startDate = new Date(minTime);
      startDate.setMonth(startDate.getMonth() - 1);
      
      endDate = new Date(maxTime);
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Update the timeline state
      window.timelineState.originalStartDate = new Date(startDate);
      window.timelineState.originalEndDate = new Date(endDate);
      window.timelineState.currentStartDate = new Date(startDate);
      window.timelineState.currentEndDate = new Date(endDate);
    }
    
    // Update category dropdown
    categoryInput.innerHTML = '<option value="">None</option>';
    const categories = new Set();
    events.forEach(ev => {
      if (ev.category) {
        categories.add(ev.category);
      }
    });
    
    Array.from(categories).sort().forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      categoryInput.appendChild(opt);
    });
    
    // Update parent event dropdown using the dedicated function
    updateParentDropdown();
    
    // Group events by category
    const eventsByCategory = groupByCategory(events);
    
    // Calculate row positions for range events in each category
    Object.keys(eventsByCategory).forEach(category => {
      const categoryEvents = eventsByCategory[category].filter(e => e.type === 'range' || e.type === 'milestone');
      const sortedEvents = sortByDate(categoryEvents);
      
      sortedEvents.forEach(event => {
        // Only auto-calculate rows for events without a custom row
        if (!event._customRow) {
          event.row = calculateEventRow(event, categoryEvents);
        }
      });
    });
    
    // Get all months between start and end date
    const months = getMonthsBetween(startDate, endDate);
    
    // Display current month range
    currentMonthDisplay.textContent = `${formatMonth(startDate)} - ${formatMonth(endDate)}`;
    
    // Render month headers with year coloring
    let currentYear = null;
    let yearColors = ['#f0f9ff', '#e0f2fe']; // Light blue alternating shades
    let currentColorIndex = 0;
    
    // Create month headers
    months.forEach((month, index) => {
      const monthPosition = calculatePosition(month, startDate, endDate);
      const year = month.getFullYear();
      
      // Check if we're entering a new year
      if (currentYear !== year) {
        currentYear = year;
        currentColorIndex = 1 - currentColorIndex; // Toggle between 0 and 1
      }
      
      const monthDiv = document.createElement('div');
      monthDiv.className = 'flex-1 relative month-column';
      monthDiv.style.backgroundColor = yearColors[currentColorIndex];
      
      // Add year label at the beginning of each year
      if (month.getMonth() === 0 || index === 0) {
        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-label';
        yearLabel.textContent = year;
        monthDiv.appendChild(yearLabel);
      }
      
      // Add month label (only for the first month of each quarter)
      if (month.getMonth() % 3 === 0 || index === 0 || index === months.length - 1) {
        const label = document.createElement('div');
        label.className = 'month-label';
        label.textContent = month.toLocaleDateString('en-US', { month: 'short' });
        monthDiv.appendChild(label);
      }
      
      timelineMonths.appendChild(monthDiv);
    });
    
    // Collect category background colors from events
    const categoryColors = {};
    events.forEach(event => {
      if (event.category && event.categoryBgColor && !categoryColors[event.category]) {
        categoryColors[event.category] = event.categoryBgColor;
      }
    });
    
    // Create category rows (sorted alphabetically for consistency)
    const sortedCategories = Object.keys(eventsByCategory).sort();
    sortedCategories.forEach((category, categoryIndex) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'category-row';
      timelineDiv.appendChild(rowDiv);
      
      // Category label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'category-label';
      labelDiv.textContent = category;
      rowDiv.appendChild(labelDiv);
      
      // Timeline content area
      const timelineArea = document.createElement('div');
      timelineArea.className = 'category-timeline';
      
      // Add background color if defined in the events
      if (categoryColors[category]) {
        timelineArea.style.backgroundColor = categoryColors[category];
      } else {
        // Apply a subtle alternating background for categories without defined colors
        timelineArea.style.backgroundColor = categoryIndex % 2 === 0 ? 
          'rgba(249, 250, 251, 0.5)' : 'rgba(243, 244, 246, 0.5)';
      }
      
      rowDiv.appendChild(timelineArea);
      
      // Render month separators
      months.forEach((month, index) => {
        if (index > 0) {
          const monthPosition = calculatePosition(month, startDate, endDate);
          
          const separator = document.createElement('div');
          separator.className = 'month-marker';
          separator.style.left = `${monthPosition}%`;
          timelineArea.appendChild(separator);
        }
      });
      
      // Today marker with green color and label
      const today = new Date();
      if (today >= startDate && today <= endDate) {
        const todayPosition = calculatePosition(today, startDate, endDate);
        
        // Create the Today marker
        const todayMarker = document.createElement('div');
        todayMarker.className = 'today-marker';
        todayMarker.style.left = `${todayPosition}%`;
        todayMarker.style.backgroundColor = '#22c55e'; // Green color
        timelineArea.appendChild(todayMarker);
        
        // Today label is now created and added to the labels container later in the code
      }
      
      // Render events in this category
      const categoryEvents = eventsByCategory[category];
      
      categoryEvents.forEach(event => {
        // Don't calculate base position here for range events, we'll do it with validated dates later
        let leftPosition;
        
        if (event.type === 'range') {
          try {
            // Ensure we have valid Date objects
            if (!(event.start instanceof Date) || !(event.end instanceof Date)) {
              console.error("Invalid date object type:", event.title, event.start, event.end);
              return; // Skip rendering this event
            }
            
            // Check for NaN dates
            if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
              console.error("Invalid date (NaN) for event:", event.title, event.start, event.end);
              return; // Skip rendering this event
            }
            
            // Create a valid time range (ensuring start < end)
            const validStart = new Date(Math.min(event.start.getTime(), event.end.getTime()));
            const validEnd = new Date(Math.max(event.start.getTime(), event.end.getTime()));
            
            // Ensure dates are actually Date objects by creating new instances
            const safeStartDate = new Date(validStart.getTime());
            const safeEndDate = new Date(validEnd.getTime());
            const safeTimelineStart = new Date(startDate.getTime());
            const safeTimelineEnd = new Date(endDate.getTime());
            
            // Calculate position directly using the enhanced functions with the safe date objects
            // These functions handle clamping internally
            leftPosition = calculatePosition(safeStartDate, safeTimelineStart, safeTimelineEnd);
            const width = calculateWidth(safeStartDate, safeEndDate, safeTimelineStart, safeTimelineEnd);
            
            // Position indicator for detailed debugging
            console.log(`Event: ${event.title}, Type: ${event.type}, Left: ${leftPosition}%, Width: ${width}%, ` +
                       `StartDate: ${validStart.toISOString()}, EndDate: ${validEnd.toISOString()}, ` +
                       `Timeline StartDate: ${startDate.toISOString()}, Timeline EndDate: ${endDate.toISOString()}`);
            
            const rowOffset = event.row * 40; // 40px per row
            
            // Create event element
            const eventDiv = document.createElement('div');
            eventDiv.className = 'timeline-event';
            
            // Set exact positioning to align with dates
            // No transform used, direct left position for precise alignment
            eventDiv.style.left = `${leftPosition}%`;
            
            // Ensure width is at least 0.5% for visibility
            eventDiv.style.width = `${width}%`;
            
            // Add debug information and event ID as data attributes
            eventDiv.setAttribute('data-start', validStart.toISOString());
            eventDiv.setAttribute('data-event-id', event.id); // Add event ID for milestone parent relations
            eventDiv.setAttribute('data-end', validEnd.toISOString());
            eventDiv.setAttribute('data-left', leftPosition);
            eventDiv.setAttribute('data-width', width);
            
            // Apply visual styling
            eventDiv.style.backgroundColor = event.color;
            eventDiv.style.top = `${8 + rowOffset}px`;
          
            // Apply special styling for parent/child events
            if (event.isParent) {
              eventDiv.classList.add('parent-event');
              eventDiv.style.top = `${2 + rowOffset}px`; // Position at the top of the row
              // Store parent ID in dataset for reference
              eventDiv.dataset.parentId = event.id;
            } else if (event.parent) {
              eventDiv.classList.add('child-event');
            }
            
            timelineArea.appendChild(eventDiv);
            
            // Event content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'event-content';
            eventDiv.appendChild(contentDiv);
            
            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'event-title';
            titleSpan.textContent = event.title;
            contentDiv.appendChild(titleSpan);
            
            /* // Add milestone emojis for range events with milestone children
            if (parentToMilestones[event.id] && parentToMilestones[event.id].length > 0) {
              const milestoneEmojisContainer = document.createElement('div');
              milestoneEmojisContainer.className = 'milestone-emojis';
              milestoneEmojisContainer.style.display = 'flex';
              milestoneEmojisContainer.style.marginLeft = 'auto';
              milestoneEmojisContainer.style.marginRight = '4px';
              milestoneEmojisContainer.style.gap = '3px';
              
              // Sort milestones by date before adding emojis
              const sortedMilestones = [...parentToMilestones[event.id]].sort((a, b) => a.start - b.start);
              
              // Calculate total width for positioning
              const eventStartPosition = calculatePosition(event.start, startDate, endDate);
              const eventEndPosition = calculatePosition(event.end, startDate, endDate);
              const eventWidth = eventEndPosition - eventStartPosition;
              
              // Create a container for milestone dots (visual timeline)
              const timelineIndicator = document.createElement('div');
              timelineIndicator.className = 'milestone-timeline-indicator';
              timelineIndicator.style.position = 'absolute';
              timelineIndicator.style.bottom = '3px';
              timelineIndicator.style.left = '5%';
              timelineIndicator.style.right = '5%';
              timelineIndicator.style.height = '3px';
              timelineIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              timelineIndicator.style.borderRadius = '2px';
              timelineIndicator.style.pointerEvents = 'none';
              eventDiv.appendChild(timelineIndicator);
              
              // Add emoji for each milestone
              sortedMilestones.forEach(milestone => {
                const emojiSpan = document.createElement('span');
                // Use default emoji for all milestones
                emojiSpan.textContent = DEFAULT_MILESTONE_EMOJI;
                
                emojiSpan.setAttribute('data-milestone-id', milestone.id);
                
                // Format the date for the tooltip
                const dateStr = new Date(milestone.start).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                
                emojiSpan.title = `${milestone.title} (${dateStr})`;
                emojiSpan.style.cursor = 'pointer';
                
                // Add a data attribute for debugging
                emojiSpan.setAttribute('data-milestone-title', milestone.title);
                
                // Additional styling for better visibility
                emojiSpan.style.userSelect = 'none'; // Prevent text selection on double click
                
                // Add position indicator for this milestone on the timeline
                if (milestone.start >= event.start && milestone.start <= event.end) {
                  const relativePosition = (milestone.start - event.start) / (event.end - event.start);
                  const percentPosition = relativePosition * 100;
                  
                  const milestoneIndicator = document.createElement('div');
                  milestoneIndicator.className = 'milestone-dot';
                  milestoneIndicator.style.position = 'absolute';
                  milestoneIndicator.style.bottom = '2px';
                  milestoneIndicator.style.left = `calc(5% + ${percentPosition * 0.9}%)`;
                  
                  // Size and appearance controlled by CSS now
                  milestoneIndicator.style.transform = 'translateX(-50%)';
                  
                  // Add data attributes for debugging and functionality
                  milestoneIndicator.setAttribute('data-milestone-id', milestone.id);
                  milestoneIndicator.setAttribute('data-milestone-title', milestone.title);

                  // Make indicator clickable and show tooltip
                  milestoneIndicator.title = `${milestone.title} (${dateStr})`;
                  
                  // Add click handler to open the milestone's edit form
                  milestoneIndicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`Milestone dot clicked for: ${milestone.title}`);
                    editEvent(milestone);
                  });
                  
                  // Add this milestoneIndicator to the event div
                  eventDiv.appendChild(milestoneIndicator);
                }
                
                // Add enhanced hover effect - hover effects now primarily controlled by CSS
                emojiSpan.addEventListener('mouseenter', () => {
                  console.log(`Hovering over emoji for milestone: ${milestone.title}`);
                  // Highlight the corresponding milestone dot if it exists
                  const dots = eventDiv.querySelectorAll(`.milestone-dot[data-milestone-id="${milestone.id}"]`);
                  dots.forEach(dot => {
                    dot.style.backgroundColor = '#ffff00';
                    dot.style.transform = 'translateX(-50%) scale(2)';
                    dot.style.boxShadow = '0 0 8px rgba(255, 255, 255, 1), 0 0 12px rgba(255, 255, 255, 0.6)';
                  });
                });
                
                emojiSpan.addEventListener('mouseleave', () => {
                  // Reset the milestone dot styling
                  const dots = eventDiv.querySelectorAll(`.milestone-dot[data-milestone-id="${milestone.id}"]`);
                  dots.forEach(dot => {
                    dot.style.backgroundColor = '';
                    dot.style.transform = 'translateX(-50%)';
                    dot.style.boxShadow = '';
                  });
                });
                
                // Add click handler to open the milestone's edit form
                emojiSpan.addEventListener('click', (e) => {
                  e.stopPropagation();
                  console.log(`Emoji clicked for milestone: ${milestone.title}`);
                  editEvent(milestone);
                });
                
                milestoneEmojisContainer.appendChild(emojiSpan);
              });
              
              contentDiv.appendChild(milestoneEmojisContainer);
            } */
            
            // Important indicator
            if (event.isImportant) {
              const starIcon = document.createElement('span');
              starIcon.className = 'event-important';
              starIcon.innerHTML = '★';
              contentDiv.appendChild(starIcon);
            }
          
            // Action buttons on hover
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'event-actions';
            eventDiv.appendChild(actionsDiv);
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'action-button edit-button';
            editBtn.innerHTML = '✎';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              editEvent(event);
            });
            actionsDiv.appendChild(editBtn);
            
            // We're removing the delete button from the chart as requested
            // and only keeping it in the edit form
            
            // Click handler for entire event - use mousedown instead of click to avoid conflict with drag
            eventDiv.addEventListener('mousedown', (e) => {
              // Store the starting point to determine if this is a click or a drag
              const startX = e.clientX;
              const startY = e.clientY;
              let hasMoved = false;
              
              // Create a function to handle the mouse up event
              const handleMouseUp = (upEvent) => {
                // Calculate distance moved
                const deltaX = Math.abs(upEvent.clientX - startX);
                const deltaY = Math.abs(upEvent.clientY - startY);
                
                // Only process as a click if it was a small movement
                if (!hasMoved && deltaX < 5 && deltaY < 5) {
                  // This is a click, so edit the event
                  editEvent(event); // Use the event object correctly
                }
                
                // Clean up event listeners
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Function to detect movement
              const handleMouseMove = () => {
                hasMoved = true;
              };
              
              // Listen for mouse move and up events
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              
              // Prevent default to avoid text selection, etc.
              e.preventDefault();
            });
            
            // Tooltip on hover
            eventDiv.addEventListener('mouseenter', () => {
              tooltip
                .style('opacity', 1)
                .style('display', 'block')
                .html(`
                  <div class="font-medium">${event.title}</div>
                  <div>${formatDate(event.start)} - ${formatDate(event.end)}</div>
                  ${event.metadata ? `<div class="text-gray-300 mt-1">${event.metadata}</div>` : ''}
                `);
            });
            
            eventDiv.addEventListener('mousemove', (e) => {
              tooltip
                .style('left', `${e.pageX + 10}px`)
                .style('top', `${e.pageY + 10}px`);
            });
            
            eventDiv.addEventListener('mouseleave', () => {
              tooltip.style('opacity', 0);
            });
          } catch (error) {
            console.error("Error rendering range event:", event.title, error);
          }
        } else if (event.type === 'life') {
          // Store life events to add them later across all categories - nothing to render here
        } else if (event.type === 'milestone') {
          // Milestones are now displayed based on their row property
          console.log(`[MILESTONE RENDER] Rendering milestone: ${event.title}, row: ${event.row}, category: ${event.category}`);
          
          // Debug log the event details
          console.log(`[MILESTONE RENDER] Details:`, {
            id: event.id,
            title: event.title,
            row: event.row,
            rowType: typeof event.row,
            category: event.category,
            start: event.start,
            emoji: event.emoji
          });
          
          // Check if this milestone is within the visible timeframe
          if (event.start < startDate || event.start > endDate) {
            console.log(`[MILESTONE RENDER] Warning: Milestone "${event.title}" is outside visible timeframe (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)})`);
          }
          
          // Keep parent property for data relationships, but don't use it for positioning
          
          // Calculate valid position
          if (isNaN(event.start.getTime())) {
            console.error("Invalid date for milestone:", event.title, event.start);
            return; // Skip rendering this event
          }
          
          // Calculate position for milestone - ensure it's properly placed on the timeline
          leftPosition = calculatePosition(event.start, startDate, endDate);
          
          // Create a milestone dot indicator (similar to the milestone-dot used for parent events)
          const milestoneDot = document.createElement('div');
          milestoneDot.className = 'milestone-dot timeline-milestone'; // Add specific class for styling
          milestoneDot.style.position = 'absolute';
          milestoneDot.style.left = `${leftPosition}%`;
          
          // Add identifying data for this milestone
          milestoneDot.setAttribute('data-milestone-id', event.id);
          milestoneDot.setAttribute('data-milestone-title', event.title);
          milestoneDot.setAttribute('data-event-type', 'milestone');
          
          // Determine appropriate row and vertical position
          if (event.row === undefined || event.row === null) {
            // Only auto-calculate if no explicit row
            event.row = calculateEventRow(event, categoryEvents);
          }
          let topPx;
          if (event.parent) {
            // Align with parent range event's bar top
            const parentEv = events.find(e => e.id === event.parent);
            if (parentEv) {
              const parentOffset = (parentEv.row || 0) * 40;
              topPx = (parentEv.isParent ? 2 : 8) + parentOffset;
            } else {
              const ownOffset = (event.row || 0) * 40;
              topPx = 8 + ownOffset;
            }
          } else {
            // No parent: align with regular range event bar
            const ownOffset = (event.row || 0) * 40;
            topPx = 8 + ownOffset;
          }
          milestoneDot.style.top = `${topPx}px`;
          milestoneDot.style.bottom = 'auto';
          
          // Set colors and baseline styling
          milestoneDot.style.backgroundColor = event.color;
          milestoneDot.style.zIndex = '150'; // High z-index for visibility
          // If a custom emoji is set on this milestone, display it instead of the colored dot
          if (event.emoji) {
            milestoneDot.textContent = event.emoji;
            milestoneDot.style.setProperty('width', 'auto', 'important');
            milestoneDot.style.setProperty('height', 'auto', 'important');
            milestoneDot.style.setProperty('font-size', '20px', 'important');
            milestoneDot.style.backgroundColor = 'transparent';
            milestoneDot.style.setProperty('border', 'none', 'important');
            milestoneDot.style.color = event.color || 'inherit';
          }
          
          // Set additional debug data attributes
          milestoneDot.setAttribute('data-row', event.row);
          // rowOffset not in scope for parent-aligned milestones; calculate explicitly
          const rowOffsetVal = event.row * 40;
          milestoneDot.setAttribute('data-row-offset', rowOffsetVal);
          
          // Format date string for tooltip
          const dateStr = new Date(event.start).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          // Basic tooltip with title and date
          let tooltipContent = `${event.title} (${dateStr})`;
          
          // Add location to tooltip if available
          if (event.location) {
            if (typeof event.location === 'object') {
              const location = [];
              if (event.location.city) location.push(event.location.city);
              if (event.location.country) location.push(event.location.country);
              if (location.length > 0) {
                tooltipContent += `\nLocation: ${location.join(', ')}`;
              }
            } else if (typeof event.location === 'string') {
              tooltipContent += `\nLocation: ${event.location}`;
            }
          }
          
          // Set tooltip content
          milestoneDot.title = tooltipContent;
          
          // Custom tooltip handling could be added here if needed
          
          // Add click handler for editing
          milestoneDot.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Milestone dot clicked: ${event.title}`);
            editEvent(event);
          });
          
          // Add hover effects for better visibility
          milestoneDot.addEventListener('mouseenter', () => {
            console.log(`Hovering on milestone: ${event.title}`);
            milestoneDot.style.zIndex = '200'; // Raise z-index on hover
            // The rest of the hover styling is handled by CSS
          });
          
          milestoneDot.addEventListener('mouseleave', () => {
            milestoneDot.style.zIndex = '150'; // Reset z-index
          });
          
          // We don't need action buttons with the simplified dot approach
          // The milestone dot itself is clickable to edit
          
          // Add the milestone dot directly to the timeline area
          console.log(`Rendering milestone dot: ${event.title}, left: ${leftPosition}%, top: ${topPx}px`);
          timelineArea.appendChild(milestoneDot);
          
          // Optional: Enhanced tooltip functionality with D3
          // Check if we have D3 and tooltip initialized
          if (window.d3 && tooltip) {
            // Show enhanced tooltip on hover
            milestoneDot.addEventListener('mouseenter', (e) => {
              tooltip
                .style('opacity', 1)
                .style('display', 'block')
                .html(`
                  <div class="font-medium">${event.title}</div>
                  <div>${new Date(event.start).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</div>
                  ${event.metadata ? `<div class="text-gray-300 mt-1">${event.metadata}</div>` : ''}
                  ${event.location ? `<div class="text-gray-300">${typeof event.location === 'object' ? 
                    [event.location.city, event.location.country].filter(Boolean).join(', ') : 
                    event.location}</div>` : ''}
                `);
            });
            
            // Update tooltip position on mouse move
            milestoneDot.addEventListener('mousemove', (e) => {
              tooltip
                .style('left', `${e.pageX + 15}px`) // Offset slightly from cursor
                .style('top', `${e.pageY + 15}px`);
            });
            
            // Hide tooltip on mouse leave
            milestoneDot.addEventListener('mouseleave', () => {
              tooltip.style('opacity', 0);
            });
          }
        }
      });
      // Set minimum height for this category row based on number of event rows
      const maxRow = Math.max(0, ...categoryEvents.filter(e => e.type === 'range').map(e => e.row));
      const minHeight = Math.max(56, (maxRow + 1) * 40 + 16); // Base height + rows + padding
      timelineArea.style.minHeight = `${minHeight}px`;
    });
    
    // Add life events that span across all categories
    const lifeEvents = events.filter(event => event.type === 'life');
    
    if (lifeEvents.length > 0) {
      // Create a container for life event lines that spans the entire chart
      const lifeEventsContainer = document.createElement('div');
      lifeEventsContainer.className = 'life-events-container';
      // All styling is now in CSS
      timelineDiv.appendChild(lifeEventsContainer);
      
      // Create a separate container for life event labels BELOW the chart
      const labelsContainer = document.createElement('div');
      labelsContainer.className = 'life-labels-container';
      timelineDiv.parentNode.insertBefore(labelsContainer, timelineDiv.nextSibling);
      
      // Add a click handler on the entire container to handle clicks on labels
      labelsContainer.addEventListener('click', (e) => {
        // Find the closest label element
        const label = e.target.closest('.life-label');
        if (label && label.dataset.eventId) {
          // Find the event by ID
          const eventId = parseInt(label.dataset.eventId);
          const event = events.find(ev => ev.id === eventId);
          if (event) {
            editEvent(event);
          }
        }
      });
      
      // Add the today label to the labels container if it's in the visible range
      const today = new Date();
      if (today >= startDate && today <= endDate) {
        const todayPosition = calculatePosition(today, startDate, endDate);
        
        // Create "Today" label
        const todayLabel = document.createElement('div');
        todayLabel.className = 'life-label below-chart';
        todayLabel.textContent = 'Today';
        
        // Position the Today label directly under its marker
        todayLabel.style.left = `${todayPosition}%`;
        
        // Add a debug marker to the exact position
        todayLabel.setAttribute('data-marker', 'today');
        
        // Styling
        todayLabel.style.backgroundColor = '#22c55e';
        todayLabel.style.fontWeight = 'bold';
        
        // Add to the labels container
        labelsContainer.appendChild(todayLabel);
        
      }
      
      // Add each life event as a vertical line
      lifeEvents.forEach(event => {
        // Make sure we have a valid date
        if (isNaN(event.start.getTime())) {
          console.error("Invalid date for life event:", event.title, event.start);
          return; // Skip this life event
        }
        
        // Calculate the exact position using our improved function
        const leftPosition = calculatePosition(event.start, startDate, endDate);
        
        // Create full-height life event line
        const lineDiv = document.createElement('div');
        lineDiv.className = 'life-line';
        lineDiv.style.left = `${leftPosition}%`;
        lineDiv.style.backgroundColor = event.color;
        lineDiv.style.pointerEvents = 'auto'; // Make clickable
        // No transform needed - we want the line to align exactly with the date
        lifeEventsContainer.appendChild(lineDiv);
        
        // Create the life event label for below the chart
        const labelDiv = document.createElement('div');
        labelDiv.className = 'life-label below-chart';
        labelDiv.textContent = event.title;
        
        // Position label directly beneath the life-line
        labelDiv.style.left = `${leftPosition}%`;


        // Store event ID for click handling
        labelDiv.dataset.eventId = event.id;
        lineDiv.dataset.eventId = event.id;
        
        // Set background color to match the line
        labelDiv.style.backgroundColor = event.color;
        
        // CRITICAL: Position exactly at the same percentage as the life-line
        labelDiv.style.left = `${leftPosition}%`;
        
        // Add visual indicator to see alignment
        labelDiv.style.borderLeft = '2px solid yellow';
        
        // Store exact position for debugging
        labelDiv.setAttribute('data-date-position', leftPosition);
        lineDiv.setAttribute('data-date-position', leftPosition);
        
        
        // Add the label to the container
        labelsContainer.appendChild(labelDiv);
        
        // Log for debugging
        console.log(`Positioned life-label for "${event.title}" at ${leftPosition}%`);
        
        // Click handler for life lines - with the same approach as other click handlers
        lineDiv.addEventListener('mousedown', (e) => {
          // Store the starting point to determine if this is a click or a drag
          const startX = e.clientX;
          const startY = e.clientY;
          let hasMoved = false;
          
          // Create a function to handle the mouse up event
          const handleMouseUp = (upEvent) => {
            // Calculate distance moved
            const deltaX = Math.abs(upEvent.clientX - startX);
            const deltaY = Math.abs(upEvent.clientY - startY);
            
            // Only process as a click if it was a small movement
            if (!hasMoved && deltaX < 5 && deltaY < 5) {
              // This is a click, so edit the event
              editEvent(event); // Use the event data
            }
            
            // Clean up event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          // Function to detect movement
          const handleMouseMove = () => {
            hasMoved = true;
          };
          
          // Listen for mouse move and up events
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          
          // Stop propagation to prevent timeline drag when clicking on line
          e.stopPropagation();
          // Prevent default to avoid text selection, etc.
          e.preventDefault();
        });
        
        // Tooltip
        lineDiv.addEventListener('mouseenter', () => {
          tooltip
            .style('opacity', 1)
            .style('display', 'block')
            .html(`
              <div class="font-medium">${event.title}</div>
              <div>${formatDate(event.start)}</div>
              ${event.metadata ? `<div class="text-gray-300 mt-1">${event.metadata}</div>` : ''}
            `);
        });
        
        lineDiv.addEventListener('mousemove', (e) => {
          tooltip
            .style('left', `${e.pageX + 10}px`)
            .style('top', `${e.pageY + 10}px`);
        });
        
        lineDiv.addEventListener('mouseleave', () => {
          tooltip.style('opacity', 0);
        });
      });
    }
    
    // Render charts - both should use the current timeline date range
    renderAllVisualizations(events, [startDate, endDate]);
    
    // Initialize zoom and pan functionality
    initializeZoomAndPan(timelineDiv, startDate, endDate, update, currentMonthDisplay);
  }
});