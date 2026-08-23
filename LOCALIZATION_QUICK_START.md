# Language Localization - Quick Start Guide

## What Was Implemented

A complete language localization system for FinTrack FE that allows users to switch between English and Vietnamese with persistent storage.

### Key Features
✅ Two translation files (en.json, vi.json)  
✅ Language persistence via localStorage  
✅ Language switcher in Settings page  
✅ Entire UI translates when language changes  
✅ No page reload required  
✅ Graceful fallback to English if localStorage unavailable  

## File Structure

```
src/
├── locales/
│   ├── en.json                 # English translations
│   └── vi.json                 # Vietnamese translations
├── services/
│   └── locale.ts               # Language service & utilities
├── features/
│   └── language/
│       ├── context.tsx         # React Context definition
│       ├── provider.tsx        # LanguageProvider component
│       └── hooks/
│           └── use-language.ts # useLanguage hook
└── app/
    ├── layout.tsx              # Updated with LanguageProvider
    └── settings/
        ├── page.tsx            # Settings page (dynamic route)
        └── settings-content.tsx # Settings UI component
```

## How to Use in Your Components

### Simple Usage
```typescript
import { useLanguage } from "@/features/language/hooks/use-language";

export function MyComponent() {
  const { t } = useLanguage();

  return <h1>{t("common.appName")}</h1>;
}
```

### With Language Switching
```typescript
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      <p>Current: {language}</p>
      <button onClick={() => setLanguage("en")}>English</button>
      <button onClick={() => setLanguage("vi")}>Tiếng Việt</button>
    </div>
  );
}
```

## Current Translations Available

### Common
- appName, loading, error, success, cancel, save, delete, edit, add, close, submit
- logout, login, signUp, email, password, fullName, currency, language
- settings, profile, dashboard, plan, plans, savings

### Auth
- Login: title, subtitle, email, password, remember, submit, noAccount, signUp, errors
- Register: title, subtitle, fullName, email, password, confirmPassword, agreeTerms, submit, haveAccount, login, errors

### Settings
- Profile: title, fullName, email, saveChanges, saving, saveSuccess, saveError
- Language: title, language, currency, selectLanguage, selectCurrency, updateSuccess, updateError

### Dashboard
- title, welcome, totalSavings, activePlans, recentActivity, createPlan, viewAll

### Plan
- title, createNew, edit, delete, deleteConfirm, name, goal, targetDate, description
- milestones, addMilestone, createSuccess, updateSuccess, deleteSuccess, createError, updateError, deleteError

### Validation
- required, invalidEmail, passwordTooShort, nameRequired, goalRequired, invalidAmount

## Changing Language

Users can change language in `/settings` by:
1. Navigating to Settings page
2. Selecting language from the "Language & Currency" section dropdown
3. UI updates immediately (no page reload)
4. Preference is saved and persists on next visit

## Adding a New Translation

1. Add your key to both `en.json` and `vi.json`:
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

2. Use in component:
```typescript
const { t } = useLanguage();
<h1>{t("myFeature.title")}</h1>
```

## Adding a New Language

1. Create `src/locales/fr.json` (example for French)

2. Update `src/services/locale.ts`:
```typescript
import fr from "@/locales/fr.json";

export type Language = "en" | "vi" | "fr";

const translations: Record<Language, typeof en> = {
  en,
  vi,
  fr,
};
```

3. Add to language options in components:
```typescript
const languageOptions = [
  { label: "English", value: "en" },
  { label: "Tiếng Việt", value: "vi" },
  { label: "Français", value: "fr" },
];
```

## Important Notes

⚠️ **Settings Page** - Made dynamic (`export const dynamic = "force-dynamic"`) to prevent build-time pre-rendering issues with context hooks.

⚠️ **Middleware** - Settings route added to middleware matcher to protect unauthenticated access.

⚠️ **Component Wrapping** - Settings page UI extracted to `settings-content.tsx` to properly handle context availability.

## Testing

The language switching is live and can be tested at:
1. Login to the app
2. Go to `/settings`
3. Change language dropdown
4. All UI text updates immediately
5. Refresh page - language persists

## Future Enhancements

- [ ] Add language detection from browser locale
- [ ] Add language switcher in header
- [ ] Support RTL languages
- [ ] SEO optimization with hreflang tags
- [ ] Translation management dashboard
- [ ] Automated translation for new keys
