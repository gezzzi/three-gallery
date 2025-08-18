# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Three Gallery is a 3D content sharing platform supporting three upload types: Three.js code snippets, HTML files with Three.js, and 3D model files (GLB/GLTF). The platform features user authentication, profiles, BGM support, and operates in two modes: full-featured with Supabase or local demo mode without backend dependencies.

## Current Configuration Status

The project currently has Supabase configured with:
- Authentication (Google OAuth enabled, password requirements: min 8 chars, lowercase + uppercase + numbers required)
- Database schema deployed with RLS policies
- Environment variables set in `.env.local`
- **Important**: RLS on `models` table is temporarily disabled due to auth issues in API routes

## Essential Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (must pass before deployment)
npm run start        # Start production server
npm run lint         # Run ESLint checks

# Testing builds locally
npm run build && npm run start  # Test production build locally
```

## Architecture & Key Patterns

### Upload System (Three Types)
1. **Three.js Code** (`uploadType: 'code'`): Uses CodeEditor and CodeSandbox components with sandboxed execution
2. **HTML Files** (`uploadType: 'html'`): Full HTML documents rendered in iframe with HtmlPreview component
3. **3D Models** (`uploadType: 'model'`): GLB/GLTF files rendered with ModelViewer using React Three Fiber

### Authentication Flow
- **AuthContext** (`src/contexts/AuthContext.tsx`): Wraps entire app at layout level, manages auth state
- **Dual Mode Operation**: 
  - With Supabase: Full authentication with Google OAuth and email/password
  - Without Supabase: Auto-creates demo user, operates locally
- **OAuth Redirect**: Dynamic URL handling for localhost vs production (`/auth/callback`)
- **Protected Routes**: 
  - `/upload` - Shows login prompt if not authenticated
  - `/profile` - Shows login prompt if not authenticated
  - `/settings` - Redirects to home if not authenticated
  - Routes check `user` from `useAuth()` hook

### State Management
- **Zustand store** (`src/store/useStore.ts`): Global state for models, UI state (sidebar, search), filters, history, likes, bookmarks
- **Persisted state**: `currentUser`, `isSidebarOpen`, `models`, `history`, `likedModels`, `bookmarkedModels` saved to localStorage
- **AuthContext vs Store**: Auth state in context, UI/data state in Zustand

### Component Architecture
- **Layout Structure**: AuthProvider > LayoutClient > Header + Sidebar + Content
- **Dynamic Imports**: Heavy components (ModelViewer, CodeEditor) loaded with `dynamic()` for performance
- **Client Components**: All interactive components use `'use client'` directive
- **Suspense Boundaries**: Required for useSearchParams and async components

### 3D Rendering Pipeline
- **ModelViewer** (`src/components/3d/ModelViewer.tsx`): Central component switching between three render modes
- **CodeSandbox**: Sandboxed Three.js execution with message passing between iframe and parent
- **HtmlPreview**: Direct HTML rendering with srcdoc for embedded Three.js scenes
- **Security**: Sandboxed iframes block dangerous APIs (fetch, localStorage, etc.)

### BGM System
- **Default BGMs** (`src/lib/defaultBgm.ts`): Predefined BGM tracks with genres and descriptions
- **MusicPlayer** (`src/components/ui/MusicPlayer.tsx`): Audio playback controls with volume adjustment
- **Upload Support**: Users can select default BGMs or upload custom audio files (MP3, WAV, OGG, M4A)
- **Storage**: BGM metadata stored in model's metadata field (music_type, music_url, music_name)

## Critical Implementation Details

### Environment Variables
```bash
# Required for full functionality (defined in .env.local.example)
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Supabase anonymous key
NEXT_PUBLIC_APP_URL               # Application URL for OAuth redirects
```

### Operating Modes

**Production Mode (Current)**: When Supabase is configured
- Real authentication required (Google OAuth or email/password)
- Data persists to Supabase database
- Profile changes are saved permanently
- Upload metadata stored in database

**Local Demo Mode**: When Supabase env vars are missing or placeholder
- AuthContext creates demo user automatically
- Profile operations work in-memory only
- Upload API returns success with local storage
- No persistence between sessions

### Known Issues & Solutions

1. **Profile/Settings Page Loading Issues**: Fixed by removing `hasLoaded` flag from useEffect dependencies
2. **Authentication Race Condition**: SIGNED_IN event handler removed from AuthContext to prevent concurrent DB access
3. **RLS Policy Issues**: Currently disabled on `models` table - API route authentication with Supabase needs proper implementation
4. **Hydration Mismatch**: Dark Reader extension - fixed with `suppressHydrationWarning` on html/body
5. **OAuth Redirect Loop**: Ensure redirect URLs match in Supabase dashboard and use dynamic origin
6. **Build Route Manifest Error**: Clean `.next` folder and restart dev server if routes-manifest.json errors occur

### File Upload Handling
- **Code**: Stored as string in metadata.code, requires `file_url: 'threejs-code'`
- **HTML**: Read as text via FileReader, stored in metadata.htmlContent, requires `file_url: 'threejs-html'`
- **3D Models**: Create blob URL for preview using URL.createObjectURL(), requires `file_url` with model path
- **BGM Files**: Stored as metadata with type indicator (default/upload)
- **API Route** (`/api/upload/route.ts`): Handles all three types, requires proper authentication setup

### Type Patterns
- Models use `Model` interface from `src/types/index.ts`
- Avoid `any` - use `Record<string, unknown>` for metadata type assertions
- Error handling: Always check `error instanceof Error`
- Optional chaining for user metadata: `user?.user_metadata?.avatar_url`
- Type assertions for metadata access: `metadata.music_url as string`

## Database Schema (When Connected)

Tables in `supabase/schema.sql`:
- `profiles`: Extended user data with username, bio, avatar
- `models`: 3D content metadata with tags, licensing, stats, BGM fields, `upload_type` field
- `comments`, `likes`, `follows`, `bookmarks`: Social features
- `tags`, `downloads`, `transactions`: Content management
- Row Level Security (RLS) policies configured but temporarily disabled on `models` table

### Recent Updates
- Fixed profile/settings pages loading state by removing race conditions
- Enhanced upload API to support all three upload types (code, html, model)
- RLS on models table temporarily disabled due to authentication issues in API routes
- Added `upload_type` field handling in upload API
- Fixed concurrent authentication state updates causing infinite loading