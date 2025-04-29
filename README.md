# Timeline App

Interactive web application to create and visualize timelines.

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
2. Open `index.html` in your browser, or start a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`.
   - The app will load predefined events from `data/events.yaml`.
   - Use the form to add new timeline events; check "Life Event" to mark anniversaries.
   - Scroll or use mouse wheel (or pinch) to zoom and pan the timeline.

YAML Configuration
------------------
Events can be defined in YAML with the following fields:
  - `title` (string, required): Event name.
  - `start` (date, YYYY-MM-DD, required): Start date.
  - `end` (date, YYYY-MM-DD, optional): End date for range events.
  - `type` (`range` | `life` | `milestone`, optional): Event type. Defaults to `range`, or `life` if `life_event: true` is set.
  - `life_event` (boolean, optional): Legacy flag for life events (renders as vertical lines).
  - `color` (string, optional): Hex color code for the event.
  - `metadata` (string, optional): Additional event details.
  - `parent` (string, optional): Title of parent event for nested (child) events.

Example:
```yaml
- title: "Project"  
  start: "2022-01-01"  
  end: "2022-12-31"  
  color: "#4CAF50"  

- title: "Phase 1"  
  start: "2022-01-01"  
  end: "2022-03-31"  
  parent: "Project"  
  color: "#FF9800"  

- title: "Phase 2"  
  start: "2022-04-01"  
  end: "2022-06-30"  
  parent: "Project"  
  color: "#FF9800"  
```  