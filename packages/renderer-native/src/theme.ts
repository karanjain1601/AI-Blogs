import { useColorScheme } from "react-native";

export const DARK = {
  bg: "#0b0d10",
  surface: "#131619",
  border: "#2a2e35",
  fg: "#e2e8f0",
  muted: "#8b919a",
  accent: "#5865f2",
  code: "#1e2124",
  codeFg: "#a8d8ea",
  callout: {
    note: "#2a2e35",
    info: "#1a2a3a",
    tip: "#1a2e1a",
    warning: "#2e2a1a",
    error: "#2e1a1a",
  },
  calloutFg: {
    note: "#8b919a",
    info: "#5ab0f0",
    tip: "#3fb950",
    warning: "#e3b341",
    error: "#f85149",
  },
} as const;

export const LIGHT = {
  bg: "#ffffff",
  surface: "#f6f8fa",
  border: "#d0d7de",
  fg: "#1f2328",
  muted: "#636c76",
  accent: "#5865f2",
  code: "#f6f8fa",
  codeFg: "#0550ae",
  callout: {
    note: "#f6f8fa",
    info: "#ddf4ff",
    tip: "#dcfce7",
    warning: "#fff8c5",
    error: "#ffebe9",
  },
  calloutFg: {
    note: "#636c76",
    info: "#0969da",
    tip: "#1a7f37",
    warning: "#9a6700",
    error: "#cf222e",
  },
} as const;

export interface Theme {
  bg: string;
  surface: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  code: string;
  codeFg: string;
  callout: { note: string; info: string; tip: string; warning: string; error: string };
  calloutFg: { note: string; info: string; tip: string; warning: string; error: string };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "light" ? LIGHT : DARK;
}
