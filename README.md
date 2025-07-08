# Family Privacy Extension - Modernized

This is a modernized version of the Family Privacy Extension built with:
- **Vite** for fast development and building
- **TypeScript** for type safety
- **React** for the UI components
- **Tailwind CSS** for styling
- **Shadcn/UI** for modern UI components
- **CRXJS Vite Plugin** for Chrome extension development

## Project Structure

```
src/
├── background/         # Service worker (background script)
│   └── index.ts
├── content/           # Content scripts
│   └── index.ts
├── popup/             # Extension popup
│   ├── index.html
│   ├── main.tsx
│   └── Popup.tsx
├── options/           # Options/settings page
│   ├── index.html
│   └── options.tsx
├── blocked/           # Blocked site page
│   ├── index.html
│   └── blocked.tsx
├── components/        # Reusable UI components
│   └── ui/
├── lib/              # Utility functions
│   └── utils.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── globals.css       # Global styles with CSS variables
└── manifest.json     # Extension manifest
```

## Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder after building

## Key Features

- **Modern React UI** with Tailwind CSS styling
- **TypeScript** for better code quality and developer experience
- **Hot reload** during development with CRXJS
- **Component-based architecture** with reusable UI components
- **Modern extension patterns** following Chrome Extension Manifest V3

## Migration from Original

The original extension's functionality has been preserved and enhanced:
- All original features (profiles, blocking, statistics) are maintained
- Modern UI with better user experience
- Better code organization and maintainability
- Type safety with TypeScript
- Modern development workflow with Vite

## UI Components

The extension uses Shadcn/UI components which provide:
- Consistent design system
- Accessible components
- Dark/light mode support
- Responsive design
- Modern styling with Tailwind CSS
