'use client';



import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useState,

  type ReactNode,

} from 'react';



/** Which language appears first (larger); the other is secondary (smaller). */

export type PrimaryLanguage = 'en' | 'el';



/** Whether secondary language is shown alongside primary. */

export type LanguageDisplayMode = 'bilingual' | 'primary-only';



const PRIMARY_STORAGE_KEY = 'cfb:primary-language';

const DISPLAY_STORAGE_KEY = 'cfb:language-display';



type LanguagePreferenceContextValue = {

  primary: PrimaryLanguage;

  setPrimary: (lang: PrimaryLanguage) => void;

  togglePrimary: () => void;

  displayMode: LanguageDisplayMode;

  setDisplayMode: (mode: LanguageDisplayMode) => void;

  /** True when secondary line should render in UI. */

  showSecondary: boolean;

  mounted: boolean;

};



const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue>({

  primary: 'en',

  setPrimary: () => {},

  togglePrimary: () => {},

  displayMode: 'bilingual',

  setDisplayMode: () => {},

  showSecondary: true,

  mounted: false,

});



export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {

  const [primary, setPrimaryState] = useState<PrimaryLanguage>('en');

  const [displayMode, setDisplayModeState] = useState<LanguageDisplayMode>('bilingual');

  const [mounted, setMounted] = useState(false);



  useEffect(() => {

    setMounted(true);

    try {

      const storedPrimary = localStorage.getItem(PRIMARY_STORAGE_KEY);

      if (storedPrimary === 'en' || storedPrimary === 'el') setPrimaryState(storedPrimary);



      const storedDisplay = localStorage.getItem(DISPLAY_STORAGE_KEY);

      if (storedDisplay === 'bilingual' || storedDisplay === 'primary-only') {

        setDisplayModeState(storedDisplay);

      }

    } catch {

      /* ignore */

    }

  }, []);



  useEffect(() => {

    if (!mounted) return;

    document.documentElement.dataset.primaryLang = primary;

    document.documentElement.dataset.languageDisplay = displayMode;

  }, [primary, displayMode, mounted]);



  const setPrimary = useCallback((lang: PrimaryLanguage) => {

    setPrimaryState(lang);

    try {

      localStorage.setItem(PRIMARY_STORAGE_KEY, lang);

    } catch {

      /* ignore */

    }

  }, []);



  const setDisplayMode = useCallback((mode: LanguageDisplayMode) => {

    setDisplayModeState(mode);

    try {

      localStorage.setItem(DISPLAY_STORAGE_KEY, mode);

    } catch {

      /* ignore */

    }

  }, []);



  const togglePrimary = useCallback(() => {

    setPrimary(primary === 'en' ? 'el' : 'en');

  }, [primary, setPrimary]);



  const showSecondary = displayMode === 'bilingual';



  return (

    <LanguagePreferenceContext.Provider

      value={{

        primary,

        setPrimary,

        togglePrimary,

        displayMode,

        setDisplayMode,

        showSecondary,

        mounted,

      }}

    >

      {children}

    </LanguagePreferenceContext.Provider>

  );

}



export function useLanguagePreference() {

  return useContext(LanguagePreferenceContext);

}



/** Resolve primary/secondary text + lang codes for BilingualText. */

export function resolveBilingualPair(

  en: string,

  el: string | null | undefined,

  primary: PrimaryLanguage,

  showSecondary = true,

): {

  primaryText: string;

  secondaryText: string | null;

  primaryLang: 'en' | 'el';

  secondaryLang: 'en' | 'el' | null;

} {

  if (!el || el === en) {

    return { primaryText: en, secondaryText: null, primaryLang: 'en', secondaryLang: null };

  }

  if (primary === 'el') {

    return {

      primaryText: el,

      secondaryText: showSecondary ? en : null,

      primaryLang: 'el',

      secondaryLang: showSecondary ? 'en' : null,

    };

  }

  return {

    primaryText: en,

    secondaryText: showSecondary ? el : null,

    primaryLang: 'en',

    secondaryLang: showSecondary ? 'el' : null,

  };

}


