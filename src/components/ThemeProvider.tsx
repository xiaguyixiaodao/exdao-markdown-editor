import { useEffect } from "react";
import { useStore } from "../lib/store";
import { themes } from "../lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeName = useStore((s) => s.theme);

  useEffect(() => {
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
  }, [themeName]);

  return <>{children}</>;
}
