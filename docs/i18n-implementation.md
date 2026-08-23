# Internationalization (i18n) Implementation Guide

**Status:** Phase 2 Complete (2026-08-23)  
**Coverage:** Dashboard, Header, Navigation, Action Buttons  
**Languages:** English (en), Vietnamese (vi)

## Overview

The FinTrack FE uses a custom translation system with JSON locale files and a `useLanguage` hook for client-side rendering. This guide documents the implementation pattern and how to extend i18n to new components.

## Current Implementation

### Phase 1: Settings & Auth (Completed 2026-08-22)
- Settings page profile section with language/currency picker
- Login and register forms
- Profile management component

### Phase 2: Dashboard & Header (Completed 2026-08-23)
- Dashboard page with plan statistics
- Dashboard action buttons
- Header navigation
- Translation keys for all user-facing text

## Architecture

### File Structure

```
src/
├── features/language/
│   ├── hooks/
│   │   └── use-language.ts          # useLanguage hook (client-only)
│   ├── provider.tsx                 # LanguageProvider context
│   ├── store.ts                     # Language state management
│   └── types.ts                     # Type definitions
├── locales/
│   ├── en.json                      # English translations
│   └── vi.json                      # Vietnamese translations
└── app/
    └── layout.tsx                   # Wraps entire app with LanguageProvider
```

### Translation Key Structure

Keys follow dot-notation namespacing:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Overview of all your savings plans"
  },
  "planCreation": {
    "category": "Goal Category",
    "categoryEmergency": "Emergency"
  }
}
```

## Implementation Pattern

### 1. For New Client Components

**Step 1: Add translation keys to locale files**

```json
// src/locales/en.json
{
  "myFeature": {
    "title": "My Feature Title",
    "buttonText": "Click me"
  }
}

// src/locales/vi.json
{
  "myFeature": {
    "title": "Tiêu đề tính năng của tôi",
    "buttonText": "Nhấp vào tôi"
  }
}
```

**Step 2: Use useLanguage hook in client component**

```typescript
"use client";

import { useLanguage } from "@/features/language/hooks/use-language";

export function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("myFeature.title")}</h1>
      <button>{t("myFeature.buttonText")}</button>
    </div>
  );
}
```

### 2. For Pages with Hooks

**Follow the server/client split pattern:**

```typescript
// src/app/my-page/page.tsx (server component)
"use server";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const data = await fetchData();
  return <MyPageContent data={data} />;
}

// src/app/my-page/my-page-content.tsx (client component)
"use client";

import { useLanguage } from "@/features/language/hooks/use-language";

export function MyPageContent({ data }) {
  const { t } = useLanguage();
  return <div>{t("myFeature.title")}</div>;
}
```

### 3. For Components with SSR Issues

**Use dynamic import with `ssr: false`:**

```typescript
// src/components/my-component/index.tsx (server component)
"use client";
import dynamic from "next/dynamic";

const MyComponentClient = dynamic(
  () => import("./my-component-client").then((mod) => ({ default: mod.MyComponentClient })),
  { ssr: false }
);

export function MyComponent() {
  return <MyComponentClient />;
}

// src/components/my-component/my-component-client.tsx (client component)
"use client";

import { useLanguage } from "@/features/language/hooks/use-language";

export function MyComponentClient() {
  const { t } = useLanguage();
  return <div>{t("myFeature.title")}</div>;
}
```

## Key Components

### useLanguage Hook

Located: `src/features/language/hooks/use-language.ts`

```typescript
const { t, language, setLanguage } = useLanguage();

// Get translation
const text = t("dashboard.title");  // Returns: "Dashboard" (en) or "Bảng điều khiển" (vi)

// Get current language
console.log(language);  // "en" or "vi"

// Change language
setLanguage("vi");
```

### LanguageProvider

Located: `src/features/language/provider.tsx`

Must wrap the entire application (already in layout.tsx). Handles:
- Language initialization from localStorage
- Translation key lookup
- Language switching context

## Current Translation Coverage

### Dashboard (`dashboard.title`, `dashboard.subtitle`, etc.)
- ✅ Page title and description
- ✅ Statistics labels (Total Target, Active Plans, Plans Completed)
- ✅ Section headings (Your Plans, Completed Plans)
- ✅ Empty states (No active plans yet)
- ✅ Action buttons (New Plan, View all)

### Header (`header.dashboard`, `header.settings`)
- ✅ Navigation links
- ✅ Dynamic rendering with ssr: false pattern

### Plan Creation (`planCreation.*`)
- ✅ Form labels and placeholders
- ✅ Category names
- ✅ Default plan titles
- ✅ Button labels
- ✅ Error messages

### AI Plan Generation (`aiPlanGeneration.*`)
- ✅ Page title and subtitle
- ✅ Step indicators
- ✅ Form labels
- ✅ Button labels
- ✅ Result display text

### Auth (`auth.login.*`, `auth.register.*`)
- ✅ Form labels
- ✅ Messages and errors

### Settings (`settings.profile.*`, `settings.language.*`)
- ✅ Section titles
- ✅ Form labels
- ✅ Button labels
- ✅ Success/error messages

## Pending Work

### Phase 3 Candidates
- Login page styling and i18n improvements
- Register page full i18n
- Admin page (if exposed to users)
- Error pages (404, 500)

### Known Limitations
- Footer remains server-side (static text)
- Some API error messages not translated
- Email notifications not translated

## Common Patterns

### Conditional Translation

```typescript
const statusText = plan.status === "completed" 
  ? t("plan.statusCompleted")
  : t("plan.statusActive");
```

### Translation with Variables

Currently, all translation keys are static. For dynamic content:

```typescript
// Instead of:
const message = t("dashboard.totalPlans", { count: 5 });  // ❌ Not supported

// Do this:
const message = `${t("dashboard.totalPlans")}: ${activePlans.length}`;
```

### Array/List Translation

```typescript
const categories = [
  { id: "emergency", label: t("planCreation.categoryEmergency") },
  { id: "travel", label: t("planCreation.categoryTravel") },
];
```

## Testing i18n

### Manual Testing
1. Start dev server: `yarn dev`
2. Go to settings page
3. Toggle between English and Tiếng Việt
4. Navigate to different pages and verify text changes

### Checking Translation Coverage

Find hardcoded strings:
```bash
grep -r "\"[A-Z]" src/app --include="*.tsx" | grep -v "t(" | grep -v ".test"
```

## Adding New Translations

1. **Identify the feature area** (dashboard, settings, etc.)
2. **Add keys to both locale files**
   ```json
   // en.json and vi.json
   "featureName": {
     "key1": "English text",
     "key2": "More text"
   }
   ```
3. **Update component to use useLanguage**
   ```typescript
   const { t } = useLanguage();
   return <div>{t("featureName.key1")}</div>;
   ```
4. **Test on both languages** in browser

## Performance Considerations

- Translation lookup is O(1) via object key access
- No network requests for translations (all in-memory)
- Language switching is instant
- LanguageProvider uses React Context (re-renders only affected subtree)

## Browser Support

- Translations stored in localStorage
- Fallback to browser language on first visit
- Manual language selection via settings page

## Troubleshooting

### "useLanguage must be used within LanguageProvider"
- Ensure component is marked with `"use client"`
- Check that component is rendered within AppShell (which is wrapped by LanguageProvider)
- For build-time issues, use `dynamic(..., { ssr: false })`

### Translation key not found
- Check spelling and capitalization
- Verify key exists in both en.json and vi.json
- Check dot-notation path matches exactly

### Language not persisting
- Check browser localStorage permissions
- Look at LanguageProvider initialization in provider.tsx
- Check for privacy mode (localStorage may be disabled)

## References

- CLAUDE.md — Project architecture documentation
- src/features/language/ — Source code
- MEMORY.md — Session memory and decisions
