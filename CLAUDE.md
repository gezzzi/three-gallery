# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Three Gallery is a 3D model sharing platform built with Next.js 15, allowing users to upload, share, and sell 3D models with real-time preview capabilities using Three.js and React Three Fiber.

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

### State Management
- **Zustand store** (`src/store/useStore.ts`): Global state for user auth, models, UI state (sidebar, search), and filters
- Persisted state includes: `currentUser`, `isSidebarOpen`
- Client-only components must use `'use client'` directive

### API Structure
- **Stripe endpoints** (`src/app/api/stripe/`): Handle checkout and webhooks
- All Stripe functions check for environment variables and throw descriptive errors if not configured
- Stripe SDK initialization is conditional: returns `null` if `STRIPE_SECRET_KEY` is not set

### Component Hierarchy
- **Layout**: `LayoutClient` wraps the app with header/sidebar, managing responsive layout based on sidebar state
- **3D Rendering**: `ModelViewer` component uses React Three Fiber with Suspense boundaries for loading states
- **Search**: Uses `useSearchParams` wrapped in Suspense to avoid SSR issues

### Data Flow
- **Mock data** (`src/lib/mockData.ts`): Currently using static data for models and users
- **Supabase integration** ready but not active - tables defined in `supabase/schema.sql`
- Model files expected to be GLTF/GLB format, loaded via `useGLTF` hook

## Critical Implementation Details

### Environment Variables Required
All defined in `.env.local.example`:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- App: `NEXT_PUBLIC_APP_URL`

### Common Issues & Solutions

1. **Sidebar not expanding content**: Main content uses `ml-64` when open, `ml-0` when closed, with transition animations
2. **Dark mode override**: System preferences ignored - `light` class forced on html/body elements
3. **useSearchParams SSR error**: Must wrap component using it with Suspense boundary
4. **Stripe build failures**: Functions gracefully handle missing env vars with null checks

### Type Safety Patterns
- Avoid `any` types - use proper type assertions or unions
- Error handling: Check `error instanceof Error` before accessing `.message`
- React hooks: Include all dependencies or use `// eslint-disable-next-line react-hooks/exhaustive-deps`

### Database Schema
Main tables (when Supabase is connected):
- `profiles`: User data linked to auth.users
- `models`: 3D model metadata including pricing, stats, tags
- `comments`, `likes`, `follows`: Social interactions
- `transactions`: Purchase/tip records via Stripe

### Deployment Notes
- Vercel deployment requires all environment variables set in dashboard
- Build must pass TypeScript checks and ESLint warnings
- Static pages generated for `/`, `/search`, `/upload`
- Dynamic routes for `/user/[username]`, `/view/[id]`