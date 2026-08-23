import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

export type Language = "en" | "vi";

const translations: Record<Language, typeof en> = {
  en,
  vi,
};

const DEFAULT_LANGUAGE: Language = "en";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  try {
    const stored = localStorage.getItem("language");
    if (stored === "en" || stored === "vi") {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_LANGUAGE;
}

export function setStoredLanguage(language: Language): void {
  try {
    localStorage.setItem("language", language);
  } catch {
    // localStorage not available
  }
}

export function getTranslation(language: Language): typeof en {
  return translations[language] || translations[DEFAULT_LANGUAGE];
}

export function t(language: Language, key: string, defaultValue: string = ""): string {
  const translation = getTranslation(language);
  const keys = key.split(".");
  let value: any = translation;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return defaultValue || key;
    }
  }

  return typeof value === "string" ? value : defaultValue || key;
}
