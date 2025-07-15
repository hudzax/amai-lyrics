# Project Structure & Organization

## Root Directory

- `src/` - Main source code
- `builds/` - Production build outputs
- `dist/` - Local development build outputs
- `previews/` - Screenshots and demo images for documentation
- `manifest.json` - Spicetify extension manifest
- `package.json` - Node.js dependencies and scripts

## Source Code Organization (`src/`)

### Main Entry Point

- `app.tsx` - Primary application entry point and initialization logic

### Components (`src/components/`)

- `Global/` - Core application components (Platform, Session, SpotifyPlayer)
- `Pages/` - Page-level components and views
- `Styling/` - UI styling components and icons
- `Utils/` - Reusable utility components
- `DynamicBG/` - Dynamic background effects

### Utilities (`src/utils/`)

- `API/` - External API integrations
- `Lyrics/` - Lyrics fetching, processing, and caching
- `Scrolling/` - Scroll behavior and animations
- `Gets/` - Data retrieval utilities
- `CSS/` - CSS manipulation utilities
- Core utilities: `storage.ts`, `settings.ts`, `IntervalManager.ts`, etc.

### Styling (`src/css/`)

- `default.css` - Base styles
- `Lyrics/` - Lyrics-specific styling
- `DynamicBG/` - Dynamic background styles
- `Loaders/` - Loading animation styles
- Component-specific CSS files

### Type Definitions (`src/types/`)

- `spicetify.d.ts` - Spicetify API type definitions
- `global.d.ts` - Global type declarations
- Module-specific type definitions

## Architecture Patterns

### Event-Driven Architecture

- Global event system for component communication
- Spicetify Player event listeners for music state changes
- Custom event managers for application state

### Performance Optimization

- Dynamic imports for code splitting
- Interval managers for efficient polling
- FastDOM for optimized DOM operations
- Caching layers for API responses

### Component Organization

- Separation of concerns: utilities, components, styling
- Modular CSS with component-specific stylesheets
- Type-safe interfaces throughout the application
