# Technology Stack & Build System

## Core Technologies

- **TypeScript/React** - Main application framework with JSX support
- **Spicetify** - Spotify customization platform and API
- **Google Gemini AI** - Translation and text processing service
- **Node.js** - Development environment

## Key Dependencies

- `@google/genai` - Google Gemini AI integration
- `pako` - Compression/decompression utilities
- `simplebar` - Custom scrollbar implementation
- `spark-md5` - MD5 hashing for caching
- `@hudzax/web-modules` - Custom web utilities

## Build System

- **spicetify-creator** - Primary build tool for Spicetify extensions
- **TypeScript** - Compilation with ES2020 target
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting

## Common Commands

```bash
# Development build with file watching
npm run watch

# Production build (outputs to builds/)
npm run build

# Local development build (outputs to dist/)
npm run build-local
```

## Code Style

- **Prettier configuration**: 2-space indentation, single quotes, trailing commas
- **ESLint**: TypeScript recommended rules with browser globals
- **File naming**: PascalCase for components, camelCase for utilities
- **Import organization**: External imports first, then internal utilities, then CSS

## Performance Considerations

- Dynamic imports for non-critical modules
- FastDOM for optimized DOM operations
- Interval managers for efficient polling
- Caching system for lyrics and API responses
- Lazy loading for background images
