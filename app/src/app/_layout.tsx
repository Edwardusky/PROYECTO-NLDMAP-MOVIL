
import {
  useMemo,
  type ReactNode,
} from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import {
  AppThemeProvider,
  useAppTheme,
} from "@/shared/theme/app-theme-context";

import { ProfileProvider } from "@/features/profile/state/profile-context";
import { ReportDraftProvider } from "@/features/reports/state/report-draft-context";

import {
  AuthSessionProvider,
  useAuthSession,
} from "@/features/auth/state/auth-session-context";

export const unstable_settings = {
  initialRouteName: "index",
};





function AppNavigator() {
  const { colors: c, mode, isDark } = useAppTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.action,
        background: c.surface,
        card: c.surface,
        text: c.text,
        border: c.divider,
        notification: c.error,
      },
    };
  }, [c, isDark]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <AuthSessionProvider>
        <ProfileProvider>
          <ReportDraftProvider>
            <Stack
              screenOptions={{
                headerTintColor: c.text,
                headerStyle: {
                  backgroundColor: c.surface,
                },
                contentStyle: {
                  backgroundColor: c.surface,
                },
              }}
            >
              <Stack.Screen
                name="index"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="login"
                options={{ title: "Acceso" }}
              />

              <Stack.Screen
                name="register"
                options={{ title: "Registro" }}
              />

              <Stack.Screen
                name="profile"
                options={{ title: "Perfil" }}
              />

              <Stack.Screen
                name="create-report"
                options={{ title: "Crear reporte" }}
              />

              <Stack.Screen
                name="case-detail"
                options={{ title: "Detalle del reporte" }}
              />
            </Stack>
          </ReportDraftProvider>
        </ProfileProvider>
      </AuthSessionProvider>
    </ThemeProvider >
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
