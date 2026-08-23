"use client";

import { useContext } from "react";
import { LanguageContext } from "../context";
import { t, type Language } from "@/services/locale";

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  const { language, setLanguage } = context;

  return {
    language,
    setLanguage,
    t: (key: string, defaultValue?: string) => t(language, key, defaultValue),
  };
}
