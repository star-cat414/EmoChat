"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * EmoChat is a light-only theme. The provider always resolves to light and
 * guarantees the `dark` class never sticks on <html>.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const setTheme = useCallback(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme: "light", resolvedTheme: "light", setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}