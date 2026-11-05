import { palette as c } from "@/constants/palette";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { LocalDraftProvider } from "@/state/local-draft-context";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = { initialRouteName: "index" };

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <LocalDraftProvider>
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
      </LocalDraftProvider>
    </ThemeProvider>
  );
}
