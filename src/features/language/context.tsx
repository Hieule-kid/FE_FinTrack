"use client";

import { createContext } from "react";
import type { Language } from "@/services/locale";

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
