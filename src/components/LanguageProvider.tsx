"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dictionaries, getDirection, getLocale, type Dictionary, type Language } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  direction: "ltr" | "rtl";
  locale: string;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  direction: "ltr",
  locale: "en-US",
  t: dictionaries.en,
});

type LanguageProviderProps = {
  language: Language;
  children: ReactNode;
};

export function LanguageProvider({ language, children }: LanguageProviderProps) {
  return (
    <LanguageContext.Provider
      value={{
        language,
        direction: getDirection(language),
        locale: getLocale(language),
        t: dictionaries[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
