# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Three Gallery is a 3D content sharing platform supporting three upload types: Three.js code snippets, HTML files with Three.js, and 3D model files (GLB/GLTF). The platform features user authentication, profiles, and operates in two modes: full-featured with Supabase or local demo mode without backend dependencies.

## Current Configuration Status

The project currently has Supabase fully configured with:
- Authentication (Google OAuth enabled)
- Database schema deployed
- Environment variables set in `.env.local`

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
  - Routes check `user` from `useAuth()` hook

### State Management
- **Zustand store** (`src/store/useStore.ts`): Global state for models, UI state (sidebar, search), and filters
- **Persisted state**: `currentUser`, `isSidebarOpen`, `models` saved to localStorage
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

## Critical Implementation Details

### Environment Variables
```bash
# Required for full functionality (defined in .env.local.example)
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Supabase anonymous key
NEXT_PUBLIC_APP_URL               # Application URL for OAuth redirects

# Optional (for payments)
STRIPE_SECRET_KEY                 # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe public key
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

### Common Issues & Solutions

1. **Hydration Mismatch**: Dark Reader extension - fixed with `suppressHydrationWarning` on html/body
2. **Port Conflicts**: Dev server auto-switches to 3001 if 3000 is occupied
3. **Profile Fetch Errors**: Gracefully falls back to local profile when Supabase unavailable
4. **OAuth Redirect Loop**: Ensure redirect URLs match in Supabase dashboard and use dynamic origin
5. **Fullscreen API**: May fail in some browsers - errors caught and logged silently

### File Upload Handling
- **Code**: Stored as string in metadata.code
- **HTML**: Read as text via FileReader, stored in metadata.htmlContent  
- **3D Models**: Create blob URL for preview using URL.createObjectURL(), cleanup on unmount
- **API Route** (`/api/upload/route.ts`): Handles all three types, returns local or DB storage based on Supabase config

### Type Patterns
- Models use `Model` interface from `src/types/index.ts`
- Avoid `any` except for third-party integrations
- Error handling: Always check `error instanceof Error`
- Optional chaining for user metadata: `user?.user_metadata?.avatar_url`

## Deployment Considerations

### Vercel Deployment
- Set all env vars in Vercel dashboard
- Build fails if TypeScript errors exist
- API routes in `src/app/api/` auto-deployed as serverless functions

### Database Schema (When Connected)
Tables in `supabase/schema.sql`:
- `profiles`: Extended user data with username, bio, avatar
- `models`: 3D content metadata with tags, pricing, stats
- `comments`, `likes`, `follows`: Social features (UI exists, backend pending)
- Row Level Security (RLS) policies required for production