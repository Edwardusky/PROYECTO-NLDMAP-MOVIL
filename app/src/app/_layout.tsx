import { palette as c } from "@/shared/constants/palette";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/shared/components/animated-icon";
import { ProfileProvider } from "@/features/profile/state/profile-context";
import { ReportDraftProvider } from "@/features/reports/state/report-draft-context";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = { initialRouteName: "index" };

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <ProfileProvider>
        <ReportDraftProvider>
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              headerTintColor: c.text,
              headerStyle: { backgroundColor: c.surface },
              contentStyle: { backgroundColor: c.surface },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Acceso" }} />
            <Stack.Screen name="register" options={{ title: "Registro" }} />
            <Stack.Screen name="profile" options={{ title: "Perfil" }} />
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
    </ThemeProvider>
  );
}
