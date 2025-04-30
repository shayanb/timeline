// Interactive Timeline Script
document.addEventListener('DOMContentLoaded', () => {
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
  const importFile = document.getElementById('import-file');
  const importBtn = document.getElementById('import-btn');
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

  // Toggle end-date field based on event type
  typeInput.addEventListener('change', () => {
    if (typeInput.value === 'range') {
      endInput.disabled = false;
      endInput.setAttribute('required', '');
    } else {
      endInput.disabled = true;
      endInput.removeAttribute('required');
    }
  });

  // Import events via YAML file input (with category support)
  importFile.addEventListener('change', e => {
    const file = importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = jsyaml.load(reader.result);
        // Map imported events with properties
        // Process and convert the imported data
        events = data.map(ev => {
          const type = ev.type || (ev.life_event ? 'life' : 'range');
          const start = new Date(ev.start);
          const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
          const color = ev.color || randomColor();
          const metadata = ev.metadata || '';
          const category = ev.category || ev.parent || null;
          const place = ev.place || null;
          const isImportant = !!ev.isImportant;
          const categoryBgColor = ev.categoryBgColor || null;
          
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
          
          return { 
            id: nextId++, 
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
            categoryBgColor 
          };
        });
        
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

  // Export current events to YAML file (using latest data from the UI)
  exportButton.addEventListener('click', () => {
    // Ensure we have the latest data by recalculating rows before export
    Object.keys(groupByCategory(events)).forEach(category => {
      const categoryEvents = events.filter(e => (e.category || 'General') === category && e.type === 'range');
      const sortedEvents = sortByDate(categoryEvents);
      
      sortedEvents.forEach(event => {
        event.row = calculateEventRow(event, categoryEvents);
      });
    });
    
    const exportData = events.map(d => {
      const ev = { 
        title: d.title, 
        start: d.start.toISOString().slice(0, 10)
      };
      
      // Include custom ID if available
      if (d.eventId) {
        ev.id = d.eventId;
      }
      
      if (d.type === 'range') {
        ev.end = d.end.toISOString().slice(0, 10);
      }
      
      ev.type = d.type;
      
      if (d.color) ev.color = d.color;
      if (d.metadata) ev.metadata = d.metadata;
      if (d.category) ev.category = d.category;
      if (d.categoryBgColor) ev.categoryBgColor = d.categoryBgColor;
      if (d.isImportant) ev.isImportant = true;
      if (d.isParent) ev.isParent = true;
      
      // Include row position if specified
      if (d.row !== null && d.row !== undefined) {
        ev.row = d.row;
      }
      
      // Include parent reference (use string ID)
      if (d.parentId) {
        ev.parentId = d.parentId;
      } else if (d.parent) {
        // Try to find the parent's eventId
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Load predefined events from data/events.yaml
  fetch('data/events.yaml')
    .then(res => res.text())
    .then(text => {
      const data = jsyaml.load(text);
      const idMap = {}; // Map to store id-to-numeric id relationships
      
      // First pass: Load all events and keep track of their IDs
      data.forEach(ev => {
        const type = ev.type || (ev.life_event ? 'life' : 'range');
        const start = new Date(ev.start);
        const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
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
          location = {
            city: ev.location.city || '',
            country: ev.location.country || ''
          };
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
        row: null // Will be calculated during rendering
      });
    }
    
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
    
    // Set checkbox states
    if (window.$ && $.fn.checkbox) {
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
    } else {
      importantCheckbox.checked = !!d.isImportant;
      isParentCheckbox.checked = !!d.isParent;
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

  // Calculate position percentage for event placement
  function calculatePosition(date, startDate, endDate) {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const position = date.getTime() - startDate.getTime();
    return (position / totalDuration) * 100;
  }

  // Calculate width percentage for event
  function calculateWidth(startDate, endDate, timelineStart, timelineEnd) {
    // Adjust dates if they fall outside the timeline
    const effectiveStart = startDate < timelineStart ? timelineStart : startDate;
    const effectiveEnd = endDate > timelineEnd ? timelineEnd : endDate;
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const eventDuration = effectiveEnd.getTime() - effectiveStart.getTime();
    
    return (eventDuration / totalDuration) * 100;
  }

  // Sort events by date for better layout
  function sortByDate(events) {
    return [...events].sort((a, b) => a.start - b.start);
  }

  // Group events by category
  function groupByCategory(events) {
    const categories = {};
    
    // Add events without category to "General" category
    events.forEach(event => {
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
    return event1.start < event2.end && event2.start < event1.end;
  }

  // Calculate row for event to avoid overlaps
  function calculateEventRow(event, eventsInCategory) {
    if (!eventsInCategory || eventsInCategory.length === 0) return 0;
    
    const overlappingEvents = eventsInCategory.filter(e => 
      e.id !== event.id && 
      e.type === 'range' &&
      eventsOverlap(event, e)
    );
    
    if (overlappingEvents.length === 0) return 0;
    
    // Find the first available row
    let row = 0;
    let foundRow = false;
    
    while (!foundRow) {
      const eventsInThisRow = overlappingEvents.filter(e => e.row === row);
      if (eventsInThisRow.length === 0) {
        foundRow = true;
      } else {
        row++;
      }
    }
    
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
      
      // Default fallback for unknown cities
      "Unknown": [0, 0]
    };
    
    // Apply time domain filtering similar to pie chart
    const [startDomain, endDomain] = timeDomain || [new Date(0), new Date(Date.now() + 31536000000)]; // Default to all time if not specified
    
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
          // Calculate duration - adjusting for visible time range
          let days = 1; // Default for milestone/life events
          
          if (hasDuration) {
            // Calculate actual visible duration within the time domain
            const visibleStart = d.start < startDomain ? startDomain : d.start;
            const visibleEnd = d.end > endDomain ? endDomain : d.end;
            days = (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24);
          }
          
          // Add to country totals
          countryDurations[country] = (countryDurations[country] || 0) + days;
          
          // Track city data for this country
          if (!cityData[country]) {
            cityData[country] = {};
          }
          
          if (city) {
            cityData[country][city] = (cityData[country][city] || 0) + days;
            
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
                name: city || country,
                coordinates: coordinates,
                days: days,
                color: d.color || '#3B82F6',
                event: d.title,
                country: country
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

  // Render pie chart of time spent per category
  function renderNestedPieChart(events, timeDomain) {
    const container = d3.select('#nested-pie-chart');
    container.selectAll('*').remove();
    
    const [startDomain, endDomain] = timeDomain;
    
    // Filter range events within the time domain
    const filteredRanges = events.filter(d => 
      d.category && 
      d.end >= startDomain && 
      d.start <= endDomain &&
      d.type === 'range'
    );
    
    // Filter milestone events within the time domain
    const filteredMilestones = events.filter(d => 
      d.category && 
      d.start >= startDomain && 
      d.start <= endDomain &&
      d.type === 'milestone'
    );
    
    const durations = {};
    
    // Add range event durations
    filteredRanges.forEach(d => {
      const s = d.start < startDomain ? startDomain : d.start;
      const e = d.end > endDomain ? endDomain : d.end;
      const days = (e - s) / (1000 * 60 * 60 * 24);
      
      durations[d.category] = (durations[d.category] || 0) + days;
    });
    
    // Add 1% per milestone as requested (based on total days in the period)
    const totalPeriodDays = (endDomain - startDomain) / (1000 * 60 * 60 * 24);
    const milestoneValue = totalPeriodDays * 0.01; // 1% of the time period
    
    filteredMilestones.forEach(d => {
      durations[d.category] = (durations[d.category] || 0) + milestoneValue;
    });
    
    const data = Object.entries(durations).map(([key, value]) => ({ 
      category: key, 
      value 
    }));
    
    if (data.length === 0) {
      container.append('p')
        .attr('class', 'text-gray-500 text-center')
        .text('No category data in selected range.');
      return;
    }
    
    const width = container.node().clientWidth || 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;
    
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
    
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 0.8);
    
    const labelArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
    
    const arcs = pie(data);
    
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.category))
      .range(d3.schemeCategory10);
    
    // Render slices
    svg.selectAll('path')
      .data(arcs)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.category))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('transition', 'opacity 0.2s')
      .on('mouseover', function() {
        d3.select(this).style('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
      });
    
    // Add labels
    svg.selectAll('text')
      .data(arcs)
      .join('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(d => d.data.category);
    
    // Add values in center slices
    svg.selectAll('text.value')
      .data(arcs)
      .join('text')
      .attr('class', 'value')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'white')
      .text(d => Math.round(d.data.value) + 'd');
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
      
      // Today marker
      const today = new Date();
      if (today >= startDate && today <= endDate) {
        const todayPosition = calculatePosition(today, startDate, endDate);
        
        const todayMarker = document.createElement('div');
        todayMarker.className = 'today-marker';
        todayMarker.style.left = `${todayPosition}%`;
        timelineArea.appendChild(todayMarker);
      }
      
      // Render events in this category
      const categoryEvents = eventsByCategory[category];
      
      categoryEvents.forEach(event => {
        const leftPosition = calculatePosition(event.start, startDate, endDate);
        
        if (event.type === 'range') {
          const width = calculateWidth(event.start, event.end, startDate, endDate);
          const rowOffset = event.row * 40; // 40px per row
          
          // Create event element
          const eventDiv = document.createElement('div');
          eventDiv.className = 'timeline-event';
          eventDiv.style.left = `${leftPosition}%`;
          eventDiv.style.width = `${Math.max(0.5, width)}%`;
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
        } else if (event.type === 'life') {
          // Store life events to add them later across all categories
        } else if (event.type === 'milestone') {
          // Create container for milestone and its actions - positioned at the bottom of the row
          const milestoneContainer = document.createElement('div');
          milestoneContainer.className = 'milestone-container';
          milestoneContainer.style.position = 'absolute';
          milestoneContainer.style.left = `${leftPosition}%`;
          milestoneContainer.style.bottom = '5px'; // Position at the bottom of the row
          milestoneContainer.style.transform = 'translateX(-50%)'; // Only transform X, not Y
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
      lifeEventsContainer.style.position = 'absolute';
      lifeEventsContainer.style.top = '0';
      lifeEventsContainer.style.left = '180px'; // Same as category label width
      lifeEventsContainer.style.right = '0';
      lifeEventsContainer.style.bottom = '0';
      lifeEventsContainer.style.pointerEvents = 'none'; // Let clicks pass through
      lifeEventsContainer.style.zIndex = '15'; // Above regular events
      timelineDiv.appendChild(lifeEventsContainer);
      
      // Create a separate container for life event labels BELOW the chart
      const labelsContainer = document.createElement('div');
      labelsContainer.className = 'life-labels-container';
      labelsContainer.style.display = 'flex';
      labelsContainer.style.position = 'relative';
      labelsContainer.style.height = '80px'; // Even taller container to fully accommodate rotated labels
      labelsContainer.style.marginTop = '5px'; // Add a small gap between timeline and labels
      labelsContainer.style.paddingLeft = '180px'; // Align with timeline content
      labelsContainer.style.overflow = 'visible'; // Allow rotated labels to extend outside the container
      labelsContainer.style.zIndex = '20'; // Higher z-index to ensure visibility
      labelsContainer.style.width = '100%'; // Ensure the container spans the full width
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
      
      // Add each life event as a vertical line
      lifeEvents.forEach(event => {
        const leftPosition = calculatePosition(event.start, startDate, endDate);
        
        // Create full-height life event line
        const lineDiv = document.createElement('div');
        lineDiv.className = 'life-line';
        lineDiv.style.left = `${leftPosition}%`;
        lineDiv.style.backgroundColor = event.color;
        lineDiv.style.pointerEvents = 'auto'; // Make clickable
        lifeEventsContainer.appendChild(lineDiv);
        
        // Life event label BELOW the chart (rotated 45 degrees)
        const labelDiv = document.createElement('div');
        labelDiv.className = 'life-label below-chart';
        labelDiv.textContent = event.title;
        labelDiv.style.position = 'absolute';
        labelDiv.style.cursor = 'pointer';
        labelDiv.dataset.eventId = event.id; // Store event ID in data attribute
        
        // Give the label the same background color as the line
        labelDiv.style.backgroundColor = event.color;
        labelDiv.style.color = 'white'; // White text for better contrast
        
        // Make sure the life event line and label are exactly aligned
        // Add event ID to the line for reference
        lineDiv.dataset.eventId = event.id;
        
        // First add the label to the DOM to make sure it's measured correctly
        labelsContainer.appendChild(labelDiv);
        
        // Then position it properly after a brief delay to ensure the DOM is updated
        setTimeout(() => {
          // Get the offsetLeft of the corresponding life-line to align them exactly
          const lineRect = lineDiv.getBoundingClientRect();
          const containerRect = labelsContainer.getBoundingClientRect();
          
          // Calculate the position to be aligned with the life-line
          // Adjust for the category label width and position it centered on the life-line
          const labelRect = labelDiv.getBoundingClientRect();
          const labelWidth = labelRect.width;
          const lineWidth = lineRect.width;
          
          // Position the label top-left corner directly under the center of the life-line
          // For rotated labels, we want to position differently than for centered labels
          const lineCenter = (lineRect.left - containerRect.left) + (lineWidth / 2);
          const labelPosition = lineCenter; // Position top-left at line center
          
          // Update the label position - ensure it's not positioned off-screen to the left
          labelDiv.style.left = `${Math.max(0, labelPosition)}px`;
        }, 0);
        
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
      
      // Move all event elements and lifelines
      document.querySelectorAll('.timeline-event, .life-line, .milestone-container').forEach(el => {
        const currentLeft = parseFloat(el.style.left) || 0;
        // Adjust position based on shift but convert to percentage
        const shiftPercentage = (shift / dateRangeMillis) * 100;
        el.style.left = `${currentLeft - shiftPercentage}%`;
      });
      
      // Move month markers
      document.querySelectorAll('.month-marker').forEach(el => {
        const currentLeft = parseFloat(el.style.left) || 0;
        const shiftPercentage = (shift / dateRangeMillis) * 100;
        el.style.left = `${currentLeft - shiftPercentage}%`;
      });
      
      // Move life labels in the separate container
      document.querySelectorAll('.life-label.below-chart').forEach(el => {
        // For absolutely positioned elements with pixel values
        if (el.style.left.endsWith('px')) {
          const currentLeft = parseFloat(el.style.left) || 0;
          const pixelShift = (shift / dateRangeMillis) * effectiveWidth;
          el.style.left = `${currentLeft - pixelShift}px`;
        } 
        // For percentage-based positioning
        else {
          const currentLeft = parseFloat(el.style.left) || 0;
          const shiftPercentage = (shift / dateRangeMillis) * 100;
          el.style.left = `${currentLeft - shiftPercentage}%`;
        }
      });
    }
  }
});