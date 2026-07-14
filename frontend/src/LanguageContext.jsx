import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  const [darkMode, setDarkModeState] = useState(() => {
    return localStorage.getItem('appDarkMode') === 'true';
  });

  const setLanguage = (lang) => {
    localStorage.setItem('appLanguage', lang);
    setLanguageState(lang);
  };

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    localStorage.setItem('appDarkMode', nextVal ? 'true' : 'false');
    setDarkModeState(nextVal);
  };

  // Sync body theme class whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, darkMode, toggleDarkMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
