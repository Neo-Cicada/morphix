# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morphix is an AI-powered video creation platform ("Transform your product into cinema"). Users describe animations in natural language; AI generates Remotion TSX code that compiles and previews in-browser.

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
- **Editor** at `src/components/dashboard/EditorPage.tsx` — AI chat panel, Monaco code editor, animation preview, export. Uses `useAnimationState`, `useGenerationApi` hooks.
- **AnimationPlayer** at `src/components/dashboard/AnimationPlayer.tsx` — wraps `@remotion/player` for compiled components
- **In-browser compiler** at `src/remotion/compiler.ts` — strips imports, replaces exports, runs Babel (TSX→JS) via `@babel/standalone`, executes via `new Function()` with injected Remotion globals
- **Next.js API routes** at `src/app/api/`:
  - `POST /api/generate` — AI code generation via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`); initial generation streams TSX, follow-ups use `generateObject` for structured edits
  - `POST /api/render` — triggers Remotion Lambda render (`@remotion/lambda/client`)
- **API client** at `src/lib/api.ts` — typed fetch wrapper that auto-attaches Supabase JWT and retries on 401
- **UserContext** at `src/contexts/UserContext.tsx` — wraps `DashboardLayout`, exposes `useUser()` hook
- **Supabase helpers** at `src/utils/supabase/` — `client.ts` (browser), `server.ts` (RSC), `middleware.ts` (auth gating)
- **Path alias**: `@/*` maps to `src/*`

### AI Code Generation Flow

1. User types prompt → `useGenerationApi.generate()` POSTs to `/api/generate`
2. **Initial generation**: streams raw TSX (no imports, no markdown fences); `useAnimationState.setCode()` compiles via `compiler.ts` using Babel
3. **Follow-up edits**: `generateObject` returns structured `{type: 'edit'|'full', edits: [{old_string, new_string}]}` applied via string replacement
4. **Auto-correction** (`useAutoCorrection`): on compile error, retries up to 3 times with error context as `isFollowUp`
5. Compiled `Component` passed to `AnimationPlayer` → `@remotion/player`

**Globals injected into generated code**: `React`, all Remotion exports (`AbsoluteFill`, `useCurrentFrame`, `spring`, `interpolate`, etc.), `RemotionShapes`, `RemotionTransitions`. For 3D: `THREE` (Three.js), `ThreeCanvas` (`@remotion/three`), `useThree`, `extend` (R3F), and Drei components (`Box`, `Sphere`, `Plane`, `Torus`, `Cylinder`, `Cone`, `RoundedBox`, `MeshDistortMaterial`, `MeshWobbleMaterial`, `Environment`, `Stars`, `Float`, `Center`, `Text`, `PerspectiveCamera`). Generated code must NOT write import statements.

**Critical constraint for generated code**: Never use `useFrame` (R3F hook) — drive all 3D animation from `useCurrentFrame()` instead. Never shadow banned globals: `spring`, `interpolate`, `useCurrentFrame`, `useVideoConfig`, `AbsoluteFill`, `Sequence`.

**Multimodal support**: `/api/generate` accepts optional `frameImages: string[]` (base64 JPEG) alongside `prompt` for vision-based editing. Model used: `claude-sonnet-4-6`.

**Component naming**: compiler looks for `MyAnimation` first, then `__defaultExport`, then last declared PascalCase name.

### Backend
- Express app at `src/index.ts`, port 8000, with Helmet, CORS, Morgan, rate limiting
- All routes prefixed `/api/v1/`
- `requireAuth` middleware (`src/middleware/auth.ts`) verifies Supabase JWTs, attaches `req.user` as `AuthenticatedRequest`
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
| POST | `/api/v1/videos/:id/render` | Start render (fire-and-forget, local FFmpeg) |
| GET | `/api/v1/videos/:id/render-status` | Poll render status |
| GET | `/api/v1/templates` | List scene templates |
| POST | `/api/v1/templates` | Create scene template |
| DELETE | `/api/v1/templates/:id` | Delete scene template |
| POST | `/api/v1/ai/edit` | AI scene editing (legacy) |

**Frontend-only API routes** (Next.js, authenticated via Supabase session):
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | AI animation code generation (streaming + structured edits) |
| POST | `/api/render` | Remotion Lambda render trigger |

## Auth Flow

1. Frontend: Supabase SSR sets session cookies. `src/middleware.ts` gates dashboard routes.
2. API calls: `src/lib/api.ts` reads session and sets `Authorization: Bearer <JWT>`.
3. Backend: `requireAuth` middleware validates JWT, extracts `sub`/`email`/`role`.
4. On 401, the API client auto-refreshes the Supabase session and retries.
5. Next.js API routes (`/api/*`): authenticated via `createClient()` + `supabase.auth.getSession()`.

## Render Pipelines

**Local (backend Express)**: Editor → `POST /api/v1/videos/:id/render` → `renderWorker.ts` bundles + renders via headless Chrome/FFmpeg → uploads to Supabase Storage `renders` bucket → poll `/api/v1/videos/:id/render-status`

**Lambda (Next.js API route)**: Editor → `POST /api/render` → `renderMediaOnLambda()` → polls `getRenderProgress()` until done → returns `{ url }`. Requires `REMOTION_FUNCTION_NAME` and `REMOTION_SERVE_URL` in `.env.local`.

## Key Environment Variables

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (backend URL, e.g. `http://localhost:8000`)
- `ANTHROPIC_API_KEY` — used by `/api/generate` route via `@ai-sdk/anthropic`
- `REMOTION_REGION`, `REMOTION_FUNCTION_NAME`, `REMOTION_SERVE_URL` — for Lambda rendering

**Backend** (`.env`):
- `SUPABASE_JWT_SECRET` — for JWT verification
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for Storage uploads
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL (pooled + direct)
- `FRONTEND_URL` — for CORS origin allowlist
