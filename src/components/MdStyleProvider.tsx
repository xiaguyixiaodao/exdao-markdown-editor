import { useEffect } from "react";
import { useStore } from "../lib/store";
import { mdStyles } from "../lib/mdStyles";

export function MdStyleProvider({ children }: { children: React.ReactNode }) {
  const styleName = useStore((s) => s.mdStyle);

  useEffect(() => {
    const style = mdStyles.find((s) => s.name === styleName);
    if (!style) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(style.vars)) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const key of Object.keys(style.vars)) {
        root.style.removeProperty(key);
      }
    };
  }, [styleName]);

  return <>{children}</>;
}
