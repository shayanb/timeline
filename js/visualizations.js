/**
 * Timeline Visualizations Module
 * Comprehensive visualization components including world heatmap, nested pie charts,
 * geographic data visualization, chart tooltips, interactions, D3.js DOM manipulation,
 * data processing for visualizations, and color scales.
 */

import { 
  formatMonth, 
  normalizeCountryName 
} from './utils.js';

// =============================================================================
// GLOBAL VISUALIZATION VARIABLES
// =============================================================================

// World GeoJSON data for world heatmap visualization
let worldGeoJson = null;

// =============================================================================
// WORLD GEOJSON DATA LOADING
// =============================================================================

/**
 * Initialize world geographic data for heatmap visualization
 * @returns {Promise} Promise that resolves when world data is loaded
 */
export function initializeWorldData() {
  return d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    .then(data => { 
      worldGeoJson = data; 
      console.log('World GeoJSON data loaded successfully');
      return data;
    })
    .catch(error => {
      console.error('Failed to load world GeoJSON data:', error);
      return null;
    });
}

/**
 * Get the loaded world GeoJSON data
 * @returns {Object|null} World GeoJSON data or null if not loaded
 */
export function getWorldGeoJson() {
  return worldGeoJson;
}

// =============================================================================
// COLOR SCALES AND MAPPING UTILITIES
// =============================================================================

/**
 * Create a 3D shaded version of a color for enhanced visual effects
 * @param {string} baseColor - Base color in any valid CSS color format
 * @param {string} type - Type of shade: "darker", "lighter", or "default"
 * @returns {string} Modified color as RGB string
 */
export function create3DShade(baseColor, type) {
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
}

/**
 * Extract category color from events data with fallback
 * @param {string} categoryName - Name of the category
 * @param {Array} events - Array of events to search for category colors
 * @returns {string} Color hex/rgb string for the category
 */
export function getCategoryColor(categoryName, events) {
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

/**
 * Create color scale for locations/countries with vibrant, distinct colors
 * @param {Array} locationNames - Array of location names
 * @returns {d3.ScaleOrdinal} D3 ordinal color scale
 */
export function createLocationColorScale(locationNames) {
  return d3.scaleOrdinal()
    .domain(locationNames)
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
}

/**
 * Create category color scale from events data
 * @param {Array} categories - Array of category names
 * @param {Array} events - Array of events to extract colors from
 * @returns {d3.ScaleOrdinal} D3 ordinal color scale
 */
export function createCategoryColorScale(categories, events) {
  return d3.scaleOrdinal()
    .domain(categories)
    .range(categories.map(cat => getCategoryColor(cat, events)));
}

// =============================================================================
// CITY COORDINATES DATA
// =============================================================================

/**
 * Comprehensive list of world cities coordinates for geographic visualization
 */
export const CITY_COORDINATES = {
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

// =============================================================================
// DATA PROCESSING FOR VISUALIZATIONS
// =============================================================================

/**
 * Process events data for geographic visualization
 * @param {Array} events - Array of timeline events
 * @param {Array} timeDomain - [startDate, endDate] time domain filter
 * @returns {Object} Processed data with country durations, city data, and cities array
 */
export function processGeographicData(events, timeDomain) {
  const [startDomain, endDomain] = timeDomain || [new Date(0), new Date(Date.now() + 31536000000)];
  
  const countryDurations = {};
  const cityData = {};
  const cities = [];
  
  // Filter events within the time domain
  const filteredEvents = events.filter(d => {
    if (d.type === 'range') {
      return d.end >= startDomain && d.start <= endDomain;
    }
    return d.start >= startDomain && d.start <= endDomain;
  });
  
  filteredEvents.forEach(d => {
    const hasDuration = d.type === 'range' && d.end > d.start;
    const isSingleEvent = d.type === 'milestone' || d.type === 'life';
    
    if (hasDuration || isSingleEvent) {
      let country = null;
      let city = null;
      
      // Extract location information
      if (d.location) {
        if (typeof d.location === 'object') {
          country = d.location.country || null;
          city = d.location.city || '';
        } else if (typeof d.location === 'string') {
          country = d.location;
        }
      } else if (d.place) {
        country = d.place;
      }
      
      if (country) {
        const normalizedCountry = normalizeCountryName(country);
        
        // Calculate duration
        let days = 1; // Default for milestone/life events
        
        if (hasDuration) {
          const visibleStart = d.start < startDomain ? startDomain : d.start;
          const visibleEnd = d.end > endDomain ? endDomain : d.end;
          days = (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24);
        }
        
        // Add to country totals
        countryDurations[normalizedCountry] = (countryDurations[normalizedCountry] || 0) + days;
        
        // Track city data
        if (!cityData[normalizedCountry]) {
          cityData[normalizedCountry] = {};
        }
        
        if (city) {
          cityData[normalizedCountry][city] = (cityData[normalizedCountry][city] || 0) + days;
          
          // Add city coordinates
          const cityKey = city ? Object.keys(CITY_COORDINATES).find(
            key => key.toLowerCase() === city.toLowerCase()
          ) : null;
          
          const coordinates = cityKey ? CITY_COORDINATES[cityKey] : 
                             (CITY_COORDINATES[country] ? CITY_COORDINATES[country] : CITY_COORDINATES["Unknown"]);
          
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
            existingCity.days += days;
          }
        }
      }
    }
  });
  
  return { countryDurations, cityData, cities };
}

/**
 * Process events data for nested pie chart visualization
 * @param {Array} events - Array of timeline events
 * @param {Array} timeDomain - [startDate, endDate] time domain filter
 * @returns {Object} Hierarchical data structure for pie chart
 */
export function processNestedPieData(events, timeDomain) {
  const [startDomain, endDomain] = timeDomain;
  
  // Filter events within the time domain
  const filteredEvents = events.filter(d => 
    (d.type === 'range' ? 
      (d.end >= startDomain && d.start <= endDomain) : 
      (d.start >= startDomain && d.start <= endDomain))
  );
  
  if (filteredEvents.length === 0) {
    return null;
  }
  
  // Calculate weights for different event types
  const totalPeriodDays = (endDomain - startDomain) / (1000 * 60 * 60 * 24);
  const milestoneValue = totalPeriodDays * 0.01; // 1% of time period
  const lifeEventValue = totalPeriodDays * 0.05; // 5% of time period
  
  const locationData = {};
  const categoryByLocationData = {};
  
  filteredEvents.forEach(event => {
    // Calculate duration based on event type
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
    
    // Extract location and category
    const location = event.location && event.location.country 
      ? event.location.country 
      : (event.location && event.location.city ? event.location.city : "Other");
    
    const category = event.category || "Uncategorized";
    
    // Build location data
    if (!locationData[location]) {
      locationData[location] = {
        name: location,
        value: 0,
        children: []
      };
    }
    locationData[location].value += duration;
    
    // Build category data by location
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
  
  // Create hierarchical structure
  const nestedData = {
    name: "Time Spent",
    children: []
  };
  
  Object.values(locationData).forEach(location => {
    if (location.value > 0) {
      const locationNode = {
        name: location.name,
        value: location.value,
        children: []
      };
      
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
  
  return { nestedData, locationData, categoryByLocationData };
}

// =============================================================================
// TOOLTIP UTILITIES
// =============================================================================

/**
 * Create a tooltip element for visualizations
 * @param {string} className - CSS class name for the tooltip
 * @returns {d3.Selection} D3 selection of the tooltip element
 */
export function createTooltip(className = 'chart-tooltip') {
  return d3.select('body').append('div')
    .attr('class', className)
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000);
}

/**
 * Show tooltip with content at mouse position
 * @param {d3.Selection} tooltip - D3 tooltip selection
 * @param {string} content - HTML content for tooltip
 * @param {Event} event - Mouse event for positioning
 */
export function showTooltip(tooltip, content, event) {
  tooltip.html(content)
    .style('opacity', 1)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

/**
 * Hide tooltip
 * @param {d3.Selection} tooltip - D3 tooltip selection
 */
export function hideTooltip(tooltip) {
  tooltip.style('opacity', 0);
}

// =============================================================================
// WORLD HEATMAP VISUALIZATION
// =============================================================================

/**
 * Render world heatmap visualization showing time spent by country
 * @param {Array} events - Array of timeline events
 * @param {Array} timeDomain - [startDate, endDate] time domain filter
 * @param {string} containerId - ID of container element (default: 'world-heatmap')
 */
export function renderWorldHeatmap(events, timeDomain, containerId = 'world-heatmap') {
  const container = d3.select(`#${containerId}`);
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
  
  // Process geographic data
  const { countryDurations, cityData, cities } = processGeographicData(events, timeDomain);
  
  const values = Object.values(countryDurations);
  const max = d3.max(values) || 1;
  const colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, max * 0.7]);
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create tooltip
  const mapTooltip = createTooltip('map-tooltip');
  
  // Render countries
  svg.append('g')
    .selectAll('path')
    .data(worldGeoJson.features)
    .join('path')
    .attr('d', path)
    .attr('fill', d => {
      const val = countryDurations[d.properties.name] || 0;
      return val ? colorScale(val) : '#e2e8f0';
    })
    .attr('stroke', d => {
      const val = countryDurations[d.properties.name] || 0;
      return val ? '#666' : '#ccc';
    })
    .attr('stroke-width', d => {
      const val = countryDurations[d.properties.name] || 0;
      return val ? 0.8 : 0.5;
    })
    .on('mouseover', function(event, d) {
      const country = d.properties.name;
      const days = countryDurations[country] || 0;
      
      if (days > 0) {
        let tooltipContent = `<strong>${country}</strong>: ${Math.round(days)} days<br>`;
        
        if (cityData[country]) {
          tooltipContent += '<ul style="margin: 5px 0; padding-left: 20px;">';
          Object.entries(cityData[country])
            .sort((a, b) => b[1] - a[1])
            .forEach(([city, cityDays]) => {
              tooltipContent += `<li>${city}: ${Math.round(cityDays)} days</li>`;
            });
          tooltipContent += '</ul>';
        }
        
        showTooltip(mapTooltip, tooltipContent, event);
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
      }
    })
    .on('mousemove', function(event) {
      mapTooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      hideTooltip(mapTooltip);
      d3.select(this).attr('stroke', '#ccc').attr('stroke-width', 0.5);
    });
    
  // Add city dots
  svg.selectAll('circle.city-dot')
    .data(cities)
    .join('circle')
    .attr('class', 'city-dot')
    .attr('cx', d => {
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
      const baseSize = 3;
      const scaleFactor = 0.8;
      const size = baseSize + Math.sqrt(d.days) * scaleFactor;
      return Math.min(12, Math.max(4, size));
    })
    .attr('fill', d => d.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85)
    .style('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.4))')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('r', d => {
          const currentSize = Math.min(12, Math.max(4, 3 + Math.sqrt(d.days) * 0.8));
          return currentSize * 1.3;
        })
        .attr('opacity', 1)
        .attr('stroke-width', 2);
      
      const tooltipContent = `
        <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${d.name}, ${d.country}</div>
        <div style="margin-bottom: 3px;">${d.event}</div>
        <div style="font-weight: 500;">${Math.round(d.days)} days</div>
      `;
      
      showTooltip(mapTooltip, tooltipContent, event);
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
      hideTooltip(mapTooltip);
    });
  
  // Add title
  const [startDomain, endDomain] = timeDomain || [new Date(0), new Date()];
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(`Time Spent by Country (${formatMonth(startDomain)} - ${formatMonth(endDomain)})`);
  
  // Add legend
  addHeatmapLegend(svg, colorScale, max, width, height);
}

/**
 * Add color legend to heatmap visualization
 * @param {d3.Selection} svg - SVG selection
 * @param {d3.ScaleSequential} colorScale - Color scale function
 * @param {number} max - Maximum value for scale
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 */
function addHeatmapLegend(svg, colorScale, max, width, height) {
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
  
  // Add gradient stops
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    gradient.append('stop')
      .attr('offset', `${(i / steps) * 100}%`)
      .attr('stop-color', colorScale((i / steps) * max * 0.7));
  }
  
  // Draw gradient rectangle
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

// =============================================================================
// NESTED PIE CHART VISUALIZATION
// =============================================================================

/**
 * Calculate mid-angle for pie slice positioning
 * @param {Object} d - D3 arc data object
 * @returns {number} Mid-angle in radians
 */
function midAngle(d) {
  return d.x0 + (d.x1 - d.x0) / 2;
}

/**
 * Render nested pie chart visualization showing places (inner) and categories (outer)
 * @param {Array} events - Array of timeline events
 * @param {Array} timeDomain - [startDate, endDate] time domain filter
 * @param {string} containerId - ID of container element (default: 'nested-pie-chart')
 * @param {Function} renderTimeline - Timeline render function for filtering
 * @param {Function} showCategoryEventsCallback - Callback for category filtering
 */
export function renderNestedPieChart(events, timeDomain, containerId = 'nested-pie-chart', renderTimeline = null, showCategoryEventsCallback = null) {
  const container = d3.select(`#${containerId}`);
  container.selectAll('*').remove();
  
  // Process data for pie chart
  const processedData = processNestedPieData(events, timeDomain);
  if (!processedData) {
    container.append('p')
      .attr('class', 'text-gray-500 text-center')
      .text('No data in selected range.');
    return;
  }
  
  const { nestedData, locationData, categoryByLocationData } = processedData;
  
  // Setup SVG dimensions
  const width = container.node().clientWidth || 400;
  const height = 400;
  const margin = 20;
  const radius = Math.min(width, height) / 2 - margin;
  
  // Create SVG
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width/2},${height/2})`);
  
  // Create color scales
  const locationColorScale = createLocationColorScale(Object.keys(locationData));
  const categoryColorScale = createCategoryColorScale(
    Object.keys(categoryByLocationData).flatMap(loc => Object.keys(categoryByLocationData[loc])),
    events
  );
  
  // Create meaningful coloring function
  const colorFn = d => {
    if (d.depth === 0) return "white"; // Root
    if (d.depth === 1) return locationColorScale(d.data.name); // Locations
    if (d.depth === 2) return categoryColorScale(d.data.name); // Categories
    return "#ccc"; // Fallback
  };
  
  // Create hierarchy and partition
  const root = d3.hierarchy(nestedData).sum(d => d.value);
  const partition = d3.partition().size([2 * Math.PI, radius * 0.8]);
  partition(root);
  
  // Create arc generator
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => {
      if (d.depth === 1) return Math.max(0, d.y0 * 0.8);
      if (d.depth === 2) return Math.max(0, d.y0 * 1.1);
      return Math.max(0, d.y0);
    })
    .outerRadius(d => {
      if (d.depth === 1) return Math.max(0, d.y1 * 0.8);
      return Math.max(0, d.y1);
    })
    .padAngle(0.03)
    .padRadius(radius / 3);
  
  // Create tooltip
  const tooltip = createTooltip('chart-tooltip');
  
  // Add SVG filters and gradients
  addPieChartEffects(svg, categoryByLocationData, categoryColorScale, events);
  
  // Add pie slices
  addPieSlices(svg, root, arc, colorFn, tooltip, categoryByLocationData, events, renderTimeline, showCategoryEventsCallback);
  
  // Add labels
  addPieLabels(svg, root, radius);
  
  // Add center label
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('font-size', '13px')
    .attr('fill', '#333')
    .text('Places');
  
  // Add legend
  addPieLegend(container, categoryByLocationData, events, svg, renderTimeline, showCategoryEventsCallback);
}

/**
 * Add SVG effects (filters and gradients) for pie chart
 * @param {d3.Selection} svg - SVG selection
 * @param {Object} categoryByLocationData - Category data by location
 * @param {d3.ScaleOrdinal} categoryColorScale - Category color scale
 * @param {Array} events - Array of events
 */
function addPieChartEffects(svg, categoryByLocationData, categoryColorScale, events) {
  const defs = svg.append("defs");
  
  // Add drop shadow filter
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
  feMerge.append("feMergeNode").attr("in", "shadow");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
  
  // Create radial gradients for categories
  const uniqueCategories = [...new Set(Object.keys(categoryByLocationData).flatMap(loc => 
    Object.keys(categoryByLocationData[loc])
  ))];
  
  const categoryGradientMap = {};
  
  uniqueCategories.forEach((category, index) => {
    const baseColor = categoryColorScale(category);
    const gradientId = `gradient-cat-${index}`;
    
    const gradient = defs.append("radialGradient")
      .attr("id", gradientId)
      .attr("cx", "0.5")
      .attr("cy", "0.5")
      .attr("r", "0.5")
      .attr("fx", "0.25")
      .attr("fy", "0.25");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", create3DShade(baseColor, "lighter"));
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", baseColor);
      
    categoryGradientMap[category] = gradientId;
  });
  
  // Store gradient map on SVG for access by other functions
  svg.property('categoryGradientMap', categoryGradientMap);
}

/**
 * Add pie chart slices with interactions
 * @param {d3.Selection} svg - SVG selection
 * @param {d3.Hierarchy} root - D3 hierarchy root
 * @param {d3.Arc} arc - D3 arc generator
 * @param {Function} colorFn - Color function
 * @param {d3.Selection} tooltip - Tooltip selection
 * @param {Object} categoryByLocationData - Category data by location
 * @param {Array} events - Array of events
 * @param {Function} renderTimeline - Timeline render function
 * @param {Function} showCategoryEventsCallback - Category filtering callback
 */
function addPieSlices(svg, root, arc, colorFn, tooltip, categoryByLocationData, events, renderTimeline, showCategoryEventsCallback) {
  const categoryGradientMap = svg.property('categoryGradientMap');
  
  svg.selectAll('path')
    .data(root.descendants().filter(d => d.depth > 0))
    .enter().append('path')
    .attr('class', d => d.depth === 2 ? 'category-slice' : (d.depth === 1 ? 'location-slice' : ''))
    .attr('d', arc)
    .attr('fill', function(d) {
      const color = colorFn(d);
      
      // Use radial gradient for outer ring categories
      if (d.depth === 2 && categoryGradientMap && categoryGradientMap[d.data.name]) {
        return `url(#${categoryGradientMap[d.data.name]})`;
      }
      
      return color;
    })
    .attr('stroke', 'rgba(255, 255, 255, 0.5)')
    .attr('stroke-width', 1)
    .style('filter', d => d.depth === 1 ? 'url(#drop-shadow)' : '')
    .style('opacity', 0.8)
    .style('transition', 'all 0.3s')
    .on('mouseover', function(event, d) {
      let content = '';
      
      if (d.depth === 1) {
        content = `<strong>${d.data.name}</strong><br>${Math.round(d.value)} days`;
      } else {
        content = `<strong>${d.data.name}</strong> in ${d.parent.data.name}<br>${Math.round(d.value)} days`;
      }
      
      showTooltip(tooltip, content, event);
      
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
      hideTooltip(tooltip);
      d3.select(this)
        .style('transform', 'scale(1) translateZ(0)')
        .style('filter', d.depth === 1 ? 'url(#drop-shadow)' : '')
        .style('z-index', 0);
    })
    .on('click', function(event, d) {
      // Only trigger filtering for category (outer) slices
      if (d.depth === 2 && showCategoryEventsCallback) {
        showCategoryEventsCallback(d.data.name);
      }
    });
}

/**
 * Add labels to pie chart segments
 * @param {d3.Selection} svg - SVG selection
 * @param {d3.Hierarchy} root - D3 hierarchy root
 * @param {number} radius - Pie chart radius
 */
function addPieLabels(svg, root, radius) {
  const segments = root.descendants().filter(d => d.depth === 1);
  const minSegmentSize = 0.15;
  const internalLabels = segments.filter(d => (d.x1 - d.x0) >= minSegmentSize);
  
  svg.selectAll('text.internal-label')
    .data(internalLabels)
    .enter().append('text')
    .attr('class', 'internal-label')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .attr('transform', function(d) {
      const angle = (midAngle(d) - Math.PI / 2) * 180 / Math.PI;
      const midRadius = (d.y0 + d.y1) / 2 * 0.75;
      return `rotate(${angle}) translate(${midRadius},0) rotate(${-angle})`;
    })
    .attr('dy', '0.35em')
    .attr('font-size', '10px')
    .attr('fill', 'white')
    .style('font-weight', 'bold')
    .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
    .text(d => d.data.name);
}

/**
 * Add interactive legend for pie chart categories
 * @param {d3.Selection} container - Container selection
 * @param {Object} categoryByLocationData - Category data by location
 * @param {Array} events - Array of events
 * @param {d3.Selection} svg - SVG selection for highlighting
 * @param {Function} renderTimeline - Timeline render function
 * @param {Function} showCategoryEventsCallback - Category filtering callback
 */
function addPieLegend(container, categoryByLocationData, events, svg, renderTimeline, showCategoryEventsCallback) {
  const legendItems = [...new Set(Object.keys(categoryByLocationData).flatMap(loc => 
    Object.keys(categoryByLocationData[loc])
  ))].filter(cat => cat !== "Unknown");
  
  if (legendItems.length === 0) return;
  
  const legendContainer = container.append('div')
    .attr('class', 'chart-legend')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fill, minmax(120px, 1fr))')
    .style('gap', '4px')
    .style('margin-top', '15px')
    .style('font-size', '12px');
  
  let activeFilter = null;
  
  // Category highlighting function
  const highlightCategory = (category, highlight) => {
    if (activeFilter !== null && !highlight) return;
    
    svg.selectAll('.category-slice')
      .each(function(d) {
        if (d && d.data && d.depth === 2) {
          if (d.data.name === category) {
            d3.select(this)
              .transition().duration(200)
              .style('opacity', highlight ? 1 : 0.8)
              .style('stroke-width', highlight ? 2 : 1);
          } else if (highlight) {
            d3.select(this)
              .transition().duration(200)
              .style('opacity', 0.4);
          } else if (activeFilter === null) {
            d3.select(this)
              .transition().duration(200)
              .style('opacity', 0.8)
              .style('stroke-width', 1);
          }
        }
      });
  };
  
  // Add legend items
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
      .on('click', () => {
        if (showCategoryEventsCallback) {
          showCategoryEventsCallback(category);
        }
      });
      
    legendItem.append('div')
      .style('width', '12px')
      .style('height', '12px')
      .style('border-radius', '3px')
      .style('background-color', getCategoryColor(category, events))
      .style('margin-right', '6px');
      
    legendItem.append('div')
      .style('white-space', 'nowrap')
      .style('overflow', 'hidden')
      .style('text-overflow', 'ellipsis')
      .text(category);
  });
}

// =============================================================================
// CHART INTERACTION UTILITIES
// =============================================================================

/**
 * Create category filtering function for pie chart interactions
 * @param {Array} events - Array of all events
 * @param {Function} renderTimeline - Timeline render function
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {d3.Selection} container - Chart container for notifications
 * @param {d3.Selection} svg - SVG selection for visual effects
 * @returns {Function} Category filtering function
 */
export function createCategoryFilter(events, renderTimeline, startDate, endDate, container, svg) {
  let activeFilter = null;
  
  return function showCategoryEvents(category) {
    // Toggle filter if same category clicked
    if (activeFilter === category) {
      activeFilter = null;
      
      // Reset pie chart visual state
      svg.selectAll('.category-slice')
        .transition().duration(300)
        .style('opacity', 0.8)
        .style('stroke-width', 1)
        .style('transform', 'scale(1) translateZ(0)');
      
      // Show all events
      if (renderTimeline) {
        renderTimeline(events, startDate, endDate);
      }
      
      // Show notification
      showNotification(container, 'Showing all events');
      return;
    }
    
    // Set new active filter
    activeFilter = category;
    
    // Highlight category slices
    svg.selectAll('.category-slice')
      .each(function(d) {
        if (d && d.data && d.depth === 2) {
          if (d.data.name === category) {
            d3.select(this)
              .transition().duration(300)
              .style('opacity', 1)
              .style('stroke-width', 2)
              .style('transform', 'scale(1.1) translateZ(5px)')
              .style('filter', 'brightness(1.1) drop-shadow(0 0 5px rgba(0,0,0,0.3))')
              .style('z-index', 10);
          } else {
            d3.select(this)
              .transition().duration(300)
              .style('opacity', 0.3)
              .style('transform', 'scale(0.98) translateZ(0)')
              .style('filter', 'none')
              .style('z-index', 0);
          }
        }
      });
    
    // Filter and show category events
    const categoryEvents = events.filter(e => e.category === category);
    if (renderTimeline) {
      renderTimeline(categoryEvents, startDate, endDate);
    }
    
    // Show notification
    showNotification(container, `Filtered to show "${category}" events. Click again to clear.`);
  };
}

/**
 * Show notification message in chart container
 * @param {d3.Selection} container - Container selection
 * @param {string} message - Notification message
 * @param {number} duration - Display duration in milliseconds (default: 2500)
 */
function showNotification(container, message, duration = 2500) {
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
    .text(message);
    
  notification.transition()
    .duration(300)
    .style('opacity', 1)
    .transition()
    .delay(duration)
    .duration(500)
    .style('opacity', 0)
    .remove();
}

// =============================================================================
// UTILITY FUNCTIONS FOR CHART CLEARING
// =============================================================================

/**
 * Clear visualization containers
 * @param {string} worldHeatmapId - ID of world heatmap container (default: 'world-heatmap')
 * @param {string} pieChartId - ID of pie chart container (default: 'nested-pie-chart')
 */
export function clearVisualizations(worldHeatmapId = 'world-heatmap', pieChartId = 'nested-pie-chart') {
  d3.select(`#${worldHeatmapId}`).selectAll('*').remove();
  d3.select(`#${pieChartId}`).selectAll('*').remove();
}

// =============================================================================
// MAIN VISUALIZATION RENDERING FUNCTIONS
// =============================================================================

/**
 * Render both world heatmap and nested pie chart visualizations
 * @param {Array} events - Array of timeline events
 * @param {Array} timeDomain - [startDate, endDate] time domain filter
 * @param {Function} renderTimeline - Timeline render function for filtering
 * @param {Object} options - Options object with container IDs and callbacks
 */
export function renderAllVisualizations(events, timeDomain, renderTimeline = null, options = {}) {
  const {
    worldHeatmapId = 'world-heatmap',
    pieChartId = 'nested-pie-chart',
    showCategoryEventsCallback = null
  } = options;
  
  // Clear existing visualizations
  clearVisualizations(worldHeatmapId, pieChartId);
  
  // Render world heatmap
  renderWorldHeatmap(events, timeDomain, worldHeatmapId);
  
  // Render nested pie chart
  renderNestedPieChart(events, timeDomain, pieChartId, renderTimeline, showCategoryEventsCallback);
}