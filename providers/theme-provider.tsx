import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import React from "react";
import { useColorScheme } from "react-native";

import { AppColors, AppThemeMode, darkColors, lightColors, setActiveColors } from "@/constants/theme";

const THEME_KEY = "sbc_theme_mode";

type ThemeContextValue = {
  mode: AppThemeMode;
  resolvedMode: "light" | "dark";
  colors: AppColors;
  setMode: (mode: AppThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppThemeMode>("system");
  const resolvedMode = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const palette = resolvedMode === "dark" ? darkColors : lightColors;

  setActiveColors(palette);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((storedMode) => {
      if (storedMode === "system" || storedMode === "light" || storedMode === "dark") {
        setModeState(storedMode);
      }
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors: palette,
      setMode: async (nextMode) => {
        await SecureStore.setItemAsync(THEME_KEY, nextMode);
        setModeState(nextMode);
      }
    }),
    [mode, palette, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = React.use(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
