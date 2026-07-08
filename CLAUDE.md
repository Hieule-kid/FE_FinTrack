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
| `src/app/api/auth/*` | BFF proxy → `AUTH_SERVICE_BASE_URL` (default :8081) |
| `src/app/api/planning/[...path]` | Catch-all proxy → `PLANNING_SERVICE_BASE_URL` (default :8090) |

### Key patterns
- **BFF proxy pattern**: all backend calls go through Next.js API routes; the browser never hits backend services directly.
- **HttpOnly cookies**: `access_token` (15 min), `refresh_token` (7 days), `roles` (1 day). Tokens never exposed to client JS.
- **Auth guard**: `src/proxy.ts` exports Next.js middleware (checks cookie, redirects to `/login` if missing; checks roles for `/admin`).
- **Feature-sliced layout**: auth lives entirely in `src/features/auth/` (server/, components/, hooks/, store, service, types).
- **Client HTTP**: `src/services/http.ts` — fetch wrapper with `credentials: "include"`. Any 401 triggers silent logout via `src/services/interceptor.ts`.
- **In-memory auth state**: `src/features/auth/store.ts` is a plain module-level object (not React state). Survives navigation but does not trigger re-renders.

### Environment variables
| Variable | Default | Used by |
|----------|---------|---------|
| `AUTH_SERVICE_BASE_URL` | `http://localhost:8081` | auth API routes |
| `PLANNING_SERVICE_BASE_URL` | `http://localhost:8090` | planning proxy |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8088` | client http service |
| `NEXT_PUBLIC_APP_NAME` | `FinTrack` | display name |

## Known issues / open work
- **Proxy convention**: Next.js 16 uses `src/proxy.ts` (not `middleware.ts`) as the route guard entry point. This is already correct in the project.
- **`/api/user` stub**: returns hardcoded demo data, no auth check. Needs wiring to real profile API or removal.
- **Role case mismatch risk**: register form sends `"USER"` / `"ADMIN"` (uppercase); middleware checks `"admin"` (lowercase). Verify backend normalizes role values.
- **`src/features/auth/actions.ts`**: server action stubs not wired to real backend — do not use for real auth flows.
- **`src/store/index.ts` (`appStore`)**: scaffold, not wired anywhere.
- **Planning proxy**: missing try/catch around `fetch()` — network errors will throw unhandled exceptions.
- **Stray file**: `src/app/api/auth/login/fintrackfe.code-workspace` should be removed.

## Docs
- `docs/auth-login-flow.md` — full sequence diagram and step-by-step description of the login BFF flow.
