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
import { Moon, Sun } from "lucide-react";

export type CmsTheme = "light" | "dark";
export type CmsThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "cms-theme";

type CmsThemeContextValue = {
  theme: CmsTheme;
  preference: CmsThemePreference;
  setTheme: (theme: CmsTheme) => void;
  setPreference: (preference: CmsThemePreference) => void;
  toggle: () => void;
};

const CmsThemeContext = createContext<CmsThemeContextValue | null>(null);

function systemTheme(): CmsTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function readStoredPreference(): CmsThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

function resolveTheme(preference: CmsThemePreference): CmsTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function CmsThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<CmsThemePreference>("system");
  const [theme, setThemeState] = useState<CmsTheme>("dark");

  useEffect(() => {
    const pref = readStoredPreference();
    setPreferenceState(pref);
    setThemeState(resolveTheme(pref));
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setThemeState(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: CmsThemePreference) => {
    setPreferenceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(resolveTheme(next));
  }, []);

  const setTheme = useCallback(
    (next: CmsTheme) => {
      setPreference(next);
    },
    [setPreference]
  );

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [setPreference, theme]);

  const value = useMemo(
    () => ({ theme, preference, setTheme, setPreference, toggle }),
    [theme, preference, setTheme, setPreference, toggle]
  );

  return (
    <CmsThemeContext.Provider value={value}>
      <div className="cms-root" data-cms-theme={theme}>
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

/** Compact sun / moon toggle for the sidebar. */
export function CmsThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useCmsTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={
        className
          ? `cms-theme-icon-btn ${className}`
          : "cms-theme-icon-btn"
      }
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
