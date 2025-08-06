# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a specialized karaoke text editor application ("Uppercase cante karaokê") built with Next.js 15, React 19, and TypeScript. The app converts text to uppercase and provides two distinct modes:

1. **Edit Mode**: Text editor that automatically converts input to uppercase and replaces hyphens with spaces
2. **Singer Mode**: Read-only karaoke display mode with line highlighting and auto-scroll functionality

## Development Commands

- **Start development server**: `npm run dev` (opens on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linting**: `npm run lint`

## Architecture

### Core Components
- **Single Page Application**: All functionality is contained in `src/app/page.tsx`
- **Layout**: Basic layout with Portuguese locale (`pt-br`) and Inter font in `src/app/layout.tsx`
- **Styling**: TailwindCSS with custom background image configuration

### Key Features Implementation
- **Text transformation**: Auto-uppercase conversion and hyphen-to-space replacement in `handleChange`
- **Singer Mode**: Line-by-line highlighting system using spacebar navigation with `handleKeyDown`
- **Auto-scroll**: Smooth scrolling functionality that follows highlighted lines
- **Theme switching**: Dark/light mode toggle
- **Toast notifications**: Uses `react-toastify` for user feedback

### State Management
The application uses React hooks for state management:
- `text`: Main text content
- `isSingerMode`: Toggle between edit and singer modes  
- `highlightedLines`: Array tracking highlighted lines in singer mode
- `isDark`: Theme state

### Styling Approach
- **TailwindCSS**: Primary styling framework
- **Custom background**: Line grid background using CSS gradients for both modes
- **Responsive design**: Mobile-first approach with `md:` breakpoints
- **Custom background image**: `bg-ck` class references `/backgroundCk.svg`

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata and fonts
│   ├── page.tsx            # Main application component  
│   ├── globals.css         # Tailwind imports
│   └── fonts/              # Geist font files
public/
├── backgroundCk.svg        # Main background image
└── lines.png              # Additional graphics
```

## Development Notes

- The application is entirely client-side (`"use client"`)
- Uses Portuguese language for UI text and metadata
- Fixed positioning for floating action buttons (theme, mode toggle)
- Custom line height and character width calculations for proper text alignment
- No backend API - all functionality is frontend-only