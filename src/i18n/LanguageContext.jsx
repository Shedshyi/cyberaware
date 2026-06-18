import React, { createContext, useContext, useState, useCallback } from "react";
import { ru } from "./translations";
import { en } from "./translations";

const TRANSLATIONS = { ru, en };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem("lang") || "ru"
  );

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback((key, vars = {}) => {
    const keys = key.split(".");
    let val = TRANSLATIONS[lang];
    for (const k of keys) val = val?.[k];
    if (!val) {
      // fallback to ru if key missing in en
      val = TRANSLATIONS.ru;
      for (const k of keys) val = val?.[k];
    }
    if (typeof val !== "string") return key;
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, v),
      val
    );
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
