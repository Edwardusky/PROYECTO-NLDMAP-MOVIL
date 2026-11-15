
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Appearance } from "react-native";

import {
  darkPalette,
  lightPalette,
  type Palette,
} from "../constants/palette";

export type ThemeMode = "light" | "dark";

type AppThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const AppThemeContext =
  createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  // NLDMAP inicia siempre en modo claro.
  const [mode, setMode] = useState<ThemeMode>("light");

  const isDark = mode === "dark";

  const colors = isDark
    ? darkPalette
    : lightPalette;

  const toggleTheme = useCallback(() => {
    setMode((current) =>
      current === "light" ? "dark" : "light",
    );
  }, []);

  // Sincroniza la apariencia de controles nativos.
  useEffect(() => {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(mode);
    }
  }, [mode]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
      toggleTheme,
    }),
    [mode, isDark, colors, toggleTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error(
      "useAppTheme requiere AppThemeProvider.",
    );
  }

  return context;
}
