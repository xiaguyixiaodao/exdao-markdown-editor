import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { themes } from "../lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeName = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    if (themeName === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mqlRef.current = mql;
      const handler = () => {
        const theme = themes.find((t) => t.name === "system");
        if (!theme) return;
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme.vars)) {
          root.style.setProperty(key, value);
        }
      };
      mql.addEventListener("change", handler);
      handler();
      return () => mql.removeEventListener("change", handler);
    }

    const theme = themes.find((t) => t.name === themeName);
    if (!theme) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const key of Object.keys(theme.vars)) {
        root.style.removeProperty(key);
      }
    };
  }, [themeName, setTheme]);

  return <>{children}</>;
}
