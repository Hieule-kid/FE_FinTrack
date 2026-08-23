# Language Localization Setup

This document describes the localization system implemented for FinTrack FE.

## Overview

A complete language localization system has been added to support multiple languages (English and Vietnamese by default). Language preference is stored in localStorage and persists across sessions.

## Files Created

### 1. Translation Files
- **`src/locales/en.json`** - English translations
- **`src/locales/vi.json`** - Vietnamese translations

Both files contain the same key structure with translated text for:
- Common UI elements (buttons, labels, common words)
- Authentication pages (login, register)
- Settings page
- Dashboard
- Planning/savings features
- Validation messages

### 2. Language Service
- **`src/services/locale.ts`** - Core localization service

Functions exported:
- `getStoredLanguage()` - Retrieves stored language from localStorage
- `setStoredLanguage(language)` - Saves language preference to localStorage
- `getTranslation(language)` - Returns the full translation object for a language
- `t(language, key, defaultValue)` - Utility function to get a translation by dot-notation key

### 3. Language Context & Provider
- **`src/features/language/context.tsx`** - React Context definition
- **`src/features/language/provider.tsx`** - LanguageProvider component that:
  - Initializes language from localStorage
  - Provides language state and setter to all child components
  - Hydrates on mount to prevent hydration mismatches

### 4. Language Hook
- **`src/features/language/hooks/use-language.ts`** - useLanguage hook

Returns an object with:
- `language` - Current language code ("en" or "vi")
- `setLanguage(lang)` - Function to change language
- `t(key, defaultValue)` - Shorthand for getting current language translations

## How to Use

### In Components

```typescript
import { useLanguage } from "@/features/language/hooks/use-language";

export function MyComponent() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <h1>{t("common.appName")}</h1>
      <button onClick={() => setLanguage("en")}>English</button>
      <button onClick={() => setLanguage("vi")}>Tiếng Việt</button>
    </div>
  );
}
```

### Key Structure

Translations use dot notation for nested access:
```typescript
t("settings.profile.title")      // → "Settings" in English
t("settings.language.currency")  // → "Currency" in English
t("common.logout")               // → "Log Out" in English
```

## Settings Page Implementation

The language selector has been integrated into the settings page at **`src/app/settings/page.tsx`**:

1. **Language Selector** - Added a language dropdown next to currency selector
2. **handleLanguageChange Function** - Called when user changes language:
   ```typescript
   function handleLanguageChange(nextLanguage: string) {
     setLanguage(nextLanguage as Language);
     setLanguageError("");
   }
   ```
3. **UI Translation** - All page labels and button text updated to use `t()`:
   - Page title
   - Profile section title
   - Input labels (Full Name, Email)
   - Language & Currency section title
   - Dropdown labels
   - Button text (Save Changes, Sign Out)

## Language Persistence

The system automatically:
1. Saves language preference to `localStorage` when user changes language
2. Loads saved preference on app startup
3. Falls back to "en" (English) if no preference is stored or localStorage is unavailable

## Architecture

```
Root Layout
└── LanguageProvider (wraps entire app)
    └── AppShell
        └── Page Components
            └── useLanguage() hook available here
```

The LanguageProvider wraps the entire application in `src/app/layout.tsx`, making the language context available to all child components.

## Adding New Translations

To add new translation keys:

1. **Add to both en.json and vi.json:**
   ```json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "Description here"
     }
   }
   ```

2. **Use in components:**
   ```typescript
   const { t } = useLanguage();
   <h1>{t("newFeature.title")}</h1>
   ```

## Adding New Languages

To add a new language (e.g., Spanish):

1. Create `src/locales/es.json` with translations
2. Update the `translations` object in `src/services/locale.ts`:
   ```typescript
   import es from "@/locales/es.json";
   
   const translations: Record<Language, typeof en> = {
     en,
     vi,
     es,
   };
   ```
3. Update the `Language` type in the same file:
   ```typescript
   export type Language = "en" | "vi" | "es";
   ```
4. Add to language options in settings page or components:
   ```typescript
   const languageOptions = [
     { label: "English", value: "en" },
     { label: "Tiếng Việt", value: "vi" },
     { label: "Español", value: "es" },
   ];
   ```

## Testing

The implementation is now live on the settings page. Users can:
1. Navigate to `/settings` (after login)
2. See the Language dropdown with options: "English" and "Tiếng Việt"
3. Select a language and see the entire UI update accordingly
4. Language preference persists on page refresh

## Browser Support

The system uses `localStorage` which is supported in all modern browsers. If localStorage is unavailable (e.g., in private browsing), the app gracefully falls back to session-based language preference.

## Future Enhancements

- Add more languages by following the "Adding New Languages" section
- Implement language detection based on browser locale
- Add language switcher in header for quick access
- Support for RTL languages (Arabic, Hebrew)
- SEO optimization with hreflang tags
