
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Appearance,
  useColorScheme,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  darkPalette,
  lightPalette,
  type Palette,
} from "../constants/palette";

export type ThemeMode = "light" | "system" | "dark";

type AppThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "@nldmap/appearance-mode";

const AppThemeContext =
  createContext<AppThemeContextValue | null>(null);

function normalizeThemeMode(
  value: string | null,
): ThemeMode {
  if (
    value === "light" ||
    value === "dark" ||
    value === "system"
  ) {
    return value;
  }

  return "system";
}

function applyNativeTheme(mode: ThemeMode) {
  Appearance.setColorScheme(
    mode === "system" ? "unspecified" : mode,
  );
}

export function AppThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const systemScheme = useColorScheme();

  const [mode, setStoredMode] =
    useState<ThemeMode>("system");

  const [hydrated, setHydrated] = useState(false);

  // Serializa las escrituras para conservar
  // la última preferencia seleccionada.
  const saveQueue = useRef<Promise<void>>(
    Promise.resolve(),
  );

  // Recupera la preferencia al iniciar.
  useEffect(() => {
    let active = true;

    async function loadTheme() {
      let savedMode: ThemeMode = "system";

      try {
        const storedValue =
          await AsyncStorage.getItem(STORAGE_KEY);

        savedMode = normalizeThemeMode(storedValue);
      } catch (error) {
        console.warn(
          "No se pudo recuperar el tema:",
          error,
        );
      }

      if (!active) return;

      try {
        applyNativeTheme(savedMode);
      } catch (error) {
        console.warn(
          "No se pudo aplicar el tema nativo:",
          error,
        );
      }

      setStoredMode(savedMode);
      setHydrated(true);
    }

    void loadTheme();

    return () => {
      active = false;
    };
  }, []);

  // Actualiza y guarda la preferencia.
  const setMode = useCallback((nextMode: ThemeMode) => {
    setStoredMode(nextMode);

    try {
      applyNativeTheme(nextMode);
    } catch (error) {
      console.warn(
        "No se pudo cambiar el tema nativo:",
        error,
      );
    }

    saveQueue.current = saveQueue.current
      .then(() =>
        AsyncStorage.setItem(STORAGE_KEY, nextMode),
      )
      .catch((error) => {
        console.warn(
          "No se pudo guardar la apariencia:",
          error,
        );
      });
  }, []);

  // Determina el tema visual efectivo.
  const isDark =
    mode === "system"
      ? systemScheme === "dark"
      : mode === "dark";

  const colors = isDark
    ? darkPalette
    : lightPalette;

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
    }),
    [mode, isDark, colors, setMode],
  );

  // Evita montar las pantallas con un tema
  // incorrecto durante la lectura inicial.
  if (!hydrated) {
    return null;
  }

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
