"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

type ThemeContextValue = {
  themeChoice: ThemeChoice;
  setThemeChoice: (v: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "themeChoice";

function applyThemeChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", choice);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeChoice, setThemeChoiceState] = useState<ThemeChoice>("system");

  // Load persisted preference once.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeChoiceState(stored);
        applyThemeChoice(stored);
      } else {
        applyThemeChoice("system");
      }
    } catch {
      // ignore
    }
  }, []);

  // Keep DOM + storage in sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeChoice);
    } catch {
      // ignore
    }
    applyThemeChoice(themeChoice);
  }, [themeChoice]);

  // In system mode, respond to OS changes (CSS media query handles colors;
  // this is mainly to ensure any dependent computations re-render if needed later).
  useEffect(() => {
    if (themeChoice !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => {
      // no-op DOM (CSS handles), but keeps a hook point for future
      applyThemeChoice("system");
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [themeChoice]);

  const setThemeChoice = useCallback((v: ThemeChoice) => setThemeChoiceState(v), []);

  const value = useMemo(() => ({ themeChoice, setThemeChoice }), [themeChoice, setThemeChoice]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

