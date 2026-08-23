# Next.js 16 Hooks Pattern — Required Splitting

## TL;DR

**If a page component uses ANY hook → split it into two files:**

```
page.tsx (server wrapper) → settings-content.tsx (client component with hook)
```

## The Problem

Next.js 16 pre-renders pages at build time on the server. When the build encounters a hook in a server context, it fails:

```
Error: useLanguage must be used within LanguageProvider
```

This happens because:
1. **Build time:** Next.js tries to pre-render `page.tsx` server-side
2. **Hook call:** Component tries to use `useLanguage()`
3. **No context:** Server-side rendering has no browser context for React hooks
4. **Build fails** ❌

## The Solution: Two-File Split

### File 1: `page.tsx` (Server Component)

```typescript
// No "use client" directive — this is a server component
// No hooks allowed
// Just a thin wrapper that renders the client component

export const dynamic = "force-dynamic";  // Optional: skip pre-rendering attempts

export default function SettingsPage() {
  return <SettingsContent />;
}
```

**Why this works:**
- Server component with no hooks → can be pre-rendered safely
- No context dependencies → no errors at build time
- Renders just fine when the client component is loaded at runtime

### File 2: `settings-content.tsx` (Client Component)

```typescript
"use client";  // Critical: marks this as a client component

import { useLanguage } from "@/features/language/hooks/use-language";

export function SettingsContent() {
  // ✅ Hooks work here because this is a client component
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div>
      {t("settings.title")}
    </div>
  );
}
```

**Why this works:**
- `"use client"` directive tells Next.js: "This only runs in the browser"
- Pre-rendering skipped for this component
- React hooks work because there's a real browser environment
- No build errors ✅

## Build Flow Diagram

```
Build Time (Server-side):
  page.tsx renders
    ↓
  Outputs: <SettingsContent />
  ✅ No hooks called, no errors

Runtime (Client-side):
  HTML loads in browser
    ↓
  LanguageProvider available (wrapped in layout.tsx)
    ↓
  SettingsContent component loads
    ↓
  useLanguage() hook executes
    ↓
  Translations available
  ✅ Everything works
```

## Is This Over-Engineering?

**No.** This is the **idiomatic Next.js 16+ pattern** for:
- Protected/dynamic routes
- Routes requiring context hooks
- Routes with runtime initialization

**Used by:**
- Stripe's Next.js docs
- Next.js official examples
- Production apps (Vercel, Supabase, etc.)

## Which Hooks Need Splitting?

**ALL of them:**
- `useLanguage()` ← Custom hooks
- `useAuth()` ← Custom hooks
- `useState()` ← React hooks
- `useContext()` ← React hooks
- `useRouter()` ← Next.js hooks
- `useSearchParams()` ← Next.js hooks
- `useEffect()` ← React hooks
- `useCallback()` ← React hooks
- `useReducer()` ← React hooks
- `useTransition()` ← React hooks
- etc.

**Rule:** If the component uses ANY hook → use the two-file pattern.

## In This Project

### Example: Settings Page

```
src/app/settings/
├── page.tsx                  ← Server wrapper (no hooks)
└── settings-content.tsx      ← Client component (hooks here)
```

**page.tsx:**
```typescript
import { SettingsContent } from "./settings-content";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsContent />;
}
```

**settings-content.tsx:**
```typescript
"use client";

import { useLanguage } from "@/features/language/hooks/use-language";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfile } from "@/features/auth/hooks/use-profile";

export function SettingsContent() {
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const { profile } = useProfile();

  // ... rest of component with hooks
}
```

## When Creating New Pages with Hooks

1. **Create `page.tsx`** (server component):
   ```typescript
   import { MyContent } from "./my-content";
   export const dynamic = "force-dynamic";
   export default function MyPage() {
     return <MyContent />;
   }
   ```

2. **Create `my-content.tsx`** (client component):
   ```typescript
   "use client";
   import { useMyHook } from "@/hooks";
   export function MyContent() {
     const data = useMyHook();
     return <div>{data}</div>;
   }
   ```

## Why `export const dynamic = "force-dynamic"`?

Optional, but recommended for clarity:
- Tells Next.js: "Don't try to statically generate this page"
- Skips pre-rendering attempts
- Ensures the page is always dynamically rendered

Without it, Next.js still works (page.tsx has no hooks so it's safe), but this makes the intent explicit.

## Trade-offs

| Aspect | One File ❌ | Two Files ✅ |
|--------|---------|----------|
| Build succeeds | No | Yes |
| Runtime works | Yes | Yes |
| File count | Lower | Higher |
| Clarity | Hidden issue | Clear separation |
| Industry standard | No | Yes |

**Verdict:** Two files is correct for Next.js 16+

## References

- [Next.js Official Docs: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js Official Docs: Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Hooks Documentation](https://react.dev/reference/react)

## Summary

✅ Split pages that use hooks into two files  
✅ Server wrapper has no hooks, renders client component  
✅ Client component uses `"use client"` and contains all hooks  
✅ This is the standard pattern in Next.js 16+  
✅ Applies to ALL React hooks, not just custom ones
