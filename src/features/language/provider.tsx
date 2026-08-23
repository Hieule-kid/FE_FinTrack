"use client";

import { useState, useEffect } from "react";
import { LanguageContext } from "./context";
import type { Language } from "@/services/locale";
import { getStoredLanguage, setStoredLanguage } from "@/services/locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(stored);
    setIsHydrated(true);
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
