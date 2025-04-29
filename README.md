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