# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Run local server: `python3 -m http.server 8000`
- Navigate to: `http://localhost:8000`

## React development (sample timeline design)
- Run dev server: `cd "sample timeline design" && npm run dev`
- Build: `cd "sample timeline design" && npm run build`
- Lint: `cd "sample timeline design" && npm run lint`

## Code Style
- Format: 2-space indentation
- JavaScript: ES6+ syntax, semicolons, camelCase for variables/functions
- React: Functional components with hooks, TypeScript interfaces in types folder
- CSS: BEM methodology for vanilla CSS, Tailwind for React components
- Add parent-child relationships for nested timeline events
- Follow existing patterns for event handling and state management
- YAML for data storage with schema defined in README.md