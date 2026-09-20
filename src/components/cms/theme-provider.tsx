"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CmsTheme = "light" | "dark";

type CmsThemeContextValue = {
  theme: CmsTheme;
  setTheme: (theme: CmsTheme) => void;
  toggleTheme: () => void;
};

const CmsThemeContext = createContext<CmsThemeContextValue | null>(null);
const STORAGE_KEY = "webport-cms-theme";

export function CmsThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CmsTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = stored === "dark" || stored === "light" ? stored : "light";
    setThemeState(next);
    document.documentElement.dataset.cmsTheme = next;
    setMounted(true);
    return () => {
      delete document.documentElement.dataset.cmsTheme;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.cmsTheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((next: CmsTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <CmsThemeContext.Provider value={value}>
      <div className="cms-shell" data-cms-theme={theme}>
        <div className="cms-atmosphere" aria-hidden />
        {children}
      </div>
    </CmsThemeContext.Provider>
  );
}

export function useCmsTheme() {
  const ctx = useContext(CmsThemeContext);
  if (!ctx) {
    throw new Error("useCmsTheme must be used within CmsThemeProvider");
  }
  return ctx;
}
