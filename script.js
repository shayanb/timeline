// Interactive Timeline Script
// App configuration
const APP_VERSION = '1.5.0';
const COPYRIGHT = '© 2025 Timeline App';
let hasUnsavedChanges = false;

// PNG export initialization
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (window.html2canvas) {
      console.log('html2canvas loaded successfully');
    } else {
      console.warn('html2canvas not detected - PNG export may not be available');
    }
  });
}

// Function to update the modification status
function updateModificationStatus() {
  const statusElement = document.getElementById('modification-status');
  if (statusElement) {
    if (hasUnsavedChanges) {
      statusElement.style.display = 'inline-block';
    } else {
      statusElement.style.display = 'none';
    }
  }
  
  // We no longer need to update the footer modification status
  // as it's been moved to the buttons area
}
document.addEventListener('DOMContentLoaded', () => {
  // Initialize footer with version and copyright
  const versionElement = document.getElementById('app-version');
  const copyrightElement = document.getElementById('app-copyright');
  
  if (versionElement) {
    versionElement.textContent = `Version ${APP_VERSION}`;
  }
  
  if (copyrightElement) {
    copyrightElement.textContent = COPYRIGHT;
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
        
        // Refresh the dropdown
        $('#category-dropdown').dropdown('refresh');
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

  // World GeoJSON for heatmap
  let worldGeoJson;
  d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    .then(data => { worldGeoJson = data; update(); })
    .catch(err => console.error('Error loading world geojson', err));

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
    
    submitBtn.textContent = 'Add Event';
    cancelBtn.style.display = '';
    formTitle.textContent = 'Add New Event';
    
    // Hide delete button container when adding
    const deleteBtnContainer = document.getElementById('delete-btn-container');
    if (deleteBtnContainer) {
      deleteBtnContainer.innerHTML = '';
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
    submitBtn.textContent = 'Add Event';
    typeInput.dispatchEvent(new Event('change'));
    hideForm();
  });

  // Generate a random hex color for new entries
  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  // Toggle end-date field and row field based on event type
  typeInput.addEventListener('change', () => {
    // Show/hide end date field
    if (typeInput.value === 'range') {
      endInput.disabled = false;
      endInput.setAttribute('required', '');
      
      // Show row field for range events only
      rowField.style.display = 'block';
      
      // Populate row dropdown options (current category from dropdown)
      const currentCategory = categoryInput.value;
      populateRowDropdown(currentCategory);
      
      // Initialize dropdown
      if (window.$ && $.fn.dropdown) {
        $(rowInput).dropdown('refresh');
      }
    } else {
      endInput.disabled = true;
      endInput.removeAttribute('required');
      
      // Hide row field for non-range events
      rowField.style.display = 'none';
    }
  });

  // Function to parse CSV
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(',').map(header => header.trim());
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(val => val.trim());
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      result.push(obj);
    }
    
    return result;
  }
  
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
        
        // Reset the modified flag for new imports
        hasUnsavedChanges = false;
        updateModificationStatus();
        
        // Map imported events with properties
        events = data.map(ev => {
          const type = ev.type || (ev.life_event ? 'life' : 'range');
          const start = new Date(ev.start);
          const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
          const color = ev.color || randomColor();
          const metadata = ev.metadata || '';
          const category = ev.category || ev.parent || null;
          const place = ev.place || null;
          const isImportant = !!ev.isImportant;
          const isParent = !!ev.isParent;
          const categoryBgColor = ev.categoryBgColor || null;
          const row = ev.row !== undefined ? ev.row : null;
          
          // Handle location data in various formats
          let location = null;
          
          if (ev.location) {
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
          
          // Store original event ID if available for reference
          const eventId = ev.id || null;
          
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
            categoryBgColor,
            parentId: ev.parentId || null
          };
        });
        
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
            // Clear any existing map data
            d3.select('#world-heatmap').selectAll('*').remove();
            d3.select('#nested-pie-chart').selectAll('*').remove();
            
            // Re-render the charts with the new data
            renderWorldHeatmap(events, [startDate, endDate]);
            renderNestedPieChart(events, [startDate, endDate]);
          }, 100);
        } else {
          update();
        }
        
        colorInput.value = randomColor();
      } catch (err) {
        alert('Error parsing YAML: ' + err);
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
    events.forEach(event => {
      Object.keys(event).forEach(key => {
        if (key === 'id') return; // Skip internal ID
        if (key === 'start' || key === 'end') {
          headers.add(key); // Use string format for dates
        } else if (key === 'location') {
          headers.add('location.city');
          headers.add('location.country');
        } else {
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
      const row = headerArray.map(header => {
        if (header === 'start' || header === 'end') {
          return event[header] ? event[header].toISOString().slice(0, 10) : '';
        } else if (header === 'location.city') {
          return event.location ? (event.location.city || '') : '';
        } else if (header === 'location.country') {
          return event.location ? (event.location.country || '') : '';
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
        // Make sure transform property is properly set
        label.style.transformOrigin = 'top center';
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
      const categoryEvents = events.filter(e => (e.category || 'General') === category && e.type === 'range');
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
    hasUnsavedChanges = false;
    updateModificationStatus();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  
  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    // Prepare data the same way as YAML export
    Object.keys(groupByCategory(events)).forEach(category => {
      const categoryEvents = events.filter(e => (e.category || 'General') === category && e.type === 'range');
      const sortedEvents = sortByDate(categoryEvents);
      
      sortedEvents.forEach(event => {
        event.row = calculateEventRow(event, categoryEvents);
      });
    });
    
    // Convert to CSV format
    const csv = eventsToCSV(events);
    
    // Download the CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_export.csv';
    a.click();
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
    
    // Get custom row number if provided (for range events only)
    let customRow = null;
    if (type === 'range' && rowInput.value !== '') {
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
        
        // Set custom row if provided (for range events only)
        if (type === 'range' && customRow !== null) {
          ev.row = customRow;
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
      const rowValue = type === 'range' && customRow !== null ? customRow : null;
      
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
        row: rowValue // Add the row number if provided (will be calculated during rendering if null)
      });
    }
    
    // Mark as having unsaved changes after adding/editing an event
    hasUnsavedChanges = true;
    updateModificationStatus();
    
    form.reset();
    colorInput.value = randomColor();
    submitBtn.textContent = 'Add Event';
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
    
    // Update parent input
    parentInput.value = d.parent || '';
    eventIdInput.value = d.eventId || '';
    
    // Populate categories from existing ones
    populateCategories();
    
    // Set category using Semantic UI dropdown
    if (window.$ && $.fn.dropdown) {
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
    if (d.type === 'range') {
      rowField.style.display = 'block'; // Show row field for range events
      
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
      rowField.style.display = 'none'; // Hide row field for non-range events
    }
    
    // IMPORTANT: Always directly set the checkbox values before using Semantic UI
    // This ensures the value is set even if Semantic UI fails
    importantCheckbox.checked = !!d.isImportant;
    isParentCheckbox.checked = !!d.isParent;
    
    // Now also set them with Semantic UI if available
    if (window.$ && $.fn.checkbox) {
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
        $('.ui.checkbox').checkbox('refresh');
      }, 50);
    }
    
    // Add delete button in the delete button container
    const deleteBtnContainer = document.getElementById('delete-btn-container');
    if (deleteBtnContainer) {
      // Clear any existing button first
      deleteBtnContainer.innerHTML = '';
      
      // Create delete button
      const deleteEventBtn = document.createElement('button');
      deleteEventBtn.id = 'delete-event-btn';
      deleteEventBtn.className = 'ui negative button w-full';
      deleteEventBtn.textContent = 'Delete Event';
      deleteEventBtn.type = 'button'; // Ensure it's not a submit button
      deleteEventBtn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteEvent(editingId);
        hideForm();
      });
      
      // Add to the dedicated container
      deleteBtnContainer.appendChild(deleteEventBtn);
    }
    
    submitBtn.textContent = 'Update Event';
    
    // Show form for editing
    showForm();
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // Delete an event
  function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
      events = events.filter(ev => ev.id !== id);
      
      // Mark as having unsaved changes
      hasUnsavedChanges = true;
      updateModificationStatus();
      
      update();
    }
  }

  // Format date for display
  function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Format month for header
  function formatMonth(date) {
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      year: 'numeric'
    });
  }

  // Get all months between start and end dates
  function getMonthsBetween(start, end) {
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

  // Calculate position percentage for event placement with additional checks
  function calculatePosition(date, startDate, endDate) {
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

  // Calculate width percentage for event with additional validation
  function calculateWidth(startDate, endDate, timelineStart, timelineEnd) {
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

  // Sort events by date for better layout
  function sortByDate(events) {
    return [...events].sort((a, b) => a.start - b.start);
  }

  // Group events by category
  function groupByCategory(events) {
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

  // Check if two events overlap
  function eventsOverlap(event1, event2) {
    // First ensure both event dates are valid
    if (!(event1.start instanceof Date) || !(event1.end instanceof Date) ||
        !(event2.start instanceof Date) || !(event2.end instanceof Date)) {
      console.error("Invalid date objects in eventsOverlap", event1, event2);
      return false; // Can't determine overlap with invalid dates
    }
    
    // Test Case: Skip self comparison to avoid bugs
    if (event1.id === event2.id) {
      return false;
    }
    
    // Define what a true overlap is: one event starts before the other ends
    const hasDateOverlap = event1.start <= event2.end && event2.start <= event1.end;
    
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

  // Calculate row for event to avoid overlaps
  function calculateEventRow(event, eventsInCategory) {
    // If the event already has a custom row defined, respect it
    if (event.row !== undefined && event.row !== null) {
      console.log(`Using custom row ${event.row} for event: ${event.title}`);
      return event.row;
    }
    
    if (!eventsInCategory || eventsInCategory.length === 0) return 0;
    
    console.log(`Calculating row for: ${event.title}`);
    
    // First, sort events by start date to ensure consistent row allocation
    const sortedEvents = [...eventsInCategory].sort((a, b) => a.start - b.start);
    
    // Create a list of events that potentially overlap with this one
    const overlappingEvents = [];
    
    for (const otherEvent of sortedEvents) {
      // Skip self or non-range events
      if (otherEvent.id === event.id || otherEvent.type !== 'range') continue;
      
      // Check if the other event's date range truly overlaps with this event
      if (eventsOverlap(event, otherEvent)) {
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
        occupiedRows.add(e.row);
        console.log(`Event: ${e.title} occupies row ${e.row}`);
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

  // Render world heatmap - now accepts time domain like the pie chart
  function renderWorldHeatmap(events, timeDomain) {
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
    // Also track cities for tooltips and dots
    const cityData = {};
    
    // Structure to store city coordinates for dots
    const cities = [];
    
    // Comprehensive list of world cities coordinates
    const cityCoordinates = {
      // North America
      "New York": [-74.0059, 40.7128],
      "San Francisco": [-122.4194, 37.7749],
      "Napa Valley": [-122.2746, 38.5025],
      "Boston": [-71.0589, 42.3601],
      "Chicago": [-87.6298, 41.8781],
      "Los Angeles": [-118.2437, 34.0522],
      "Seattle": [-122.3321, 47.6062],
      "Miami": [-80.1918, 25.7617],
      "Washington DC": [-77.0369, 38.9072],
      "Austin": [-97.7431, 30.2672],
      "San Diego": [-117.1611, 32.7157],
      "Portland": [-122.6765, 45.5231],
      "Denver": [-104.9903, 39.7392],
      "Las Vegas": [-115.1398, 36.1699],
      "Vancouver": [-123.1207, 49.2827],
      "Toronto": [-79.3832, 43.6532],
      "Montreal": [-73.5674, 45.5017],
      "Mexico City": [-99.1332, 19.4326],
      
      // Europe
      "London": [-0.1278, 51.5074],
      "Berlin": [13.4050, 52.5200],
      "Paris": [2.3522, 48.8566],
      "Rome": [12.4964, 41.9028],
      "Madrid": [-3.7038, 40.4168],
      "Barcelona": [2.1734, 41.3851],
      "Amsterdam": [4.9041, 52.3676],
      "Brussels": [4.3517, 50.8503],
      "Copenhagen": [12.5683, 55.6761],
      "Stockholm": [18.0686, 59.3293],
      "Munich": [11.5820, 48.1351],
      "Vienna": [16.3738, 48.2082],
      "Prague": [14.4378, 50.0755],
      "Budapest": [19.0402, 47.4979],
      "Zurich": [8.5417, 47.3769],
      "Geneva": [6.1432, 46.2044],
      "Athens": [23.7275, 37.9838],
      "Dublin": [-6.2603, 53.3498],
      "Edinburgh": [-3.1883, 55.9533],
      "Oslo": [10.7522, 59.9139],
      "Helsinki": [24.9384, 60.1699],
      "Warsaw": [21.0122, 52.2297],
      "Lisbon": [-9.1393, 38.7223],
      "Istanbul": [28.9784, 41.0082],
      
      // Asia
      "Tokyo": [139.6917, 35.6895],
      "Singapore": [103.8198, 1.3521],
      "Hong Kong": [114.1694, 22.3193],
      "Seoul": [126.9780, 37.5665],
      "Beijing": [116.4074, 39.9042],
      "Shanghai": [121.4737, 31.2304],
      "Bangkok": [100.5018, 13.7563],
      "Kuala Lumpur": [101.6869, 3.1390],
      "Jakarta": [106.8456, -6.2088],
      "New Delhi": [77.2090, 28.6139],
      "Mumbai": [72.8777, 19.0760],
      "Dubai": [55.2708, 25.2048],
      "Abu Dhabi": [54.3773, 24.4539],
      "Taipei": [121.5654, 25.0330],
      "Manila": [120.9842, 14.5995],
      "Osaka": [135.5023, 34.6937],
      "Kyoto": [135.7681, 35.0116],
      "Ho Chi Minh City": [106.6297, 10.8231],
      "Bali": [115.1889, -8.4095],
      
      // Oceania
      "Sydney": [151.2093, -33.8688],
      "Melbourne": [144.9631, -37.8136],
      "Auckland": [174.7633, -36.8485],
      "Wellington": [174.7762, -41.2865],
      "Brisbane": [153.0251, -27.4698],
      "Perth": [115.8613, -31.9505],
      
      // Africa
      "Cape Town": [18.4241, -33.9249],
      "Johannesburg": [28.0473, -26.2041],
      "Cairo": [31.2357, 30.0444],
      "Marrakech": [-7.9811, 31.6295],
      "Nairobi": [36.8219, -1.2921],
      
      // South America
      "Rio de Janeiro": [-43.1729, -22.9068],
      "Buenos Aires": [-58.3816, -34.6037],
      "São Paulo": [-46.6333, -23.5505],
      "Lima": [-77.0428, -12.0464],
      "Santiago": [-70.6693, -33.4489],
      "Bogotá": [-74.0721, 4.7110],
      
      // Country coordinates (for when only country is specified)
      "France": [2.2137, 46.2276],
      "United States": [-98.5795, 39.8283],
      "United Kingdom": [-3.4360, 55.3781],
      "Germany": [10.4515, 51.1657],
      "Italy": [12.5674, 42.5033],
      "Spain": [-3.7492, 40.4637],
      "China": [104.1954, 35.8617],
      "Japan": [138.2529, 36.2048],
      "Australia": [133.7751, -25.2744],
      "Brazil": [-51.9253, -14.2350],
      "Canada": [-106.3468, 56.1304],
      "Russia": [105.3188, 61.5240],
      "India": [78.9629, 20.5937],
      "Turkey": [35.2433, 38.9637],
      
      // Default fallback for unknown cities
      "Unknown": [0, 0]
    };
    
    // Apply time domain filtering similar to pie chart
    const [startDomain, endDomain] = timeDomain || [new Date(0), new Date(Date.now() + 31536000000)]; // Default to all time if not specified
    
    // Create a country name mapping to match GeoJSON country names
    const countryNameMap = {
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

    // Function to normalize country names to match GeoJSON
    function normalizeCountryName(name) {
      if (!name) return name;
      // Return the mapped name or the original if no mapping exists
      return countryNameMap[name] || name;
    }
    
    // Filter events that are within the current view domain
    const filtered = events.filter(d => {
      // For range events, check if they overlap with the domain
      if (d.type === 'range') {
        return d.end >= startDomain && d.start <= endDomain;
      }
      // For single events (milestone/life), check if they're within the domain
      return d.start >= startDomain && d.start <= endDomain;
    });
    
    filtered.forEach(d => {
      // Allow for both range events and single-day events
      const hasDuration = d.type === 'range' && d.end > d.start;
      const isSingleEvent = d.type === 'milestone' || d.type === 'life';
      
      if (hasDuration || isSingleEvent) {
        let country = null;
        let city = null;
        
        // Try to get location from the location structure
        if (d.location) {
          // Handle object format
          if (typeof d.location === 'object') {
            country = d.location.country || null;
            city = d.location.city || '';
          } 
          // Handle string format (legacy or simplified)
          else if (typeof d.location === 'string') {
            country = d.location;
          }
        }
        // Fallback to legacy place field
        else if (d.place) {
          country = d.place;
        }
        
        // Debug logging for location issues (uncomment to debug)
        // console.log("Event location check:", d.title, 
        //   "location:", JSON.stringify(d.location), 
        //   "place:", d.place, 
        //   "result:", country,
        //   "city:", city);
        
        if (country) {
          // Normalize the country name to match GeoJSON standards
          const normalizedCountry = normalizeCountryName(country);
          
          // Calculate duration - adjusting for visible time range
          let days = 1; // Default for milestone/life events
          
          if (hasDuration) {
            // Calculate actual visible duration within the time domain
            const visibleStart = d.start < startDomain ? startDomain : d.start;
            const visibleEnd = d.end > endDomain ? endDomain : d.end;
            days = (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24);
          }
          
          // Debug country mapping
          console.log(`Map country: "${country}" -> "${normalizedCountry}"`);
          
          // Add to country totals - use the normalized country name
          countryDurations[normalizedCountry] = (countryDurations[normalizedCountry] || 0) + days;
          
          // Track city data for this country (use normalized name)
          if (!cityData[normalizedCountry]) {
            cityData[normalizedCountry] = {};
          }
          
          if (city) {
            cityData[normalizedCountry][city] = (cityData[normalizedCountry][city] || 0) + days;
            
            // Add city to our list for dots if we have coordinates
            // Use a case-insensitive lookup and handle cities not in our coordinate list
            const cityKey = city ? Object.keys(cityCoordinates).find(
              key => key.toLowerCase() === city.toLowerCase()
            ) : null;
            
            const coordinates = cityKey ? cityCoordinates[cityKey] : 
                               (cityCoordinates[country] ? cityCoordinates[country] : cityCoordinates["Unknown"]);
                               
            // Only add if we don't already have this city
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
              // If city exists, accumulate days
              existingCity.days += days;
            }
          }
        }
      }
    });
    
    const values = Object.values(countryDurations);
    const max = d3.max(values) || 1;
    // Use a rainbow color scale for more vibrant visualization
    const colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, max * 0.7]); // More colorful and saturated
    
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Add tooltip for map
    const mapTooltip = d3.select('body').append('div')
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
    
    // Render countries
    svg.append('g')
      .selectAll('path')
      .data(worldGeoJson.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const val = countryDurations[d.properties.name] || 0;
        return val ? colorScale(val) : '#e2e8f0'; // Slightly darker base color for better contrast
      })
      .attr('stroke', d => {
        const val = countryDurations[d.properties.name] || 0;
        return val ? '#666' : '#ccc'; // Darker stroke for countries with data
      })
      .attr('stroke-width', d => {
        const val = countryDurations[d.properties.name] || 0;
        return val ? 0.8 : 0.5; // Thicker stroke for countries with data
      })
      .on('mouseover', function(event, d) {
        const country = d.properties.name;
        const days = countryDurations[country] || 0;
        
        if (days > 0) {
          // Build tooltip content with city breakdown
          let tooltipContent = `<strong>${country}</strong>: ${Math.round(days)} days<br>`;
          
          if (cityData[country]) {
            tooltipContent += '<ul style="margin: 5px 0; padding-left: 20px;">';
            Object.entries(cityData[country])
              .sort((a, b) => b[1] - a[1]) // Sort cities by duration
              .forEach(([city, cityDays]) => {
                tooltipContent += `<li>${city}: ${Math.round(cityDays)} days</li>`;
              });
            tooltipContent += '</ul>';
          }
          
          mapTooltip.html(tooltipContent)
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
          
          d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
        }
      })
      .on('mousemove', function(event) {
        mapTooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        mapTooltip.style('opacity', 0);
        d3.select(this).attr('stroke', '#ccc').attr('stroke-width', 0.5);
      });
      
    // Add city dots with improved sizing and visibility
    svg.selectAll('circle.city-dot')
      .data(cities)
      .join('circle')
      .attr('class', 'city-dot')
      .attr('cx', d => {
        // Handle potential errors with coordinates
        try {
          const proj = projection(d.coordinates);
          return proj ? proj[0] : null;
        } catch (e) {
          console.log('Error projecting coordinates for', d.name, d.coordinates);
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
      .attr('r', d => {
        // Improved sizing formula that gives better visual scaling
        const baseSize = 3;
        const scaleFactor = 0.8;
        const size = baseSize + Math.sqrt(d.days) * scaleFactor;
        return Math.min(12, Math.max(4, size)); // Ensure minimum and maximum size
      })
      .attr('fill', d => d.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('opacity', 0.85)
      .style('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.4))')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Enlarge on hover
        d3.select(this)
          .attr('r', d => {
            const currentSize = Math.min(12, Math.max(4, 3 + Math.sqrt(d.days) * 0.8));
            return currentSize * 1.3; // Increase by 30%
          })
          .attr('opacity', 1)
          .attr('stroke-width', 2);
        
        // Enhanced tooltip with more details
        let tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${d.name}, ${d.country}</div>
          <div style="margin-bottom: 3px;">${d.event}</div>
          <div style="font-weight: 500;">${Math.round(d.days)} days</div>
        `;
        
        mapTooltip.html(tooltipContent)
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        mapTooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('r', d => Math.min(12, Math.max(4, 3 + Math.sqrt(d.days) * 0.8)))
          .attr('opacity', 0.85)
          .attr('stroke-width', 1);
        mapTooltip.style('opacity', 0);
      });
    
    // Add a title with date range
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Time Spent by Country (${formatMonth(startDomain)} - ${formatMonth(endDomain)})`);
    
    // Add a legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - legendWidth - 20;
    const legendY = height - 30;
    
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);
    
    // Create gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');
    
    // Add multiple gradient stops for rainbow colors
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale((i / steps) * max * 0.7));
    }
    
    // Draw the gradient rectangle
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)');
    
    // Add legend labels
    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .style('font-size', '12px')
      .text('0 days');
    
    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text(`${Math.round(max)} days`);
  }

  // Render nested pie chart with locations (inner) and categories (outer)
  function renderNestedPieChart(events, timeDomain) {
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
    
    // Calculate total period days for milestone and life event weighting
    const totalPeriodDays = (endDomain - startDomain) / (1000 * 60 * 60 * 24);
    const milestoneValue = totalPeriodDays * 0.01; // 1% of time period for each milestone
    const lifeEventValue = totalPeriodDays * 0.05; // 5% of time period for each life event (increased from 2%)
    
    // Generate location data for inner pie
    const locationData = {};
    // Generate category data for outer pie
    const categoryByLocationData = {};
    
    filteredEvents.forEach(event => {
      // Determine duration based on event type
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
      
      // Extract location
      const location = event.location && event.location.country 
        ? event.location.country 
        : (event.location && event.location.city ? event.location.city : "Other");
      
      // Extract category
      const category = event.category || "Uncategorized";
      
      // Add to location data (inner pie)
      if (!locationData[location]) {
        locationData[location] = {
          name: location,
          value: 0,
          children: []
        };
      }
      locationData[location].value += duration;
      
      // Track category data for each location (outer pie)
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
    
    // Create hierarchical data for sunburst
    const nestedData = {
      name: "Time Spent",
      children: []
    };
    
    // Convert location data to children
    Object.values(locationData).forEach(location => {
      if (location.value > 0) {
        const locationNode = {
          name: location.name,
          value: location.value,
          children: []
        };
        
        // Add category children
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
        
        nestedData.children.push(locationNode);
      }
    });
    
    // Setup SVG dimensions
    const width = container.node().clientWidth || 400;
    const height = 400;
    const margin = 20;
    
    // Calculate radius
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
    
    // Create a color scale for countries/locations (inner ring)
    const locationColorScale = d3.scaleOrdinal()
      .domain(Object.keys(locationData))
      .range([
        // Vibrant, distinct colors for countries
        "#FF6B6B", // Bright Red
        "#4D96FF", // Bright Blue
        "#6BCB77", // Bright Green
        "#FFD93D", // Bright Yellow
        "#9B5DE5", // Bright Purple
        "#FF9E7A", // Peach
        "#00C2A8", // Teal
        "#F15BB5", // Pink
        "#00BBF9", // Light Blue
        "#7B61FF", // Indigo
        "#FED049", // Golden
        "#4CACBC", // Blue-Green
        "#FF6B8B", // Salmon
        "#2EC4B6", // Turquoise
        "#8338EC", // Royal Purple
        "#3A86FF", // Azure
        "#FB5607", // Orange
        "#06D6A0", // Mint
        "#FFBE0B", // Amber
        "#9E0059", // Magenta
        "#118AB2", // Ocean Blue
        "#EF476F", // Watermelon
        "#8EA604", // Olive
        "#2B9348", // Forest Green
        "#8338EC", // Violet
        "#8AB17D"  // Sage
      ]);
    
    // Extract category colors from events data
    function getCategoryColor(categoryName) {
      // Default color if not found in events
      const defaultColor = "#4F46E5";
      
      // Find the first event with this category that has a color
      const categoryEvent = events.find(event => 
        event.category === categoryName && event.color
      );
      
      // Find if there's an event with a categoryBgColor specified
      const categoryWithBgColor = events.find(event => 
        event.category === categoryName && event.categoryBgColor
      );
      
      if (categoryWithBgColor && categoryWithBgColor.categoryBgColor) {
        // Try to extract the RGB values from rgba string
        const rgbaMatch = categoryWithBgColor.categoryBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbaMatch) {
          // Convert to hex
          const r = parseInt(rgbaMatch[1]);
          const g = parseInt(rgbaMatch[2]);
          const b = parseInt(rgbaMatch[3]);
          return `rgb(${r}, ${g}, ${b})`;
        }
      }
      
      // Return the event color if found, otherwise default
      return categoryEvent ? categoryEvent.color : defaultColor;
    }
    
    // Create color scale for categories using colors from events data
    const categoryColorScale = d3.scaleOrdinal()
      .domain(Object.keys(categoryByLocationData).flatMap(loc => 
        Object.keys(categoryByLocationData[loc])
      ))
      .range(Object.keys(categoryByLocationData).flatMap(loc => 
        Object.keys(categoryByLocationData[loc]).map(cat => getCategoryColor(cat))
      ));
      
    // Helper to create a 3D shaded version of a color
    const create3DShade = (baseColor, type) => {
      const rgb = d3.rgb(baseColor);
      
      // Different shade transformations based on type
      if (type === "darker") {
        // Darker shade for 3D effect bottom/shadow
        return d3.rgb(
          Math.max(0, rgb.r * 0.7),
          Math.max(0, rgb.g * 0.7),
          Math.max(0, rgb.b * 0.7)
        ).toString();
      } else if (type === "lighter") {
        // Lighter shade for 3D effect highlight
        return d3.rgb(
          Math.min(255, rgb.r + (255 - rgb.r) * 0.5),
          Math.min(255, rgb.g + (255 - rgb.g) * 0.5),
          Math.min(255, rgb.b + (255 - rgb.b) * 0.5)
        ).toString();
      }
      return baseColor; // Default
    };
      
    // Create meaningful coloring function that uses unique colors for locations
    const colorFn = d => {
      if (d.depth === 0) return "white"; // Root
      
      // For inner ring (locations), use the unique location color
      if (d.depth === 1) {
        return locationColorScale(d.data.name);
      }
      
      // For outer ring (categories), use the category color
      if (d.depth === 2) {
        const categoryColor = categoryColorScale(d.data.name);
        return categoryColor;
      }
      
      return "#ccc"; // Fallback
    };
    
    // Create hierarchy
    const root = d3.hierarchy(nestedData)
      .sum(d => d.value);
    
    // Create partition layout
    const partition = d3.partition()
      .size([2 * Math.PI, radius * 0.8]); // Reduced slightly to leave space between rings
    
    // Compute partition
    partition(root);
    
    // Create custom arc generator with space between rings
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => {
        // Add spacing between rings
        if (d.depth === 1) return Math.max(0, d.y0 * 0.8); // Inner ring smaller
        if (d.depth === 2) return Math.max(0, d.y0 * 1.1); // Gap between rings
        return Math.max(0, d.y0);
      })
      .outerRadius(d => {
        // Add spacing between rings
        if (d.depth === 1) return Math.max(0, d.y1 * 0.8); // Inner ring smaller
        return Math.max(0, d.y1);
      })
      .padAngle(0.03) // Add padding between segments
      .padRadius(radius / 3);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
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
    
    // Define a filter for the drop shadow
    const defs = svg.append("defs");
    
    const dropShadowFilter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    
    dropShadowFilter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    
    dropShadowFilter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    
    const feComponentTransfer = dropShadowFilter.append("feComponentTransfer")
      .attr("in", "offsetBlur")
      .attr("result", "shadow");
      
    feComponentTransfer.append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.5);
    
    const feMerge = dropShadowFilter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "shadow");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
      
    // Create radial gradients for each category to enhance 3D effect
    // Get unique categories
    const uniqueCategories = [...new Set(Object.keys(categoryByLocationData).flatMap(loc => 
      Object.keys(categoryByLocationData[loc])
    ))];
    
    // Create a map to store gradient IDs for each category
    const categoryGradientMap = {};
    
    // Create gradient for each category - use a safer ID approach
    uniqueCategories.forEach((category, index) => {
      const baseColor = categoryColorScale(category);
      // Use index-based IDs to avoid issues with special characters
      const gradientId = `gradient-cat-${index}`;
      
      const gradient = defs.append("radialGradient")
        .attr("id", gradientId)
        .attr("cx", "0.5")
        .attr("cy", "0.5")
        .attr("r", "0.5")
        .attr("fx", "0.25") // Offset the focal point for more dramatic lighting
        .attr("fy", "0.25"); 
      
      // Add gradient stops
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", create3DShade(baseColor, "lighter"));
        
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", baseColor);
        
      // Store the gradientId in a map for lookup
      categoryGradientMap[category] = gradientId;
    });
    
    // Add arcs with enhanced 3D effects
    const path = svg.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0)) // Skip the root
      .enter().append('path')
      .attr('class', d => d.depth === 2 ? 'category-slice' : (d.depth === 1 ? 'location-slice' : ''))
      .attr('d', arc)
      .attr('fill', function(d) {
        // Basic color
        const color = colorFn(d);
        
        // For outer ring (categories), use the radial gradient if available
        if (d.depth === 2 && categoryGradientMap[d.data.name]) {
          return `url(#${categoryGradientMap[d.data.name]})`;
        }
        
        return color;
      })
      .attr('stroke', 'rgba(255, 255, 255, 0.5)')
      .attr('stroke-width', 1)
      .style('filter', d => d.depth === 1 ? 'url(#drop-shadow)' : '') // Apply shadow only to inner ring
      .style('opacity', 0.8) // Slightly transparent by default for better highlight contrast
      .style('transition', 'all 0.3s')
      .on('mouseover', function(event, d) {
        // Create tooltip content
        let content = '';
        
        if (d.depth === 1) {
          // Location (inner ring)
          content = `<strong>${d.data.name}</strong><br>${Math.round(d.value)} days`;
        } else {
          // Category (outer ring)
          content = `<strong>${d.data.name}</strong> in ${d.parent.data.name}<br>${Math.round(d.value)} days`;
        }
        
        tooltip.html(content)
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
        
        // Highlight segment - enhanced 3D pop effect
        d3.select(this)
          .style('transform', 'scale(1.03) translateZ(5px)')
          .style('filter', 'brightness(1.1) url(#drop-shadow)')
          .style('z-index', 10);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d) {
        tooltip.style('opacity', 0);
        d3.select(this)
          .style('transform', 'scale(1) translateZ(0)')
          .style('filter', d.depth === 1 ? 'url(#drop-shadow)' : '')
          .style('z-index', 0);
      })
      .on('click', function(event, d) {
        // Only trigger filtering for category (outer) slices
        if (d.depth === 2) {
          const category = d.data.name;
          
          // Call the filtering function
          showCategoryEvents(category);
        }
      });
    
    // Add labels with external labeling strategy for small segments
    // First, decide which segments need internal vs external labels
    const segments = root.descendants().filter(d => d.depth === 1);
    const minSegmentSize = 0.15; // Minimum segment size for internal labels
    
    // Only show labels for segments that are large enough
    const internalLabels = segments.filter(d => (d.x1 - d.x0) >= minSegmentSize);
    
    // Calculate label sizes and positions
    function midAngle(d) {
      return d.x0 + (d.x1 - d.x0) / 2;
    }
    
    // Add internal labels only for large enough segments
    svg.selectAll('text.internal-label')
      .data(internalLabels)
      .enter().append('text')
      .attr('class', 'internal-label')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('transform', function(d) {
        const angle = (midAngle(d) - Math.PI / 2) * 180 / Math.PI;
        const midRadius = (d.y0 + d.y1) / 2 * 0.75; // Slightly adjusted
        return `rotate(${angle}) translate(${midRadius},0) rotate(${-angle})`;
      })
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .style('font-weight', 'bold')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
      .text(d => d.data.name);
    
    // No external labels - segments without labels will only show in tooltip on hover
    
    // Add center label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', '#333')
      .text('Places');
      
    // Add a legend for categories (displayed in a grid to save space)
    const legendItems = uniqueCategories.filter(cat => cat !== "Unknown"); // Filter out "Unknown" category
    
    if (legendItems.length > 0) {
      const legendContainer = container.append('div')
        .attr('class', 'chart-legend')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fill, minmax(120px, 1fr))')
        .style('gap', '4px')
        .style('margin-top', '15px')
        .style('font-size', '12px');
        
      // Track current active filter
      let activeFilter = null;
      
      // Function to show events of a specific category in the timeline
      function showCategoryEvents(category) {
        // If category is already active, clear the filter
        if (activeFilter === category) {
          // Clear filter and reset UI
          activeFilter = null;
          
          // Reset pie chart - all slices back to normal
          svg.selectAll('.category-slice')
            .transition().duration(300)
            .style('opacity', 0.8)
            .style('stroke-width', 1)
            .style('transform', 'scale(1) translateZ(0)')
            .attr('d', d => arc(d));
          
          // Redraw the timeline with all events
          renderTimeline(events, startDate, endDate);
          
          // Show notification
          const notification = container.append('div')
            .attr('class', 'chart-notification')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('left', '50%')
            .style('transform', 'translateX(-50%)')
            .style('background-color', 'rgba(0,0,0,0.7)')
            .style('color', 'white')
            .style('padding', '8px 16px')
            .style('border-radius', '20px')
            .style('font-size', '12px')
            .style('opacity', 0)
            .text('Showing all events');
            
          notification.transition()
            .duration(300)
            .style('opacity', 1)
            .transition()
            .delay(2000)
            .duration(500)
            .style('opacity', 0)
            .remove();
            
          return;
        }
        
        // Set active filter
        activeFilter = category;
        
        // Hover up ALL slices of the selected category
        svg.selectAll('.category-slice')
          .each(function(d) {
            if (d && d.data && d.depth === 2) {
              if (d.data.name === category) {
                // Pop out all slices of this category
                d3.select(this)
                  .transition().duration(300)
                  .style('opacity', 1)
                  .style('stroke-width', 2)
                  .style('transform', 'scale(1.1) translateZ(5px)')
                  .style('filter', 'brightness(1.1) drop-shadow(0 0 5px rgba(0,0,0,0.3))')
                  .style('z-index', 10);
              } else {
                // Dim others
                d3.select(this)
                  .transition().duration(300)
                  .style('opacity', 0.3)
                  .style('transform', 'scale(0.98) translateZ(0)')
                  .style('filter', 'none')
                  .style('z-index', 0);
              }
            }
          });
        
        // Filter events by the selected category
        const categoryEvents = events.filter(e => e.category === category);
        
        // Redraw the timeline with filtered events
        renderTimeline(categoryEvents, startDate, endDate);
        
        // Show notification
        const notification = container.append('div')
          .attr('class', 'chart-notification')
          .style('position', 'absolute')
          .style('top', '10px')
          .style('left', '50%')
          .style('transform', 'translateX(-50%)')
          .style('background-color', 'rgba(0,0,0,0.7)')
          .style('color', 'white')
          .style('padding', '8px 16px')
          .style('border-radius', '20px')
          .style('font-size', '12px')
          .style('opacity', 0)
          .text(`Filtered to show "${category}" events. Click again to clear.`);
          
        notification.transition()
          .duration(300)
          .style('opacity', 1)
          .transition()
          .delay(2500)
          .duration(500)
          .style('opacity', 0)
          .remove();
      };
      
      // Function to highlight all arcs of a specific category
      const highlightCategory = (category, highlight) => {
        // Skip highlighting if a filter is active
        if (activeFilter !== null && !highlight) return;
        
        // Get all pie slices
        svg.selectAll('.category-slice')
          .each(function(d) {
            if (d && d.data && d.depth === 2) {
              // If this slice belongs to the hovered/active category, highlight it
              if (d.data.name === category) {
                d3.select(this)
                  .transition().duration(200)
                  .style('opacity', highlight ? 1 : 0.8)
                  .style('stroke-width', highlight ? 2 : 1)
                  .attr('d', highlight ? 
                    arc.innerRadius(innerRadius).outerRadius(radius * 1.05) : 
                    arc.innerRadius(innerRadius).outerRadius(radius)
                  );
              } else if (highlight) {
                // Dim other categories
                d3.select(this)
                  .transition().duration(200)
                  .style('opacity', 0.4);
              } else if (activeFilter === null) {
                // Only restore appearance if no filter is active
                d3.select(this)
                  .transition().duration(200)
                  .style('opacity', 0.8)
                  .style('stroke-width', 1)
                  .attr('d', arc.innerRadius(innerRadius).outerRadius(radius));
              }
            }
          });
      };
      
      legendItems.forEach(category => {
        const legendItem = legendContainer.append('div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('margin-bottom', '4px')
          .style('cursor', 'pointer')
          .style('padding', '3px 5px')
          .style('border-radius', '4px')
          .style('transition', 'background-color 0.2s')
          .on('mouseover', function() {
            highlightCategory(category, true);
            d3.select(this).style('background-color', 'rgba(0,0,0,0.05)');
          })
          .on('mouseout', function() {
            highlightCategory(category, false);
            d3.select(this).style('background-color', 'transparent');
          })
          .on('click', () => showCategoryEvents(category));
          
        legendItem.append('div')
          .style('width', '12px')
          .style('height', '12px')
          .style('border-radius', '3px')
          .style('background-color', getCategoryColor(category))
          .style('margin-right', '6px');
          
        legendItem.append('div')
          .style('white-space', 'nowrap')
          .style('overflow', 'hidden')
          .style('text-overflow', 'ellipsis')
          .text(category);
      });
    }
  }

  // Main rendering function
  function update() {
    if (!events.length) return;
    
    // Clear timeline and remove any existing life label containers
    d3.select(timelineDiv).selectAll('*').remove();
    d3.select(timelineMonths).selectAll('*').remove();
    
    // Clear any existing life labels container
    const existingLabelsContainer = document.querySelector('.life-labels-container');
    if (existingLabelsContainer) {
      existingLabelsContainer.remove();
    }
    
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
    
    // Update parent event dropdown - only show parent events or potential parents
    parentInput.innerHTML = '<option value="">None</option>';
    const potentialParents = events.filter(ev => 
      ev.type === 'range' && (ev.isParent || !ev.parent)
    );
    
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
    
    // Group events by category
    const eventsByCategory = groupByCategory(events);
    
    // Calculate row positions for range events in each category
    Object.keys(eventsByCategory).forEach(category => {
      const categoryEvents = eventsByCategory[category].filter(e => e.type === 'range');
      const sortedEvents = sortByDate(categoryEvents);
      
      sortedEvents.forEach(event => {
        event.row = calculateEventRow(event, categoryEvents);
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
        yearLabel.style.left = '50%';
        monthDiv.appendChild(yearLabel);
      }
      
      // Add month label (only for the first month of each quarter)
      if (month.getMonth() % 3 === 0 || index === 0 || index === months.length - 1) {
        const label = document.createElement('div');
        label.className = 'month-label';
        label.textContent = month.toLocaleDateString('en-US', { month: 'short' });
        label.style.left = '50%';
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
    
    // Create category rows
    Object.keys(eventsByCategory).forEach((category, categoryIndex) => {
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
            
            // Add debug information as data attributes
            eventDiv.setAttribute('data-start', validStart.toISOString());
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
          // Calculate valid position
          if (isNaN(event.start.getTime())) {
            console.error("Invalid date for milestone:", event.title, event.start);
            return; // Skip rendering this event
          }
          
          // Calculate position for milestone - ensure it's properly placed on the timeline
          leftPosition = calculatePosition(event.start, startDate, endDate);
          
          // Create container for milestone and its actions - positioned at the bottom of the row
          const milestoneContainer = document.createElement('div');
          milestoneContainer.className = 'milestone-container';
          milestoneContainer.style.position = 'absolute';
          milestoneContainer.style.left = `${leftPosition}%`;
          milestoneContainer.style.bottom = '5px'; // Position at the bottom of the row
          milestoneContainer.style.transform = 'translateX(-50%)'; // Center the milestone on the exact date
          milestoneContainer.style.zIndex = '5';
          milestoneContainer.style.cursor = 'pointer';
          milestoneContainer.style.display = 'flex'; // Force display flex
          
          // Create the milestone marker
          const markerDiv = document.createElement('div');
          markerDiv.className = 'milestone-marker';
          markerDiv.style.backgroundColor = event.color;
          markerDiv.style.display = 'block'; // Force display block
          milestoneContainer.appendChild(markerDiv);
          
          // Create action buttons container
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'milestone-actions';
          milestoneContainer.appendChild(actionsDiv);
          
          // Add edit button
          const editBtn = document.createElement('button');
          editBtn.className = 'action-button edit-button';
          editBtn.innerHTML = '✎';
          editBtn.title = 'Edit';
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            editEvent(event);
          });
          actionsDiv.appendChild(editBtn);
          
          // We're removing the delete button from the chart as requested
          // and only keeping it in the edit form
          
          // Add container to timeline
          timelineArea.appendChild(milestoneContainer);
          
          // Click handler for the milestone - with the same approach as the event click handler
          milestoneContainer.addEventListener('mousedown', (e) => {
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
                editEvent(d); // Use the event data "d" instead of the DOM event "event"
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
          
          // Tooltip for milestone
          milestoneContainer.addEventListener('mouseenter', () => {
            tooltip
              .style('opacity', 1)
              .style('display', 'block')
              .html(`
                <div class="font-medium">${event.title}</div>
                <div>${formatDate(event.start)}</div>
                ${event.metadata ? `<div class="text-gray-300 mt-1">${event.metadata}</div>` : ''}
              `);
          });
          
          markerDiv.addEventListener('mousemove', (e) => {
            tooltip
              .style('left', `${e.pageX + 10}px`)
              .style('top', `${e.pageY + 10}px`);
          });
          
          markerDiv.addEventListener('mouseleave', () => {
            tooltip.style('opacity', 0);
          });
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
        todayLabel.style.transform = 'translate(-50%, 0) rotate(45deg)';
        
        // Add a debug marker to the exact position
        todayLabel.setAttribute('data-marker', 'today');
        
        // Styling
        todayLabel.style.backgroundColor = '#22c55e';
        todayLabel.style.fontWeight = 'bold';
        
        // Add to the labels container
        labelsContainer.appendChild(todayLabel);
        
        // Force consistent transform for proper alignment
        setTimeout(() => {
          todayLabel.style.transform = 'translate(-50%, 0) rotate(45deg)';
          todayLabel.style.transformOrigin = 'top center';
        }, 50);
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
        labelDiv.style.transform = 'translate(-50%, 0) rotate(45deg)';
        
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
        
        // We'll apply transform consistently via CSS only
        // No inline transform styling needed - CSS class handles it
        
        // Add the label to the container
        labelsContainer.appendChild(labelDiv);
        
        // Force consistent transform for proper alignment
        setTimeout(() => {
          labelDiv.style.transform = 'translate(-50%, 0) rotate(45deg)';
          labelDiv.style.transformOrigin = 'top center';
        }, 50);
        
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
    renderWorldHeatmap(events, [startDate, endDate]);
    renderNestedPieChart(events, [startDate, endDate]);
    
    // Initialize zoom and pan functionality
    initializeZoomAndPan(timelineDiv, startDate, endDate);
  }
  
  // Easing functions for smoother animations
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }
  
  function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }
  
  // Enhanced animation system using requestAnimationFrame with direct DOM manipulation for smoother animations
  class SmoothAnimation {
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
  
  // Initialize zoom and pan functionality
  function initializeZoomAndPan(container, initialStartDate, initialEndDate) {
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
      
      // CRITICAL FIX: Add zoom controls directly to the DOM, not depending on container
      const zoomControlsContainer = document.createElement('div');
      zoomControlsContainer.id = 'timeline-zoom-controls'; // Add ID for easier selection
      zoomControlsContainer.className = 'zoom-controls';
      
      // Force inline styles to ensure visibility - position INSIDE timeline
      zoomControlsContainer.style.display = 'flex';
      zoomControlsContainer.style.flexDirection = 'column';
      zoomControlsContainer.style.position = 'fixed'; // Use fixed positioning for consistent location
      zoomControlsContainer.style.top = 'auto'; // Clear top position
      zoomControlsContainer.style.bottom = '30px'; // Position at bottom for better visibility
      zoomControlsContainer.style.right = '30px'; // Position from right edge
      zoomControlsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      zoomControlsContainer.style.padding = '8px';
      zoomControlsContainer.style.borderRadius = '8px';
      zoomControlsContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
      zoomControlsContainer.style.zIndex = '1000'; // Higher z-index to ensure visibility
      
      // Add directly to the timeline container for proper positioning
      // Find the timeline-container element for better positioning
      const timelineContainer = document.getElementById('timeline-container');
      if (timelineContainer) {
        timelineContainer.appendChild(zoomControlsContainer);
      } else {
        // Fallback to the original container if timeline-container not found
        container.appendChild(zoomControlsContainer);
      }
      
      // Mark that controls have been added
      state.zoomControlsAdded = true;
      
      // Zoom in button
      const zoomInBtn = document.createElement('button');
      zoomInBtn.className = 'zoom-button';
      zoomInBtn.innerHTML = '+';
      zoomInBtn.title = 'Zoom In';
      zoomInBtn.addEventListener('click', () => handleZoom(0.7));
      zoomControlsContainer.appendChild(zoomInBtn);
      
      // Zoom out button
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.className = 'zoom-button';
      zoomOutBtn.innerHTML = '−'; // Using proper minus sign
      zoomOutBtn.title = 'Zoom Out';
      zoomOutBtn.addEventListener('click', () => handleZoom(1.4));
      zoomControlsContainer.appendChild(zoomOutBtn);
      
      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.className = 'zoom-button reset-button';
      resetBtn.innerHTML = '↺'; // Reset icon
      resetBtn.title = 'Reset View';
      resetBtn.addEventListener('click', resetView);
      zoomControlsContainer.appendChild(resetBtn);
    }
    
    // Handle manual zoom with buttons using the SmoothAnimation system
    function handleZoom(factor) {
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
      
      // Use the new animation system for smooth transition
      new SmoothAnimation({
        duration: 700, // Slightly longer for smoother zoom
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
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          
          // Only do full visual updates on certain progress points
          const updatePoints = [0, 0.25, 0.5, 0.75, 0.9, 1];
          const nearestPoint = updatePoints.find(point => 
            Math.abs(progress - point) < 0.05
          );
          
          if (nearestPoint !== undefined) {
            update();
          }
        },
        onComplete: () => {
          // Final update with exact target dates
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          update();
          state.isZooming = false;
        }
      }).start();
    }
    
    // Reset to original view using the SmoothAnimation system
    function resetView() {
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
      
      // Use the new animation system for smooth reset
      new SmoothAnimation({
        duration: 800, // Slightly longer for more dramatic 'reset' feel
        easing: easeOutQuint, // Different easing for reset - feels more natural
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
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          
          // Use strategic update points for better performance
          const updatePoints = [0, 0.2, 0.4, 0.6, 0.8, 1];
          const nearestPoint = updatePoints.find(point => 
            Math.abs(progress - point) < 0.05
          );
          
          if (nearestPoint !== undefined) {
            update();
          }
        },
        onComplete: () => {
          // Final update with exact target dates
          // Update the local state
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          state.isZoomed = false;
          
          // Update the global timeline state
          if (window.timelineState) {
            window.timelineState.currentStartDate = new Date(newStart);
            window.timelineState.currentEndDate = new Date(newEnd);
            window.timelineState.isZoomed = false;
          }
          
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          update();
          state.isZooming = false;
        }
      }).start();
    }
    
    // Update date range and redraw timeline
    function updateDateRange(newStart, newEnd) {
      state.currentStartDate = newStart;
      state.currentEndDate = newEnd;
      state.isZoomed = true; // Mark as zoomed so update() will use these dates
      
      // Update the UI with new date range
      currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      
      // Recreate the timeline with the new date range
      update();
    }
    
    // Add scroll wheel zoom with smoother animation
    let zoomTimeout = null;
    let pendingZoom = null;
    let lastWheelTime = 0;
    
    // Function to process zoom events using the SmoothAnimation system
    function processZoom(event) {
      if (state.isZooming) return;
      state.isZooming = true;
      
      // Determine direction and create zoom factor
      const direction = event.deltaY < 0 ? -1 : 1;
      // Use more subtle zoom factor for smoother zooming
      const factor = direction < 0 ? 0.9 : 1.1;  // Slightly more pronounced for better feedback
      
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
        currentMonthDisplay.textContent = `${formatMonth(newStart)} - ${formatMonth(newEnd)}`;
        
        // Use the smooth animation system
        new SmoothAnimation({
          duration: 500, // Shorter for wheel zoom to feel responsive
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
            
            // Always update month display
            currentMonthDisplay.textContent = `${formatMonth(interpolatedStart)} - ${formatMonth(interpolatedEnd)}`;
            
            // Only update the full UI at strategic points
            if (progress === 0 || progress === 1 || progress >= 0.5) {
              update();
            }
          },
          onComplete: () => {
            // Final update
            state.currentStartDate = newStart;
            state.currentEndDate = newEnd;
            update();
            state.isZooming = false;
          }
        }).start();
      } else {
        state.isZooming = false;
      }
    }
    
    // Add wheel event listener
    container.addEventListener('wheel', function(event) {
      event.preventDefault();
      
      // Don't handle events during an update if we're already in the middle of a zoom animation
      if (state.isZooming && !pendingZoom) return;
      
      // Throttle wheel events to improve performance
      const now = Date.now();
      if (now - lastWheelTime < 16) { // 60fps max
        if (pendingZoom) {
          // Update pending zoom parameters based on new wheel event
          pendingZoom.deltaY += event.deltaY;
        } else {
          // Create a new pending zoom
          pendingZoom = {
            deltaY: event.deltaY,
            clientX: event.clientX
          };
        }
        
        // Clear any existing timeout
        if (zoomTimeout) {
          clearTimeout(zoomTimeout);
        }
        
        // Set a new timeout to process the zoom after a short delay
        zoomTimeout = setTimeout(() => {
          processZoom(pendingZoom);
          pendingZoom = null;
          zoomTimeout = null;
        }, 50); // 50ms delay for better performance
        
        return;
      }
      
      lastWheelTime = now;
      processZoom(event);
    }, { passive: false });
    
    // Handle drag to pan with smooth animation
    let dragStartX = 0;
    let dragStartTime = 0;
    let isDraggingStarted = false;
    let activeDragAnimation = null;
    let lastDragVelocity = 0;
    let lastDragTime = 0;
    let dragPositions = [];
    
    container.addEventListener('mousedown', function(event) {
      const containerRect = container.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      
      // Only start dragging if mouse is in the timeline area (not on category labels)
      if (mouseX > 180) {
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
        container.style.cursor = 'grabbing';
        
        // Prevent text selection during drag
        event.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', function(event) {
      if (!state.isDragging) return;
      
      // Process the mouse movement
      const currentX = event.clientX;
      const currentTime = performance.now();
      const deltaX = currentX - dragStartX;
      
      // Record position for velocity calculation
      dragPositions.push({x: currentX, time: currentTime});
      // Keep only the last 5 positions for velocity calculation
      if (dragPositions.length > 5) {
        dragPositions.shift();
      }
      
      // Map the pixel drag distance to a date range shift
      const containerRect = container.getBoundingClientRect();
      const effectiveWidth = containerRect.width - 180; // Adjust for category label width
      const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
      const millisPerPixel = dateRangeMillis / effectiveWidth;
      
      // Calculate the shift based on the mouse movement, but with a dynamic damping factor
      // that scales with zoom level (the more zoomed in, the less dampening needed)
      
      // Calculate zoom level based on date range (in days)
      const dateRangeInDays = dateRangeMillis / (1000 * 60 * 60 * 24);
      
      // Damping factor is stronger when zoomed out (viewing years), gentler when zoomed in (viewing days)
      // Base damping of 0.3 at medium zoom level, adjusted by zoom factor
      const zoomFactor = Math.min(1, Math.max(0.1, 180 / dateRangeInDays));
      const damping = 0.3 * zoomFactor; // Stronger damping (slower) for zoomed out view
      
      const shift = deltaX * millisPerPixel * -1 * damping;
      
      // Update dates based on the shift
      const newStartDate = new Date(state.currentStartDate.getTime() + shift);
      const newEndDate = new Date(state.currentEndDate.getTime() + shift);
      
      // Store the original state if this is the start of a drag operation
      if (dragPositions.length <= 1) {
        // Save the initial dates for this drag operation
        window.dragInitialState = {
          startDate: new Date(state.currentStartDate),
          endDate: new Date(state.currentEndDate),
          timeStamp: performance.now()
        };
      }
      
      // Update state directly for real-time responsiveness during drag
      state.currentStartDate = newStartDate;
      state.currentEndDate = newEndDate;
      
      // Update the header display for responsiveness
      currentMonthDisplay.textContent = `${formatMonth(newStartDate)} - ${formatMonth(newEndDate)}`;
      
      // Update the dragStartX for the next movement
      dragStartX = currentX;
      
      // Important: Store the updated state in the global state object explicitly
      window.timelineState.currentStartDate = newStartDate;
      window.timelineState.currentEndDate = newEndDate;
      
      // Use direct DOM manipulation for smoother dragging
      // Instead of full redraws, move elements directly
      moveTimelineElements(shift);
      
      // Less frequent full updates to improve dragging performance
      const now = performance.now();
      if (now - lastDragTime > 100) { // Reduced update frequency for smoother dragging
        requestAnimationFrame(() => {
          // Only update month separators and events - not the entire chart
          moveTimelineElements(shift);
          lastDragTime = now;
        });
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (state.isDragging) {
        const releaseTime = performance.now();
        state.isDragging = false;
        isDraggingStarted = false;
        container.style.cursor = 'grab';
        
        // Important: Ensure the timeline state object is updated
        if (window.timelineState) {
          // Mark as zoomed so the current dates will be used
          window.timelineState.isZoomed = true;
          
          // Make sure the timeline state matches our current state
          window.timelineState.currentStartDate = new Date(state.currentStartDate);
          window.timelineState.currentEndDate = new Date(state.currentEndDate);
        }
        
        // Calculate velocity for momentum effect
        let velocity = 0;
        
        // Use the last few positions to calculate a more accurate velocity
        if (dragPositions.length >= 2) {
          // Get the last 5 positions or all if less than 5
          const positionsToConsider = Math.min(5, dragPositions.length);
          const recentPositions = dragPositions.slice(-positionsToConsider);
          
          // Calculate the total distance and time
          const firstPos = recentPositions[0];
          const lastPos = recentPositions[recentPositions.length - 1];
          const totalDeltaX = lastPos.x - firstPos.x;
          const totalDeltaTime = lastPos.time - firstPos.time;
          
          if (totalDeltaTime > 0) {
            velocity = totalDeltaX / totalDeltaTime; // pixels per millisecond
          }
        }
        
        // Get current dates before animation
        const currentStart = new Date(state.currentStartDate);
        const currentEnd = new Date(state.currentEndDate);
        
        // Apply momentum if there's enough velocity
        if (Math.abs(velocity) > 0.05) { // Lower threshold for smoother experience
          const containerRect = container.getBoundingClientRect();
          const effectiveWidth = containerRect.width - 180;
          const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
          const millisPerPixel = dateRangeMillis / effectiveWidth;
          
          // Calculate momentum distance with dynamic damping based on zoom level
          
          // Calculate zoom level based on date range (in days)
          const dateRangeInDays = dateRangeMillis / (1000 * 60 * 60 * 24);
          
          // Apply the same zoom-based damping to momentum as we do to drag
          const zoomFactor = Math.min(1, Math.max(0.1, 180 / dateRangeInDays));
          const momentumDamping = 0.3 * zoomFactor; // Stronger damping (slower) when zoomed out
          
          const momentumDistance = velocity * 400 * momentumDamping; // Apply zoom-adjusted damping
          
          // Convert to date shift
          const momentumShift = momentumDistance * millisPerPixel * -1;
          
          // Calculate target dates after momentum
          const targetStartDate = new Date(state.currentStartDate.getTime() + momentumShift);
          const targetEndDate = new Date(state.currentEndDate.getTime() + momentumShift);
          
          // Don't do a full update before starting animation to prevent "reset" feeling
          
          // CRITICAL FIX: Store the current date range to ensure it doesn't reset
          const dragStartDate = new Date(state.currentStartDate);
          const dragEndDate = new Date(state.currentEndDate);
          
          // Start momentum animation from the current position
          
          // Start momentum animation with smoother easing
          activeDragAnimation = new SmoothAnimation({
            duration: 800, // Slightly longer for more natural deceleration
            easing: t => 1 - Math.pow(1 - t, 4), // Quartic ease-out for smoother momentum
            targetFPS: 60, // Higher frame rate for smoother animation
            onUpdate: (progress) => {
              // Calculate interpolated dates using the CURRENT position as the starting point
              const startDiff = targetStartDate.getTime() - dragStartDate.getTime();
              const endDiff = targetEndDate.getTime() - dragEndDate.getTime();
              
              const interpolatedStart = new Date(dragStartDate.getTime() + startDiff * progress);
              const interpolatedEnd = new Date(dragEndDate.getTime() + endDiff * progress);
              
              // Update state with interpolated dates
              state.currentStartDate = interpolatedStart;
              state.currentEndDate = interpolatedEnd;
              
              // Always update the month indicator
              currentMonthDisplay.textContent = `${formatMonth(interpolatedStart)} - ${formatMonth(interpolatedEnd)}`;
              
              // Use direct DOM manipulation for most of the animation and do a full update near the end
              if (progress < 0.9) {
                // For smoother animation, calculate the incremental shift since last frame
                const totalShift = startDiff * progress;
                const frameShift = totalShift / 10; // Small incremental shift
                
                // Update a subset of DOM elements for better performance
                if (progress % 0.1 < 0.02) {
                  moveTimelineElements(frameShift);
                }
              } else {
                // Near the end, do a full update for accuracy
                update();
              }
            },
            onComplete: () => {
              // Final update to ensure everything is properly positioned
              state.currentStartDate = targetStartDate;
              state.currentEndDate = targetEndDate;
              
              // CRITICAL: Update the timeline state object to persist the changes
              if (window.timelineState) {
                window.timelineState.currentStartDate = new Date(targetStartDate);
                window.timelineState.currentEndDate = new Date(targetEndDate);
                window.timelineState.isZoomed = true;
              }
              
              // Force a full update at the end to ensure consistency
              update();
              activeDragAnimation = null;
            }
          }).start();
        } else {
          // If no momentum, just apply the current position directly
          const finalStartDate = new Date(state.currentStartDate);
          const finalEndDate = new Date(state.currentEndDate);
          
          // No momentum, maintain current position
          
          // Short animation to settle
          activeDragAnimation = new SmoothAnimation({
            duration: 50, // Very short
            easing: t => t, // Linear for short animation
            onUpdate: (progress) => {
              // Don't change the dates, just update visuals
              if (progress >= 0.5) {
                update();
              }
            },
            onComplete: () => {
              // Ensure state is still pointing to the correct dates
              state.currentStartDate = finalStartDate;
              state.currentEndDate = finalEndDate;
              
              // CRITICAL: Update the timeline state object to persist the changes
              if (window.timelineState) {
                window.timelineState.currentStartDate = new Date(finalStartDate);
                window.timelineState.currentEndDate = new Date(finalEndDate);
                window.timelineState.isZoomed = true;
              }
              
              update();
              activeDragAnimation = null;
            }
          }).start();
        }
        
        // Clear tracking
        dragPositions = [];
      }
    });
    
    // Add CSS for proper cursor
    container.style.cursor = 'grab';
    
    // Function to efficiently move timeline elements without full redraw
    function moveTimelineElements(shift) {
      // Calculate the visual shift as percentage
      const containerRect = container.getBoundingClientRect();
      const effectiveWidth = containerRect.width - 180;
      const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
      
      // Calculate shift percentage once for all elements
      const shiftPercentage = (shift / dateRangeMillis) * 100;
      
      // Move all event elements and lifelines using percentage-based positioning
      document.querySelectorAll('.timeline-event, .life-line, .milestone-container').forEach(el => {
        const currentLeft = parseFloat(el.style.left) || 0;
        el.style.left = `${currentLeft - shiftPercentage}%`;
      });
      
      // Move month markers
      document.querySelectorAll('.month-marker').forEach(el => {
        const currentLeft = parseFloat(el.style.left) || 0;
        el.style.left = `${currentLeft - shiftPercentage}%`;
      });
      
      // Move life labels below the chart - keep them aligned with their life-lines
      document.querySelectorAll('.life-label.below-chart').forEach(el => {
        // Update the left position to keep the label centered under the line
        const currentLeft = parseFloat(el.style.left) || 0;
        el.style.left = `${currentLeft - shiftPercentage}%`;
        
        // Ensure transform is maintained for consistent appearance
        if (!el.style.transform.includes('translate(-50%, 0)')) {
          el.style.transform = 'translate(-50%, 0) rotate(45deg)';
        }
        
        // Keep transform origin consistent
        el.style.transformOrigin = 'top center';
      });
    }
  }
});