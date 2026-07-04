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
yarn install
```

Run development server:

```bash
yarn dev
```

Build for production:

```bash
yarn build
```

Run lint and formatting checks:

```bash
yarn lint
yarn format:check
```

## Scripts

- `yarn dev`: start dev server
- `yarn build`: production build
- `yarn start`: run production server
- `yarn lint`: run ESLint
- `yarn format`: write formatting with Prettier
- `yarn format:check`: verify formatting

## Project Structure (Updated)

```text
my-next-app/
├── public/                 # Static public assets (images, icons, fonts)
├── src/
│   ├── app/                # Routing layer (keep thin)
│   │   ├── layout.tsx      # Root app shell (header/footer + children)
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
│   │   │   ├── actions.ts
│   │   │   ├── service.ts
│   │   │   ├── store.ts
│   │   │   └── types.ts
│   │   └── dashboard/
│   │       └── plan-overview.tsx
│   ├── hooks/              # Shared hooks (ex: useDebounce)
│   ├── lib/                # Shared utilities/helpers
│   ├── services/           # API layer (HTTP client/interceptors)
│   ├── config/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── proxy.ts
```

## Auth Guard (Proxy)

- Guard logic is implemented in `src/proxy.ts`.
- Requests to `/dashboard/*` and `/admin/*` require `access_token` cookie.
- `/admin/*` also checks role from `roles` cookie.

## Notes

- Main UI has been refreshed with reusable layout and design tokens.
- Dashboard route now uses `src/app/dashboard/page.tsx` and `loading.tsx`.
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
  - `GET /api/auth/me`: read `access_token` cookie server-side, attach Bearer token to backend request.
  - `POST /api/auth/logout`: clear auth cookies.
- Client HTTP requests use `credentials: include` so browser sends cookies automatically.
- `src/proxy.ts` guards `/dashboard/*` and `/admin/*` by checking auth cookies.

### Required Environment Variables

- `API_BASE_URL`: backend base URL for server-side auth Route Handlers.
- `NEXT_PUBLIC_API_BASE_URL`: optional public base URL for other client-side API calls.

# FinTrack_POC
