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

## Project Structure

```text
src/
	app/
		(public)/
			login/
			register/
		(protected)/
			dashboard/
			admin/
		api/
		layout.tsx
		middleware.ts
		page.tsx
	modules/
		auth/
	services/
	store/
	config/
	types/
	utils/
	proxy.ts
```

## Auth Guard (Proxy)

- Guard logic is implemented in `src/proxy.ts`.
- Requests to `/dashboard/*` and `/admin/*` require `access_token` cookie.
- `/admin/*` also checks role from `roles` cookie.

## Notes

- Home page (`/`) is currently a static landing page while backend API is not connected.
- API health sample route is available at `/api/health`.
