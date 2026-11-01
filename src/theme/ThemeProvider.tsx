import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
const light = {
  background: "#F7F7FC",
  surface: "#FFFFFF",
  text: "#24213A",
  muted: "#716D82",
  primary: "#6B56BB",
  onPrimary: "#FFFFFF",
  tint: "#EEEAFA",
  border: "#E5E2EF",
  success: "#28684E",
  successTint: "#E0F0E7",
  danger: "#B33450",
  track: "#E7E2F3",
};
const dark: typeof light = {
  background: "#171522",
  surface: "#232031",
  text: "#F4F1FC",
  muted: "#B8B1CC",
  primary: "#C6B4FF",
  onPrimary: "#29203E",
  tint: "#38304F",
  border: "#3C354E",
  success: "#9BDBB8",
  successTint: "#253D32",
  danger: "#FFA6B8",
  track: "#393147",
};
const ThemeContext = createContext<{
  colors: typeof light;
  dark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} | null>(null);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  return (
    <ThemeContext.Provider
      value={{ colors: isDark ? dark : light, dark: isDark, mode, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is missing");
  return theme;
}
