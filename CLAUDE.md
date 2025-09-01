# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Three Gallery is an HTML Three.js content sharing platform for interactive 3D web experiences. Users can upload HTML files containing Three.js code or write Three.js code snippets directly. The platform features user authentication, profiles, BGM support, and operates in two modes: full-featured with Supabase or local demo mode without backend dependencies.

**Important: This application only supports HTML/JavaScript Three.js content. 3D model file uploads (GLB/GLTF) have been removed.**

## Current Configuration Status

The project currently has Supabase configured with:
- Authentication (Google OAuth enabled, password requirements: min 8 chars, lowercase + uppercase + numbers required)
- Database schema deployed with RLS policies
- Environment variables set in `.env.local`
- Supabase CLI configured with local development environment
- **Important**: RLS on `models` table is temporarily disabled due to auth issues in API routes

## Essential Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (must pass before deployment)
npm run start        # Start production server
npm run lint         # Run ESLint checks

# Supabase Local Development
npx supabase start   # Start local Supabase (PostgreSQL, Auth, Storage)
npx supabase stop    # Stop local Supabase
npx supabase status  # Check service URLs and keys
npx supabase db reset # Reset local database with migrations

# Database Management
npx supabase migration new <name>  # Create new migration file
npx supabase db push               # Apply migrations to production
npx supabase gen types typescript --local > src/types/supabase.ts  # Generate TypeScript types

# Testing builds locally
npm run build && npm run start  # Test production build locally
```

## Architecture & Key Patterns

### Upload System (Two Types Only)
1. **Three.js Code** (`uploadType: 'code'`): Uses CodeEditor and CodeSandbox components with sandboxed execution
2. **HTML Files** (`uploadType: 'html'`): Full HTML documents with Three.js rendered in iframe with HtmlPreview component

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
- **Zustand store** (`src/store/useStore.ts`): Global state for models, UI state, filters, history, likes, bookmarks
  - Note: `isSidebarOpen` and `toggleSidebar` have been removed - sidebar is now hover-controlled
- **Persisted state**: `currentUser`, `models`, `history`, `likedModels`, `bookmarkedModels` saved to localStorage
- **AuthContext vs Store**: Auth state in context, UI/data state in Zustand

### Component Architecture
- **Layout Structure**: AuthProvider > LayoutClient > Header + Sidebar + PageFooter + Footer (mobile)
  - **Sidebar**: Icon-only by default, expands on hover (desktop only)
  - **Footer**: Mobile navigation with Home, Trending, Upload, Following, Bookmarks
  - **PageFooter**: Site information footer with links to About, Terms, Privacy
- **Dynamic Imports**: Heavy components (CodeEditor, HtmlPreview) loaded with `dynamic()` for performance
- **Client Components**: All interactive components use `'use client'` directive
- **Suspense Boundaries**: Required for useSearchParams and async components

### HTML/Code Rendering Pipeline
- **HtmlPreview** (`src/components/3d/HtmlPreview.tsx`): Direct HTML rendering with srcdoc for embedded Three.js scenes
- **CodeSandbox** (`src/components/3d/CodeSandbox.tsx`): Sandboxed Three.js execution with message passing between iframe and parent
- **Security**: Sandboxed iframes block dangerous APIs (fetch, localStorage, etc.)
- **No 3D Model Support**: ModelViewer and related components have been removed

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
- **BGM Files**: Stored in Supabase storage bucket 'music', URL saved in bgm_url field
- **Thumbnails**: Auto-generated or custom upload, stored as URL reference
- **API Route** (`/api/upload/route.ts`): Handles HTML and code uploads with authentication

### Type Patterns
- Models use `Model` interface from `src/types/index.ts` with `uploadType: 'html' | 'code'`
- Removed properties: `hasAnimation`, `polygonCount`, `animationDuration`
- Avoid `any` - use `Record<string, unknown>` for metadata type assertions
- Error handling: Always check `error instanceof Error`
- Optional chaining for user metadata: `user?.user_metadata?.avatar_url`
- Type assertions for metadata access: `metadata.music_url as string`

## Database Schema (When Connected)

Tables in `supabase/schema.sql` and migrations:
- `profiles`: Extended user data with username, bio, avatar
- `models`: Content metadata with tags, licensing, stats, BGM fields, `upload_type` field ('html' or 'code' only)
- `comments`, `likes`, `follows`, `bookmarks`: Social features
- `tags`, `downloads`: Content management
- Row Level Security (RLS) policies configured but temporarily disabled on `models` table

### Recent Schema Updates
- Created unified initial schema (`000_initial_schema.sql`) with all tables and RLS policies
- Fixed migration numbering conflicts (002 → 003)
- Added `upload_type` field handling in upload API (supports 'html' and 'code' only)
- Enhanced BGM system with direct column storage (bgm_type, bgm_url, bgm_name)

## Supabase Local Development

### Local Services (when running)
- **Database**: PostgreSQL on port 54322
- **Auth**: Authentication service on port 54321
- **Storage**: S3-compatible storage on port 54321
- **Studio**: Database management UI on port 54323
- **Inbucket**: Email testing on port 54324

### Migration Workflow
1. Make schema changes in SQL files
2. Test locally with `npx supabase db reset`
3. Generate types: `npx supabase gen types typescript --local > src/types/supabase.ts`
4. Apply to production: `npx supabase db push`

## Performance Considerations

- **Dynamic Imports**: HtmlPreview, CodeEditor loaded on-demand
- **Image Optimization**: Disabled (`unoptimized: true` in next.config.js)
- **Suspense Boundaries**: Wrap async components and useSearchParams
- **Client-Side Routing**: App Router with proper loading states
- **State Persistence**: Selective localStorage usage for performance

## Recent Major Changes

- **Removed 3D Model Support**: Application now only supports HTML Three.js content
- **Simplified Upload Flow**: Only HTML file upload or code editor options remain
- **Updated UI Text**: Changed from "3Dモデル" to "Three.js作品" throughout
- **Removed Components**: ModelViewer, ModelViewerWithPerformance deleted
- **Type Updates**: Removed model-specific properties from Model interface
- **UI Navigation Updates**:
  - Removed search bar from Header
  - Removed menu toggle button - sidebar is now hover-based
  - Added mobile Footer navigation bar
  - Added PageFooter with site information
  - Sidebar shows icons only, expands on hover (desktop only)