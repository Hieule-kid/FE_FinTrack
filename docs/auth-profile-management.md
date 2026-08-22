# User Profile Management

## Overview
Added comprehensive user profile and currency management features to FinTrack. Users can now view and update their profile information (name, email) and preferred currency from the settings page.

## Changes

### Auth Types (`src/features/auth/types.ts`)
- Enhanced `AuthUser` interface with `fullName` and `currency` fields
- Added new types:
  - `UpdateUserProfileRequest` — for profile updates (fullName, email)
  - `UpdateCurrencyRequest` — for currency preference updates

### Auth Service (`src/features/auth/service.ts`)
- Added `profile()` — fetch user profile
- Added `updateProfile(payload)` — update user profile information
- Added `updateCurrency(payload)` — update user's currency preference

### Auth Facade (`src/features/auth/server/auth.facade.ts`)
- Mirrored service methods at server layer:
  - `profile(accessToken)` — GET `/api/v1/users/profile`
  - `updateProfile(accessToken, payload)` — PUT `/api/v1/users/profile`
  - `updateCurrency(accessToken, payload)` — PATCH `/api/v1/users/currency`

### BFF Route (`src/app/api/users/profile/route.ts`)
- New GET endpoint — fetch user profile (requires auth)
- New PUT endpoint — update user profile (requires auth)
- Both handle 401 errors by clearing auth cookies

### Settings Page (`src/app/settings/page.tsx`)
- New user settings interface
- Profile section — edit name and email
- Currency selector — choose between USD and VND
- State sync from profile hook into form fields
- Save and cancel functionality with error handling

## Fixed Issues ✅
1. **State sync** — Settings page now compares `profile !== syncedProfile` (identity check) instead of a one-time `!syncedProfile` guard, so it re-syncs correctly if profile updates later (e.g. after save) while remaining a stable render-time state adjustment (React's documented "adjusting state when a prop changes" pattern — not an effect, so no cascading render).
2. **Image path** — Changed `src="../globe.svg"` to `src="/globe.svg"` to correctly resolve from `public/globe.svg`.
3. **Button disabled class** — Removed non-functional `"ui-button:disabled"` class string (CSS pseudo-classes can't be applied as literal class names). The native `disabled` HTML attribute plus the existing `.ui-button:disabled` CSS rule in `globals.scss` already handle disabled styling correctly.

## API Flow
```
Settings Page (client)
  → useProfile() hook (gets cached profile)
  → setState with profile data
  → on save: authService.updateProfile()
    → BFF: PUT /api/users/profile
    → Backend: PUT /api/v1/users/profile (with Bearer token)
```

## Currency Support
- Supported: USD, VND
- Stored in `AuthUser.currency`
- Updated via separate `updateCurrency()` endpoint
