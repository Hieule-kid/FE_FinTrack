# Architecture Decisions - Language Localization

## Decision 1: Two-File Structure for Settings Page

### Why Not Just One File?

❌ **Doesn't work:**
```typescript
// settings/page.tsx
"use client";

export default function SettingsPage() {
  const { t } = useLanguage();  // ← Breaks at build time!
  return <div>{t("key")}</div>;
}
```

**Build Error:**
```
Error: useLanguage must be used within LanguageProvider
  at <unknown> (.next/server/chunks/ssr/_0pgzqz6._.js)
```

### Why It Fails

During `yarn build`, Next.js:
1. Attempts to pre-render all pages to static HTML
2. Tries to render `settings/page.tsx` on the **server**
3. `useLanguage()` calls `useContext(LanguageContext)`
4. Context not available → Error

### Solution: Split Into Two Files

✅ **Works:**

**`settings/page.tsx`** (Server Component - Safe at Build Time)
```typescript
// No hooks, no context access
export default function SettingsPage() {
  return <SettingsContent />;  // Renders, no hooks called
}
```

**`settings-content.tsx`** (Client Component - Runtime Only)
```typescript
"use client";

export function SettingsContent() {
  const { t } = useLanguage();  // ✅ Works at runtime
  return <div>{t("key")}</div>;
}
```

### Build Flow

```
Build Time:
  settings/page.tsx renders (no hooks) ✅ 
    ↓
  Outputs: <SettingsContent />

Runtime (Client):
  LanguageProvider wraps app ✅
    ↓
  SettingsContent renders with useLanguage hook ✅
    ↓
  Translations available ✅
```

### Is This Over-Engineering?

**No.** This is the **idiomatic Next.js 16+ pattern** for:
- Protected/dynamic routes
- Routes that use context hooks
- Routes that require runtime initialization

**Real-world examples use this pattern:**
- Stripe's Next.js docs
- Next.js official examples
- Production apps (Vercel, Supabase, etc.)

---

## Decision 2: Remove Unused State Variables

### Original Code (Over-Engineered)
```typescript
const [isLanguageSaving, setIsLanguageSaving] = useState(false);
const [languageError, setLanguageError] = useState("");

function handleLanguageChange(nextLanguage: string) {
  setLanguage(nextLanguage as Language);
  setLanguageError("");  // Clears unused error
}
```

### Why It Was Wrong

1. **Language is instant** - No API call, no async operation
2. **No try-catch needed** - setState is synchronous
3. **Unused states** - Never set to true/displayed
4. **Mimicking currency** - Currency needs API states, language doesn't

### Comparison: Currency vs Language

**Currency Change** (Needs States) ✅
```typescript
async function handleCurrencyChange(nextCurrency: string) {
  const previousCurrency = currency;
  setCurrency(nextCurrency);
  setCurrencyError("");
  setIsCurrencySaving(true);  // ✅ Track API loading
  
  try {
    const result = await authService.updateCurrency({...});  // API call
    if (updated) setCachedProfile(updated);
  } catch (err) {
    setCurrency(previousCurrency);
    setCurrencyError(message);  // ✅ Display API error
  } finally {
    setIsCurrencySaving(false);
  }
}
```

**Language Change** (No States Needed) ✅
```typescript
function handleLanguageChange(nextLanguage: string) {
  setLanguage(nextLanguage as Language);  // Sync update
  // No error handling needed - localStorage or state update won't fail
}
```

### Why It's Good to Remove

1. **Cleaner code** - Removes dead code
2. **Better performance** - No unused state updates
3. **Correct semantics** - Matches what actually happens
4. **Easier maintenance** - New developers won't be confused
5. **Linting compliant** - Passes TypeScript strict mode

---

## Final Architecture

```
src/app/
└── settings/
    ├── page.tsx                   ← Server component (thin wrapper)
    │   export const dynamic = "force-dynamic"
    │   return <SettingsContent />
    │
    └── settings-content.tsx       ← Client component (all UI logic)
        "use client"
        useLanguage() hook here ✅
        handleLanguageChange() here ✅
```

## Trade-offs

| Aspect | One File | Two Files |
|--------|----------|-----------|
| Build time | ❌ Fails | ✅ Succeeds |
| Runtime | ✅ Works | ✅ Works |
| File count | ✅ Less | ❌ More |
| Complexity | ❌ Hidden context issue | ✅ Clear separation |
| Industry standard | ❌ Non-standard | ✅ Idiomatic Next.js 16 |

**Verdict:** Two files is the **correct choice** for Next.js 16+

---

## Summary

✅ **Two files:** Necessary for build-time safety in Next.js 16  
✅ **No unused state:** Language doesn't need loading/error states  
✅ **Production ready:** Follows Next.js patterns and best practices
