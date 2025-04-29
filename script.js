// Interactive Timeline Script
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Semantic UI components
  if (window.$ && $.fn.dropdown) {
    $('.ui.dropdown').dropdown();
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
    categoryInput.value = '';
    submitBtn.textContent = 'Add Event';
    cancelBtn.style.display = '';
    formTitle.textContent = 'Add New Event';
    if (window.$ && $.fn.checkbox) {
      $('#important').checkbox('uncheck');
    } else {
      importantCheckbox.checked = false;
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
        events = data.map(ev => {
          const type = ev.type || (ev.life_event ? 'life' : 'range');
          const start = new Date(ev.start);
          const end = (type === 'range') ? new Date(ev.end || ev.start) : new Date(ev.start);
          const color = ev.color || randomColor();
          const metadata = ev.metadata || '';
          const category = ev.category || ev.parent || null;
          const place = ev.place || null;
          const isImportant = !!ev.isImportant;
          return { 
            id: nextId++, 
            title: ev.title, 
            start, 
            end, 
            type, 
            color, 
            metadata, 
            category, 
            place, 
            isImportant 
          };
        });
        
        update();
        colorInput.value = randomColor();
      } catch (err) {
        alert('Error parsing YAML: ' + err);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // Export current events to YAML file
  exportButton.addEventListener('click', () => {
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
    const category = categoryInput.value ? categoryInput.value : null;
    const isImportant = importantCheckbox.checked;
    const isParent = isParentCheckbox.checked;
    const customEventId = eventIdInput.value.trim();
    
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
    const country = countryInput.value.trim();
    const location = (city || country) ? { city, country } : null;
    
    if (type === 'range' && end < start) {
      alert('End date must be on or after start date');
      return;
    }
    
    if (editingId) {
      // Update existing event
      const ev = events.find(ev => ev.id === editingId);
      if (ev) {
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
    categoryInput.value = d.category || '';
    parentInput.value = d.parent || '';
    eventIdInput.value = d.eventId || '';
    
    // Set location data
    if (d.location) {
      cityInput.value = d.location.city || '';
      countryInput.value = d.location.country || '';
    } else {
      cityInput.value = '';
      countryInput.value = '';
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

  // Render world heatmap
  function renderWorldHeatmap(events) {
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
    // Also track cities for tooltips
    const cityData = {};
    
    events.forEach(d => {
      if (d.end > d.start) {
        let country = null;
        let city = null;
        
        // Try to get location from the location structure
        if (d.location && d.location.country) {
          country = d.location.country;
          city = d.location.city || '';
        } 
        // Fallback to legacy place field
        else if (d.place) {
          country = d.place;
        }
        
        if (country) {
          const days = (d.end - d.start) / (1000 * 60 * 60 * 24);
          
          // Add to country totals
          countryDurations[country] = (countryDurations[country] || 0) + days;
          
          // Track city data for this country
          if (!cityData[country]) {
            cityData[country] = {};
          }
          
          if (city) {
            cityData[country][city] = (cityData[country][city] || 0) + days;
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
    
    // Add a title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Time Spent by Country');
    
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
    const filtered = events.filter(d => 
      d.category && 
      d.end >= startDomain && 
      d.start <= endDomain &&
      d.type === 'range'
    );
    
    const durations = {};
    filtered.forEach(d => {
      const s = d.start < startDomain ? startDomain : d.start;
      const e = d.end > endDomain ? endDomain : d.end;
      const days = (e - s) / (1000 * 60 * 60 * 24);
      
      durations[d.category] = (durations[d.category] || 0) + days;
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
    
    if (window.timelineState && window.timelineState.isZoomed) {
      // Use the stored zoom state if available
      startDate = window.timelineState.currentStartDate;
      endDate = window.timelineState.currentEndDate;
    } else {
      // Ensure reasonable padding for initial view
      startDate = new Date(minTime);
      startDate.setMonth(startDate.getMonth() - 1);
      
      endDate = new Date(maxTime);
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Initialize timeline state if it doesn't exist
      if (!window.timelineState) {
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
      }
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
          
          // Delete button
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'action-button delete-button';
          deleteBtn.innerHTML = '✕';
          deleteBtn.title = 'Delete';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(event.id);
          });
          actionsDiv.appendChild(deleteBtn);
          
          // Click handler for entire event
          eventDiv.addEventListener('click', () => {
            editEvent(event);
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
          // Create container for milestone and its actions
          const milestoneContainer = document.createElement('div');
          milestoneContainer.className = 'milestone-container';
          milestoneContainer.style.position = 'absolute';
          milestoneContainer.style.left = `${leftPosition}%`;
          milestoneContainer.style.top = '50%';
          milestoneContainer.style.transform = 'translate(-50%, -50%)';
          milestoneContainer.style.zIndex = '5';
          milestoneContainer.style.cursor = 'pointer';
          
          // Create the milestone marker
          const markerDiv = document.createElement('div');
          markerDiv.className = 'milestone-marker';
          markerDiv.style.backgroundColor = event.color;
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
            editEvent(event);
          });
          actionsDiv.appendChild(editBtn);
          
          // Add delete button
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'action-button delete-button';
          deleteBtn.innerHTML = '✕';
          deleteBtn.title = 'Delete';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(event.id);
          });
          actionsDiv.appendChild(deleteBtn);
          
          // Add container to timeline
          timelineArea.appendChild(milestoneContainer);
          
          // Click handler for the milestone
          milestoneContainer.addEventListener('click', () => {
            editEvent(event);
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
      labelsContainer.style.height = '30px';
      labelsContainer.style.marginTop = '10px';
      labelsContainer.style.paddingLeft = '180px'; // Align with timeline content
      labelsContainer.style.borderTop = '1px dashed #ccc';
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
        
        // Create life event line
        const lineDiv = document.createElement('div');
        lineDiv.className = 'life-line';
        lineDiv.style.left = `${leftPosition}%`;
        lineDiv.style.backgroundColor = event.color;
        lineDiv.style.pointerEvents = 'auto'; // Make clickable
        lifeEventsContainer.appendChild(lineDiv);
        
        // Life event label BELOW the chart
        const labelDiv = document.createElement('div');
        labelDiv.className = 'life-label below-chart';
        labelDiv.textContent = event.title;
        labelDiv.style.left = `${leftPosition}%`;
        labelDiv.style.color = event.color;
        labelDiv.style.position = 'absolute';
        labelDiv.style.top = '5px';
        labelDiv.style.transform = 'translateX(-50%)';
        labelDiv.style.cursor = 'pointer';
        labelDiv.dataset.eventId = event.id; // Store event ID in data attribute
        labelsContainer.appendChild(labelDiv);
        
        // Click handler
        lineDiv.dataset.eventId = event.id; // Store event ID in data attribute
        lineDiv.addEventListener('click', () => {
          editEvent(event);
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
    
    // Render charts
    renderWorldHeatmap(events);
    renderNestedPieChart(events, [startDate, endDate]);
    
    // Initialize zoom and pan functionality
    initializeZoomAndPan(timelineDiv, startDate, endDate);
  }
  
  // Easing function for smoother animations
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
      
      // Add zoom controls
      const zoomControlsContainer = document.createElement('div');
      zoomControlsContainer.id = 'timeline-zoom-controls'; // Add ID for easier selection
      zoomControlsContainer.className = 'zoom-controls';
      zoomControlsContainer.style.display = 'flex';
      zoomControlsContainer.style.justifyContent = 'center';
      zoomControlsContainer.style.marginTop = '10px';
      zoomControlsContainer.style.gap = '10px';
      container.parentNode.appendChild(zoomControlsContainer);
      
      // Mark that controls have been added
      state.zoomControlsAdded = true;
      
      // Zoom in button
      const zoomInBtn = document.createElement('button');
      zoomInBtn.className = 'ui mini button';
      zoomInBtn.innerHTML = '<i class="zoom-in">+</i>';
      zoomInBtn.addEventListener('click', () => handleZoom(0.7));
      zoomControlsContainer.appendChild(zoomInBtn);
      
      // Zoom out button
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.className = 'ui mini button';
      zoomOutBtn.innerHTML = '<i class="zoom-out">-</i>';
      zoomOutBtn.addEventListener('click', () => handleZoom(1.4));
      zoomControlsContainer.appendChild(zoomOutBtn);
      
      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.className = 'ui mini button';
      resetBtn.textContent = 'Reset View';
      resetBtn.addEventListener('click', resetView);
      zoomControlsContainer.appendChild(resetBtn);
    }
    
    // Handle manual zoom with buttons
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
      
      // Store old dates for animation
      const oldStart = new Date(state.currentStartDate);
      const oldEnd = new Date(state.currentEndDate);
      
      // Set up animation
      const totalFrames = 15;
      let currentFrame = 0;
      
      function animateZoom() {
        if (currentFrame >= totalFrames) {
          // Final update with exact target dates
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          update();
          state.isZooming = false;
          return;
        }
        
        // Calculate interpolated dates
        const progress = easeInOutCubic(currentFrame / totalFrames);
        const startDiff = newStart.getTime() - oldStart.getTime();
        const endDiff = newEnd.getTime() - oldEnd.getTime();
        
        const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
        const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
        
        // Update state and display
        state.currentStartDate = interpolatedStart;
        state.currentEndDate = interpolatedEnd;
        state.isZoomed = true;
        
        // Update the UI
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
        update();
        
        // Next frame
        currentFrame++;
        requestAnimationFrame(animateZoom);
      }
      
      // Start animation
      animateZoom();
    }
    
    // Reset to original view
    function resetView() {
      // Don't handle if already zooming
      if (state.isZooming) return;
      state.isZooming = true;
      
      // Store target (original) dates
      const newStart = new Date(state.originalStartDate);
      const newEnd = new Date(state.originalEndDate);
      
      // Store current dates for animation
      const oldStart = new Date(state.currentStartDate);
      const oldEnd = new Date(state.currentEndDate);
      
      // Set up animation
      const totalFrames = 15;
      let currentFrame = 0;
      
      function animateReset() {
        if (currentFrame >= totalFrames) {
          // Final update with exact target dates
          state.currentStartDate = newStart;
          state.currentEndDate = newEnd;
          state.isZoomed = false;
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          update();
          state.isZooming = false;
          return;
        }
        
        // Calculate interpolated dates
        const progress = easeInOutCubic(currentFrame / totalFrames);
        const startDiff = newStart.getTime() - oldStart.getTime();
        const endDiff = newEnd.getTime() - oldEnd.getTime();
        
        const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
        const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
        
        // Update state and display
        state.currentStartDate = interpolatedStart;
        state.currentEndDate = interpolatedEnd;
        
        // Update the UI
        currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
        update();
        
        // Next frame
        currentFrame++;
        requestAnimationFrame(animateReset);
      }
      
      // Start animation
      animateReset();
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
    container.addEventListener('wheel', function(event) {
      event.preventDefault();
      
      // Don't handle events during an update
      if (state.isZooming) return;
      state.isZooming = true;
      
      // Determine direction and create zoom factor
      const direction = event.deltaY < 0 ? -1 : 1;
      const factor = direction < 0 ? 0.9 : 1.1; // Gentler zoom factors for smoother zoom
      
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
        
        // Calculate new date range with smoothing
        const newRange = totalTime * factor;
        const newStart = new Date(zoomCenterDate.getTime() - newRange * mousePosition);
        const newEnd = new Date(zoomCenterDate.getTime() + newRange * (1 - mousePosition));
        
        // Get current dates for animation
        const oldStart = new Date(state.currentStartDate);
        const oldEnd = new Date(state.currentEndDate);
        
        // Set up animation
        const totalFrames = 15; // More frames for smoother animation
        let currentFrame = 0;
        
        function animateZoom() {
          if (currentFrame >= totalFrames) {
            // Final update with exact target dates
            state.currentStartDate = newStart;
            state.currentEndDate = newEnd;
            currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
            update();
            state.isZooming = false;
            return;
          }
          
          // Calculate interpolated dates
          const progress = easeInOutCubic(currentFrame / totalFrames);
          const startDiff = newStart.getTime() - oldStart.getTime();
          const endDiff = newEnd.getTime() - oldEnd.getTime();
          
          const interpolatedStart = new Date(oldStart.getTime() + startDiff * progress);
          const interpolatedEnd = new Date(oldEnd.getTime() + endDiff * progress);
          
          // Update state and display
          state.currentStartDate = interpolatedStart;
          state.currentEndDate = interpolatedEnd;
          state.isZoomed = true;
          
          // Update the UI
          currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
          update();
          
          // Next frame
          currentFrame++;
          requestAnimationFrame(animateZoom);
        }
        
        // Start animation
        animateZoom();
      } else {
        state.isZooming = false;
      }
    }, { passive: false });
    
    // Handle drag to pan
    let dragStartX = 0;
    let isDraggingStarted = false;
    let lastUpdateTime = 0;
    let accumulatedShift = 0;
    
    container.addEventListener('mousedown', function(event) {
      const containerRect = container.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      
      // Only start dragging if mouse is in the timeline area (not on category labels)
      if (mouseX > 180) {
        state.isDragging = true;
        isDraggingStarted = true;
        dragStartX = event.clientX;
        container.style.cursor = 'grabbing';
        accumulatedShift = 0;
        
        // Prevent text selection during drag
        event.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', function(event) {
      if (!state.isDragging) return;
      
      const now = Date.now();
      // Throttle updates for smoother performance (max 60fps)
      if (now - lastUpdateTime < 16) {
        // Just accumulate the shift without applying yet
        const deltaX = event.clientX - dragStartX;
        dragStartX = event.clientX;
        
        // Map the pixel drag distance to a date range shift
        const containerRect = container.getBoundingClientRect();
        const effectiveWidth = containerRect.width - 180; // Adjust for category label width
        const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
        const millisPerPixel = dateRangeMillis / effectiveWidth;
        
        // Accumulate shift
        accumulatedShift += deltaX * millisPerPixel * -1;
        return;
      }
      
      // Process the mouse movement
      const deltaX = event.clientX - dragStartX;
      dragStartX = event.clientX;
      
      // Map the pixel drag distance to a date range shift
      const containerRect = container.getBoundingClientRect();
      const effectiveWidth = containerRect.width - 180; // Adjust for category label width
      const dateRangeMillis = state.currentEndDate.getTime() - state.currentStartDate.getTime();
      const millisPerPixel = dateRangeMillis / effectiveWidth;
      
      // Add the new shift to any accumulated shift
      const shift = (deltaX * millisPerPixel * -1) + accumulatedShift;
      accumulatedShift = 0; // Reset accumulated shift
      
      // Move dates in the opposite direction of drag
      const newStartDate = new Date(state.currentStartDate.getTime() + shift);
      const newEndDate = new Date(state.currentEndDate.getTime() + shift);
      
      // Update dates and header display
      state.currentStartDate = newStartDate;
      state.currentEndDate = newEndDate;
      currentMonthDisplay.textContent = `${formatMonth(state.currentStartDate)} - ${formatMonth(state.currentEndDate)}`;
      
      // Only update the view if we've moved a significant amount to avoid flickering
      if (Math.abs(shift) > 5000) { // 5000ms = 5 seconds threshold
        update();
      }
      
      lastUpdateTime = now;
    });
    
    document.addEventListener('mouseup', function() {
      if (state.isDragging) {
        state.isDragging = false;
        isDraggingStarted = false;
        container.style.cursor = 'grab';
        
        // When released, make sure we do a final update
        update();
      }
    });
    
    // Add CSS for proper cursor
    container.style.cursor = 'grab';
  }
});