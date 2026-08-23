"use client";

import { useState } from "react";
import { LanguageContext } from "./context";
import type { Language } from "@/services/locale";
import { getStoredLanguage, setStoredLanguage } from "@/services/locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
