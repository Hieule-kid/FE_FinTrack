# FE FinTrack

Frontend scaffold for FinTrack built with Next.js 16, TypeScript, App Router, and SCSS.

## Tech Stack

- Next.js 16.2.4 (App Router)
- React 19
- TypeScript
- SCSS (`sass`)
- ESLint + Prettier

## Quick Start

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint and formatting checks:

```bash
npm run lint
npm run format:check
```

## Scripts

- `npm run dev`: start dev server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: run ESLint
- `npm run format`: write formatting with Prettier
- `npm run format:check`: verify formatting

## Project Structure

```text
FE_FinTrack/
├── public/                 # Static public assets
├── src/
│   ├── app/                # Routing layer (keep thin)
│   │   ├── layout.tsx      # Root app shell with shared header/footer
│   │   ├── page.tsx        # Main landing UI (/)
│   │   ├── (auth)/         # Route group for auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/      # Main dashboard route
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── (protected)/    # Additional protected group
│   │   │   └── admin/page.tsx
│   │   └── api/            # Internal route handlers
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── profile/route.ts
│   │       ├── health/route.ts
│   │       └── user/route.ts
│   ├── components/
│   │   ├── ui/             # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   └── common/         # Shared structural components
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       └── page-container.tsx
│   ├── features/           # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── server/
│   │   │   ├── actions.ts
│   │   │   ├── service.ts
│   │   │   ├── store.ts
│   │   │   └── types.ts
│   ├── hooks/              # Shared hooks (ex: useDebounce)
│   ├── lib/                # Shared utilities/helpers
│   ├── services/           # API layer (HTTP client/interceptors)
│   ├── config/             # Environment, routes, cookies
│   ├── styles/             # SCSS variables and mixins
│   ├── types/              # Shared TS types
│   ├── utils/              # Pure helper functions
│   └── proxy.ts
```

## Current Routes

- `/` auth gate that redirects to `/dashboard` when logged in or `/login` when not
- `/login` and `/register` auth pages
- `/dashboard` main authenticated workspace
- `/admin` protected admin page
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/profile` auth proxy routes
- `/api/planning/*` planning proxy routes (auth cookie required)
- `/api/health` health check route
- `/api/user` sample internal API route

## Auth Guard (Proxy)

- Guard logic is implemented in `src/proxy.ts`.
- Requests to `/dashboard/*` and `/admin/*` require `access_token` cookie.
- `/admin/*` also checks role from `roles` cookie.

## Notes

- Main UI uses reusable shell components from `src/components/common` and primitives from `src/components/ui`.
- Auth pages use feature components from `src/features/auth/components`.
- Auth route handlers are thin proxies that call the backend through `src/features/auth/server/auth.facade.ts` and `src/features/auth/server/auth-backend.service.ts`.
- Home route is an auth gate in `src/app/page.tsx`.
- Login route also redirects authenticated users to `/dashboard`.
- Dashboard route uses `src/app/dashboard/page.tsx` and `src/app/dashboard/loading.tsx`.
- API health sample route is available at `/api/health`.

## SCSS Setup

- Global styles entry: `src/app/globals.scss`.
- Shared SCSS variables: `src/styles/_variables.scss`.
- Shared SCSS mixins: `src/styles/_mixins.scss`.
- `globals.scss` uses `@use` to import variables/mixins and expose core design tokens via CSS variables.

## JWT HttpOnly Cookie Strategy

- JWT is no longer stored in `localStorage`.
- Frontend talks to internal Next Route Handlers:
  - `POST /api/auth/login`: authenticate with backend, then set HttpOnly cookies (`access_token`, `refresh_token`, `roles`).
  - `GET /api/auth/profile`: read `access_token` cookie server-side, attach Bearer token to backend request.
  - `POST /api/auth/logout`: proxy logout to backend and clear auth cookies.
- Client HTTP requests use `credentials: include` so browser sends cookies automatically.
- `src/proxy.ts` guards `/dashboard/*` and `/admin/*` by checking auth cookies.

### Required Environment Variables

- `AUTH_SERVICE_BASE_URL`: auth-service base URL used by server-side auth Route Handlers (ex: `http://localhost:8081`).
- `PLANNING_SERVICE_BASE_URL`: planning-service base URL used by `/api/planning/*` proxy (ex: `http://localhost:8090`).
- `NEXT_PUBLIC_API_BASE_URL`: optional gateway/public base URL for client-side calls (ex: `http://localhost:8088`).
- `API_BASE_URL`: optional legacy fallback used when service-specific variables are not set.
