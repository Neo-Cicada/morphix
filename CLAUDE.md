# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morphix is an AI-powered video creation platform ("Transform your product into cinema"). Users create marketing videos via a multi-step wizard, edit them in a Remotion-based timeline editor, and use AI (Anthropic) for scene editing.

## Monorepo Structure

```
morphix/
├── frontend/   # Next.js 16 app (port 3000)
└── backend/    # Express 5 REST API (port 3001 or similar)
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
- **App Router** at `src/app/` — pages for landing, auth, dashboard routes (editor, videos, billing, settings, new)
- **Remotion** at `src/remotion/` — video composition with `schema.ts` (scene/layer/keyframe types), `MorphixVideo.tsx`, `useKeyframes.ts`, and `layers/` (Text, Image, Shape)
- **API client** at `src/lib/api.ts` — typed fetch wrapper that auto-attaches Supabase JWT and retries on 401
- **UserContext** at `src/contexts/UserContext.tsx` — wraps `DashboardLayout`, exposes `useUser()` hook
- **Supabase helpers** at `src/utils/supabase/` — `client.ts` (browser), `server.ts` (RSC), `middleware.ts` (auth gating)
- **Path alias**: `@/*` maps to `src/*`

### Backend
- Express app at `src/index.ts` with Helmet, CORS, Morgan, rate limiting
- All routes prefixed `/api/v1/`
- `requireAuth` middleware (`src/middleware/auth.ts`) verifies Supabase JWTs via `SUPABASE_JWT_SECRET`, attaches `req.user` as `AuthenticatedRequest`
- AI scene editing controller at `src/controllers/ai.ts` calls Anthropic SDK
- Prisma singleton at `src/lib/prisma.ts` using `@prisma/adapter-pg` driver adapter

### Database (PostgreSQL via Prisma)
Models: `User` (mapped to `profiles`), `VideoJob`, `Screenshot`, `Transaction`

- `User.id` is the Supabase auth UUID
- `VideoJob` holds the full creation form data + status + output URL
- Credits system: `User.credit_balance`, `Transaction` records

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/users/me` | Current user profile |
| PATCH | `/api/v1/users/me` | Update user profile |
| GET | `/api/v1/videos` | List user's videos |
| GET | `/api/v1/videos/stats` | Video stats |
| POST | `/api/v1/videos` | Create video job |
| POST | `/api/v1/ai/edit-scene` | AI scene editing |

## Auth Flow

1. Frontend: Supabase SSR sets session cookies. `src/middleware.ts` gates dashboard routes.
2. API calls: `src/lib/api.ts` reads session and sets `Authorization: Bearer <JWT>`.
3. Backend: `requireAuth` middleware validates JWT, extracts `sub`/`email`/`role`.
4. On 401, the API client auto-refreshes the Supabase session and retries.

## Key Environment Variables

**Frontend** (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

**Backend** (`.env`): `SUPABASE_JWT_SECRET`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `DIRECT_URL`
