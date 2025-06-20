# Timeline App

Interactive web application to create and visualize timelines.

## Project Structure

This application has been refactored into a modular architecture for better maintainability and development experience:

```
timeline/
├── index.html              # Main application entry point
├── script.js               # Main application coordination and initialization
├── css/                    # Modular stylesheets
│   ├── base.css           # Global styles and resets
│   ├── timeline.css       # Timeline-specific styles
│   ├── forms.css          # Form-related styles
│   └── controls.css       # UI controls and buttons
├── js/                     # Modular JavaScript components
│   ├── config.js          # App configuration and constants
│   ├── utils.js           # Utility functions and calculations
│   ├── data-manager.js    # Import/export and data processing
│   ├── event-manager.js   # Event CRUD operations
│   ├── timeline-renderer.js # Timeline visualization
│   ├── ui-components.js   # UI components and controls
│   ├── interactions.js    # Zoom, pan, and timeline interactions
│   ├── visualizations.js # Charts and geographic visualizations
│   ├── tests.js          # Testing and validation functions
│   └── template-loader.js # HTML template loading utilities
├── templates/             # Reusable HTML components
│   ├── event-form.html   # Event creation/editing form
│   ├── controls.html     # Import/export controls
│   ├── timeline-container.html # Timeline layout
│   ├── charts-container.html   # Visualization charts
│   └── footer.html       # Application footer
└── data/                 # Data files
    ├── events.yaml       # Default timeline events
    └── ...              # Other data files
```

Features
--------
- Add events with title, start date, end date, color, and metadata.
- Visual multi-row timeline with colored bars.
- Hover over events to view details.
- Mark life events/anniversaries using the "Life Event" checkbox (renders as vertical lines).
- Randomized color is assigned to the next event input after each addition.
- Scrollable and zoomable timeline navigation.
- Load predefined events from `data/events.yaml` on startup.
- Define parent/child relationships in YAML or via UI to split and merge event bars for nested timelines.
- Edit existing events by clicking on their bars; a popup form appears with animation for in-place editing.
- Add new events using the "+" button below the chart, which opens the event form.
- UI styled with Semantic UI framework for responsive components.

Getting Started
---------------
1. Clone the repository.
2. Start a simple HTTP server (required for ES6 modules):
   ```bash
   python3 -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`.
   - The app will load predefined events from `data/events.yaml`.
   - Use the form to add new timeline events; check "Life Event" to mark anniversaries.
   - Scroll or use mouse wheel (or pinch) to zoom and pan the timeline.

## Development

### Module System
The application uses ES6 modules for better code organization. Each module has a specific responsibility:

- **config.js**: Application constants and configuration
- **utils.js**: Date calculations, formatting, and utility functions
- **data-manager.js**: File import/export, data validation, and format conversion
- **event-manager.js**: Event CRUD operations and form management
- **timeline-renderer.js**: Timeline visualization and rendering
- **ui-components.js**: UI controls, dropdowns, and interactive elements
- **interactions.js**: Zoom, pan, and timeline navigation
- **visualizations.js**: Charts and geographic data visualization
- **tests.js**: Testing framework and validation functions

### Testing
Enable development mode by adding `?debug=true` to the URL or running on localhost. This enables:
- Import/export test suite
- Parent-child relationship validation
- Data integrity testing

### Adding New Features
1. Identify the appropriate module for your feature
2. Add new functions to the relevant module
3. Import and use the functions in `script.js` or other modules
4. Update tests as needed

Data Import/Export
------------------
The app supports importing and exporting events in both YAML and CSV formats.

### YAML Configuration
Events can be defined in YAML with the following fields:
  - `title` (string, required): Event name.
  - `start` (date, YYYY-MM-DD, required): Start date.
  - `end` (date, YYYY-MM-DD, optional): End date for range events.
  - `type` (`range` | `life` | `milestone`, optional): Event type. Defaults to `range`, or `life` if `life_event: true` is set.
  - `id` (string, optional): Unique identifier for the event (used for parent-child relationships).
  - `parentId` (string, optional): ID of the parent event for nested (child) events.
  - `isParent` (boolean, optional): Flag to mark if this event is a parent for other events.
  - `isImportant` (boolean, optional): Flag to highlight the event as important.
  - `life_event` (boolean, optional): Legacy flag for life events (renders as vertical lines).
  - `color` (string, optional): Hex color code for the event.
  - `metadata` (string, optional): Additional event details.
  - `category` (string, optional): Event category for grouping.
  - `row` (number, optional): Row number for positioning the event in the timeline.
  - `location` (object, optional): Location information with `city` and `country` properties.

Example YAML:
```yaml
- id: "project-2022"
  title: "Project"  
  start: "2022-01-01"  
  end: "2022-12-31"  
  color: "#4CAF50"
  isParent: true

- id: "phase-1"
  title: "Phase 1"  
  start: "2022-01-01"  
  end: "2022-03-31"  
  parentId: "project-2022"  
  color: "#FF9800"  

- id: "phase-2"
  title: "Phase 2"  
  start: "2022-04-01"  
  end: "2022-06-30"  
  parentId: "project-2022"  
  color: "#FF9800"  
```

### CSV Format
The app also supports importing and exporting events in CSV format. The CSV format includes headers for all event properties, with parent-child relationships preserved through the `eventId` and `parentId` fields.

Example CSV:
```csv
eventId,title,start,end,type,color,metadata,category,parentId,isParent,isImportant,row,location_city,location_country
project-2022,Project,2022-01-01,2022-12-31,range,#4CAF50,,,,,true,0,,
phase-1,Phase 1,2022-01-01,2022-03-31,range,#FF9800,,project,project-2022,,,1,,
phase-2,Phase 2,2022-04-01,2022-06-30,range,#FF9800,,project,project-2022,,,1,,
```

### Parent-Child Relationships

When importing and exporting data:
1. Each event should have a unique `id` (or `eventId` in CSV) if it will be referenced by children
2. Child events should reference their parent's ID using the `parentId` field
3. Parent events should set `isParent: true` to enable proper styling

The app ensures these relationships are preserved during both import and export operations.