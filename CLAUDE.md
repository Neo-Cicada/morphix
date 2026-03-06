# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morphix is an AI-powered video creation platform ("Transform your product into cinema"). Users create marketing videos via a multi-step wizard, edit them in a Remotion-based timeline editor, and use AI (Anthropic) for scene editing.

## Monorepo Structure

```
morphix/
├── frontend/   # Next.js 16 app (port 3000)
└── backend/    # Express 5 REST API (port 8000)
```

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (`cd backend`)
```bash
npm run dev      # Start Express with tsx watch
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled dist/index.js
```

### Database (`cd backend`)
```bash
npx prisma generate        # Regenerate Prisma client (required after schema changes)
npx prisma migrate dev     # Run migrations in development
npx prisma studio          # Open Prisma Studio GUI
```

## Architecture

### Frontend
- **App Router** at `src/app/` — pages: landing (`/`), auth (`/login`, `/signup`), dashboard (`/dashboard`, `/dashboard/editor`, `/dashboard/videos`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/new`)
- **Editor** at `src/components/dashboard/EditorPage.tsx` — main timeline editor UI, scene state, drag/trim, AI chat panel, undo/redo, media upload, waveform
- **Remotion** at `src/remotion/` — video composition for live preview via `@remotion/player`
- **API client** at `src/lib/api.ts` — typed fetch wrapper that auto-attaches Supabase JWT and retries on 401
- **UserContext** at `src/contexts/UserContext.tsx` — wraps `DashboardLayout`, exposes `useUser()` hook
- **Supabase helpers** at `src/utils/supabase/` — `client.ts` (browser), `server.ts` (RSC), `middleware.ts` (auth gating)
- **Path alias**: `@/*` maps to `src/*`

### Backend
- Express app at `src/index.ts`, port 8000, with Helmet, CORS, Morgan, rate limiting
- All routes prefixed `/api/v1/`
- `requireAuth` middleware (`src/middleware/auth.ts`) verifies Supabase JWTs, attaches `req.user` as `AuthenticatedRequest`
- AI scene editing at `src/controllers/ai.ts` — calls Anthropic SDK with an inline `SYSTEM_PROMPT` containing motion design rules and the scene schema
- Prisma singleton at `src/lib/prisma.ts` using `@prisma/adapter-pg` driver adapter

### Database (PostgreSQL via Prisma)
Source of truth: `backend/prisma/schema.prisma`

| Model | Table | Notes |
|-------|-------|-------|
| `User` | `profiles` | `id` is Supabase auth UUID |
| `VideoJob` | `video_jobs` | Stores form data, scene JSON (`production_doc`), render status, output URL |
| `Screenshot` | `screenshots` | Attached to VideoJob |
| `Transaction` | `transactions` | Credits ledger |
| `Template` | `templates` | User-saved or preset scenes; `scene_json` holds full Scene object |

`VideoJob` has render columns added via **raw SQL** (not Prisma migrations, due to Supabase auth cross-schema FK issue): `render_status`, `render_error`, `render_started_at`, `render_completed_at`.

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/users/me` | Current user profile |
| PATCH | `/api/v1/users/me` | Update user profile |
| GET | `/api/v1/videos` | List user's videos |
| GET | `/api/v1/videos/stats` | Video stats |
| POST | `/api/v1/videos` | Create video job |
| POST | `/api/v1/videos/:id/render` | Start render (fire-and-forget) |
| GET | `/api/v1/videos/:id/render-status` | Poll render status |
| GET | `/api/v1/templates` | List scene templates |
| POST | `/api/v1/templates` | Create scene template |
| DELETE | `/api/v1/templates/:id` | Delete scene template |
| POST | `/api/v1/ai/edit` | AI scene editing |

## Auth Flow

1. Frontend: Supabase SSR sets session cookies. `src/middleware.ts` gates dashboard routes.
2. API calls: `src/lib/api.ts` reads session and sets `Authorization: Bearer <JWT>`.
3. Backend: `requireAuth` middleware validates JWT, extracts `sub`/`email`/`role`.
4. On 401, the API client auto-refreshes the Supabase session and retries.

## Remotion Scene System

The scene data model is defined in **two identical copies** that must be kept in sync:
- `frontend/src/remotion/schema.ts` — has `'use client'` directive, exports `DEFAULT_SCENE`
- `backend/src/remotion/schema.ts` — no `'use client'`, used for server-side rendering

**Key constraint**: `SceneKeyframe.frame` values are **relative to the layer's `from`** (0 = first frame of that layer). `useKeyframes.ts` uses linear `interpolate()` only — no easing or spring support in the current keyframe system.

**Composition**: `backend/src/remotion/` is a copy of the frontend Remotion files without `'use client'` directives, used by the render worker for server-side bundling. `backend/tsconfig.json` has `"jsx": "react"` for this reason.

## Render Pipeline

1. Editor POSTs scene JSON to `/api/v1/videos/:id/render`
2. `renderWorker.ts` bundles `backend/src/remotion/index.tsx` via `@remotion/bundler`, renders via `@remotion/renderer` (headless Chrome + FFmpeg locally), uploads MP4 to Supabase Storage bucket `renders` (must be public)
3. Frontend polls `/api/v1/videos/:id/render-status` every 3s
4. Output URL stored in `VideoJob.output_url`

Supabase Storage requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

## Key Environment Variables

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (backend URL, e.g. `http://localhost:8000`)

**Backend** (`.env`):
- `SUPABASE_JWT_SECRET` — for JWT verification
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for Storage uploads
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL (pooled + direct)
- `FRONTEND_URL` — for CORS origin allowlist
