@AGENTS.md

# FinTrack FE — Project Context

## Stack
- **Next.js 16.2.4** with App Router (React 19, TypeScript, Tailwind CSS v4, SCSS)
- No test framework currently configured
- Prettier + ESLint enforced; run `yarn format` and `yarn lint`

## Architecture

### Route structure
| Path | Purpose |
|------|---------|
| `src/app/(auth)/` | Public auth pages (login, register) |
| `src/app/(protected)/` | Role-gated pages (admin) |
| `src/app/dashboard/` | Main authenticated view |
| `src/app/plan/create/` | Create savings plan page |
| `src/app/api/auth/*` | BFF proxy → `AUTH_SERVICE_BASE_URL` (default `localhost:8081`) |
| `src/app/api/planning/[...path]` | Catch-all BFF proxy → `PLANNING_SERVICE_BASE_URL` — used by client-side fetch only |

### Key patterns
- **BFF proxy pattern**: all backend calls go through Next.js API routes or server actions; the browser never hits backend services directly.
- **HttpOnly cookies**: `access_token` (15 min), `refresh_token` (7 days), `roles` (1 day). Tokens never exposed to client JS.
- **Auth guard**: `src/proxy.ts` exports Next.js middleware (checks cookie, redirects to `/login` if missing; checks roles for `/admin`).
- **Feature-sliced layout**: auth lives entirely in `src/features/auth/` (server/, components/, hooks/, store, service, types). Planning lives in `src/features/planning/`.
- **Client HTTP**: `src/services/http.ts` — fetch wrapper with `credentials: "include"`. Any 401 triggers silent logout via `src/services/interceptor.ts`.
- **In-memory auth state**: `src/features/auth/store.ts` is a plain module-level object (not React state). Survives navigation but does not trigger re-renders.

### Planning service call path

Planning calls use **Next.js server actions** (`"use server"`), not the BFF proxy route. The chain is:

```
page.tsx (client)
  → createPlan() in features/planning/server/planning.facade.ts   ("use server")
    → planningService.createPlan() in features/planning/server/planning.service.ts
      → fetch(`${PLANNING_SERVICE_BASE_URL}/api/v1/plans`, { Authorization: Bearer <token> })
```

`PLANNING_SERVICE_BASE_URL` points directly to the planning-service (no API gateway). Server actions run server-side, so the URL is never exposed to the browser.

The `/api/planning/[...path]` BFF route exists separately for any future client-side planning calls but is not currently used by the plan creation flow.

### Environment variables
| Variable | Default | Used by |
|----------|---------|---------|
| `AUTH_SERVICE_BASE_URL` | `http://localhost:8081` | Server-side auth BFF routes |
| `PLANNING_SERVICE_BASE_URL` | `http://localhost:8090` | Planning server actions (direct to service) |
| `NEXT_PUBLIC_API_BASE_URL` | `""` (empty = relative URLs) | Client-side http service base URL |
| `NEXT_PUBLIC_APP_NAME` | `FinTrack` | Display name |

### Local dev `.env.local` (current setup)
```
# Client-side base URL — empty = use relative URLs (calls Next.js BFF routes on same origin)
# Set to your LAN IP if testing from other devices, e.g. http://192.168.1.190:3000
NEXT_PUBLIC_API_BASE_URL=

# BFF server-side → direct to each service (no gateway)
AUTH_SERVICE_BASE_URL=http://localhost:8081
PLANNING_SERVICE_BASE_URL=http://localhost:8090
```

Server actions call each backend service directly. There is no API gateway — CORS is handled by each service's `SecurityConfig` via the `FRONTEND_ORIGIN` env var on the backend.

## Known issues / open work
- **`/api/user` stub**: returns hardcoded demo data, no auth check. Needs wiring to real profile API or removal.
- **Role case mismatch risk**: register form sends `"USER"` / `"ADMIN"` (uppercase); middleware checks `"admin"` (lowercase). Verify backend normalizes role values.
- **`src/features/auth/actions.ts`**: server action stubs not wired to real backend — do not use for real auth flows.
- **`src/store/index.ts` (`appStore`)**: scaffold, not wired anywhere.
- **Planning proxy** (`/api/planning/[...path]`): missing try/catch around `fetch()` — network errors will throw unhandled exceptions if this route is ever used client-side.
- **Stray file**: `src/app/api/auth/login/fintrackfe.code-workspace` should be removed.

## Docs
- `docs/auth-login-flow.md` — full sequence diagram and step-by-step description of the login BFF flow.
