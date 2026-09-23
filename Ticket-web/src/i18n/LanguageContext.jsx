import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "ticket-admin-lang";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "lo";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  function t(key) {
    const entry = translations[key];
    if (!entry) return key; // key ที่ยังไม่มีคำแปล แสดงชื่อ key ไว้ก่อน กันแอปพัง
    return entry[language] ?? entry.en ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage ต้องใช้ภายใน <LanguageProvider>");
  return ctx;
}
