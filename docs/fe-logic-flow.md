# FinTrack FE — Logic Flow & Business Summary

> Audience: Backend / API team.
> Purpose: Understand how the FE drives each feature so you can verify your API responses match expectations.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Auth Flow](#2-auth-flow)
   - 2.1 [Login](#21-login)
   - 2.2 [Register](#22-register)
   - 2.3 [Logout](#23-logout)
   - 2.4 [Profile](#24-profile)
3. [Route Guard (Middleware)](#3-route-guard-middleware)
4. [Planning Proxy](#4-planning-proxy)
5. [Dashboard](#5-dashboard)
6. [Plan Creation Form](#6-plan-creation-form)
7. [API Contract Reference](#7-api-contract-reference)
   - 7.1 [Request / Response shapes](#71-request--response-shapes)
   - 7.2 [Cookie contract](#72-cookie-contract)
   - 7.3 [Error handling](#73-error-handling)
8. [Environment Variables](#8-environment-variables)
9. [Known Gaps / Open Items](#9-known-gaps--open-items)

---

## 1. Architecture Overview

```
Browser
  │  (HttpOnly cookies only — no tokens in JS)
  ▼
Next.js (BFF layer)
  ├─ /api/auth/*          ──►  AUTH_SERVICE_BASE_URL  (auth microservice)
  ├─ /api/planning/*      ──►  PLANNING_SERVICE_BASE_URL  (planning microservice)
  └─ /api/users/*         ──►  AUTH_SERVICE_BASE_URL  (user profile)
```

- The browser **never** calls the backend directly.
- All tokens live in server-set **HttpOnly cookies** (`accessToken`, `refreshToken`, `roles`). Client JS cannot read them.
- Next.js API routes act as a BFF (Backend-for-Frontend): they read cookies, attach `Authorization` headers, proxy the request, and write/clear cookies on behalf of the browser.

---

## 2. Auth Flow

### 2.1 Login

```
Browser                   Next.js BFF                 Auth Service
   │                          │                             │
   │── POST /api/auth/login ──►│                             │
   │   { emailOrUsername,      │── POST /api/v1/auth/login ─►│
   │     password }            │   { emailOrUsername,        │
   │                          │     password }              │
   │                          │◄── { accessToken,           │
   │                          │      refreshToken?,          │
   │                          │      user?, roles? }         │
   │                          │                             │
   │                          │  (normalize token field names)
   │                          │  Set-Cookie: accessToken (HttpOnly, 15 min)
   │                          │  Set-Cookie: refreshToken (HttpOnly, 7 days)
   │                          │  Set-Cookie: roles (HttpOnly, 1 day)
   │◄── { authenticated:true, │
   │      user: AuthUser }     │
```

**Token normalization:** The BFF accepts any of these field names from the backend:

| Field checked | Nested paths also searched |
|---|---|
| `accessToken`, `access_token`, `token`, `jwt`, `jwtToken` | `data`, `result`, `payload`, `body` |
| `refreshToken`, `refresh_token` | same nested paths |

**If `accessToken` is missing** in the backend response, the BFF returns `502 { message: "Missing access token from auth API" }`.

**Roles:** extracted from `response.roles` or `response.user.roles` and stored as a comma-separated string in the `roles` cookie.

---

### 2.2 Register

```
Browser                   Next.js BFF                 Auth Service
   │                          │                             │
   │── POST /api/auth/register►│── POST /api/v1/auth/register►│
   │   { fullName?, username,  │   (same body forwarded)     │
   │     email, password,      │                             │
   │     role, currency }      │◄── HTTP status + body ──────│
   │◄── same status + body ───│                             │
```

- FE sends `role` as `"USER"` or `"ADMIN"` (uppercase strings from a select input).
- No cookies are set on register — the user must log in separately.
- On success the FE shows a success message and redirects to `/login`.

---

### 2.3 Logout

```
Browser                   Next.js BFF                 Auth Service
   │                          │                             │
   │── POST /api/auth/logout ─►│── POST /api/v1/auth/logout ►│
   │                          │   Authorization: Bearer <accessToken>
   │                          │◄── (any response) ──────────│
   │                          │  Clear-Cookie: accessToken
   │                          │  Clear-Cookie: refreshToken
   │                          │  Clear-Cookie: roles
   │◄── { authenticated:false }│
```

Cookies are **always** cleared regardless of whether the backend logout call succeeds.

---

### 2.4 Profile

```
Browser                   Next.js BFF                 Auth Service
   │                          │                             │
   │── GET /api/users/profile ►│── GET /api/v1/users/profile ►│
   │                          │   Authorization: Bearer <accessToken>
   │                          │◄── AuthUser (wrapped envelope)│
   │◄── AuthUser ─────────────│                             │
```

- Returns `401` if `accessToken` cookie is absent.
- On `401` from the backend, also clears all three cookies.
- On success, refreshes the `roles` cookie if roles are present in the returned user object.

---

## 3. Route Guard (Middleware)

File: `src/proxy.ts` — runs at the Edge on every request matching `/dashboard/**` and `/admin/**`.

```
Request to /dashboard/* or /admin/*
       │
       ▼
  accessToken cookie present?
       │ No ──► redirect /login
       │ Yes
       ▼
  path starts with /admin?
       │ No ──► allow through
       │ Yes
       ▼
  roles cookie contains "admin"?  (lowercase check)
       │ No ──► redirect /dashboard
       │ Yes ──► allow through
```

**Important:** The `roles` cookie value is expected to be a **lowercase comma-separated string** (e.g., `"user"` or `"admin,user"`). The register form sends `"USER"` / `"ADMIN"` (uppercase) — the backend must normalize these to lowercase before the FE stores them in the cookie.

---

## 4. Planning Proxy

All requests to `/api/planning/<any-path>` are forwarded to the planning microservice.

```
GET /api/planning/plans?userId=123
       │
       ▼
  accessToken cookie present? No ──► 401
       │ Yes
       ▼
  Forward to: ${PLANNING_SERVICE_BASE_URL}/plans?userId=123
  Headers forwarded (minus host, cookie, content-length)
  Added: Authorization: Bearer <accessToken>
       │
       ▼
  Return upstream response (strip content-encoding, transfer-encoding)
```

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

**Error codes:**
| Scenario | Status returned to browser |
|---|---|
| `PLANNING_SERVICE_BASE_URL` not set | `500` |
| No `accessToken` cookie | `401` |
| Network error reaching planning service | `502` |
| Any other upstream error | upstream status forwarded |

---

## 5. Dashboard

> Current state: **static mock data only.** No API calls are wired yet.

| Card | Displayed value | Source |
|---|---|---|
| Total Target | $6,000.00 | Hardcoded |
| Active Plans | 1 | Hardcoded |
| Plans Completed | 1 | Hardcoded |

Active plans and completed plans are also rendered from hardcoded arrays.

**Intended interaction:** The "New Plan" button navigates to `/plan/create`.

---

## 6. Plan Creation Form

Page: `/plan/create`

### Form fields and business rules

| Field | Type | Notes |
|---|---|---|
| Category | Select (8 options) | Drives default title, suggested timeframe, and preset durations |
| Title | Text | Pre-filled from category's `defaultTitle`; user-editable |
| Target Amount | Number | Formatted by currency config (VND: integer, USD: 2 decimals) |
| Timeframe | Chip select | `short` (3–11 mo), `mid` (12–60 mo), `long` (72–240 mo) |
| Duration | Chip select or custom number | Presets per timeframe; user can enter custom months |
| Target Date | Month picker | Converts `YYYY-MM` → months from today → sets duration |
| Frequency | Radio | `monthly` or `daily` |
| Savings per period | Number | Auto-calculated; user can override (triggers reverse-calc of target) |
| Currency | Driven by user profile | `USD` or `VND`; read from `useProfile()` |

### Auto-calculation logic

```
savingsPerPeriod = targetAmount / duration              (frequency = monthly)
savingsPerPeriod = targetAmount / (duration × 30)       (frequency = daily)
```

If the user edits `savingsPerPeriod` manually, the form reverse-calculates `targetAmount`:

```
targetAmount = savingsPerPeriod × duration              (monthly)
targetAmount = savingsPerPeriod × (duration × 30)       (daily)
```

### Categories

| ID | Label | Default timeframe |
|---|---|---|
| `emergency` | Emergency Fund | short |
| `travel` | Travel | short |
| `house` | Buy a House | long |
| `car` | Buy a Car | mid |
| `education` | Education | mid |
| `wedding` | Wedding | short |
| `retirement` | Retirement | long |
| `other` | Other | mid |

### Duration presets by timeframe

| Timeframe | Preset options (months) |
|---|---|
| short | 3, 6, 9, 11 |
| mid | 12, 24, 36, 60 |
| long | 72, 120, 180, 240 |

### Validation

- Duration must fall within the selected timeframe range.
- Savings per period must be > 0.

### Submit

> **Not yet wired to an API.** The submit handler currently sets `submitted=true` and returns early on errors but makes no API call. Expected to call `POST /api/planning/plans` (or equivalent) when implemented.

Expected payload shape (to be confirmed):

```json
{
  "category": "travel",
  "title": "Vacation Fund",
  "targetAmount": 10000000,
  "currency": "VND",
  "duration": 6,
  "frequency": "monthly",
  "savingsPerPeriod": 1666666
}
```

---

## 7. API Contract Reference

### 7.1 Request / Response shapes

#### POST `/api/v1/auth/login`

Request:
```json
{ "emailOrUsername": "string", "password": "string" }
```

Expected response (any of these structures are accepted):
```json
{ "accessToken": "...", "refreshToken": "...", "user": { ... }, "roles": ["user"] }
```

#### POST `/api/v1/auth/register`

Request:
```json
{
  "fullName": "string (optional)",
  "username": "string (3–30 chars, alphanumeric + underscore)",
  "email": "string",
  "password": "string (min 8 chars)",
  "role": "USER | ADMIN",
  "currency": "USD | VND"
}
```

#### GET `/api/v1/users/profile`

Headers: `Authorization: Bearer <accessToken>`

Expected response (`AuthUser`):
```json
{
  "code": 200,
  "message": "...",
  "data": null,
  "id": "string",
  "email": "string",
  "roles": ["user"],
  "fullName": "string (optional)",
  "currency": "USD | VND"
}
```

#### POST `/api/v1/auth/logout`

Headers: `Authorization: Bearer <accessToken>` (optional)

Response: any — FE clears cookies regardless.

---

### 7.2 Cookie contract

All cookies are set **by the FE BFF** and are **HttpOnly**. The browser cannot read or write them.

| Cookie | Value | Max-Age |
|---|---|---|
| `accessToken` | JWT string | 15 minutes |
| `refreshToken` | JWT string | 7 days |
| `roles` | comma-separated string, **lowercase** e.g. `"user"` or `"admin,user"` | 1 day |

---

### 7.3 Error handling

- Any `401` response from the backend triggers automatic logout (cookies cleared, user redirected to `/login`).
- HTTP errors are surfaced to the user via an `error` string in the auth hook.
- If the error response body is JSON with a `message` field, that message is shown to the user.

---

## 8. Environment Variables

| Variable | Used by | Default |
|---|---|---|
| `AUTH_SERVICE_BASE_URL` | Server-side BFF (auth routes) | `http://localhost:8081` |
| `PLANNING_SERVICE_BASE_URL` | Server-side BFF (planning proxy) | `http://localhost:8090` |
| `NEXT_PUBLIC_API_BASE_URL` | Client-side `http.ts` (unused in auth/planning flows) | `http://localhost:8088` |
| `NEXT_PUBLIC_APP_NAME` | Display name | `FinTrack` |

---

## 9. Known Gaps / Open Items

| Item | Status | Detail |
|---|---|---|
| Plan creation API call | Not implemented | Form validates and computes values but `handleSubmit` has no API call yet |
| Dashboard data | Not implemented | All stat cards and plan lists are hardcoded mock data |
| Role case normalization | Risk | FE register sends `"USER"`/`"ADMIN"` (uppercase); middleware checks `"admin"` (lowercase). Backend must normalize. |
| `/api/users` stub | Outdated | Returns hardcoded demo data with no auth check — should be removed or replaced |
| Planning proxy error handling | Missing | No `try/catch` around the `fetch()` — unhandled promise rejection on network errors |
| Token refresh flow | Not implemented | No silent refresh logic; once `accessToken` (15 min) expires, the next request returns 401 and logs the user out |
