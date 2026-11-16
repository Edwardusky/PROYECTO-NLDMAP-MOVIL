import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

type AccountRoute =
  | "/login"
  | "/register"
  | "/profile";

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: AccountRoute) => void;
};

// Configuración de la animación.
const DRAWER_TRAVEL = 340;
const OPEN_DURATION = 220;
const CLOSE_DURATION = 220;

export function AccountDrawer({
  visible,
  onClose,
  onNavigate,
}: Props) {
  const { colors: c } = useAppTheme();

  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  // Mantiene el Modal visible durante
  // la animación de salida.
  const [rendered, setRendered] = useState(visible);

  // 0 = cerrado, 1 = abierto.
  const progress = useRef(
    new Animated.Value(visible ? 1 : 0),
  ).current;

  // Permite navegar después de cerrar el panel.
  const pendingRoute = useRef<AccountRoute | null>(null);

  const latestNavigate = useRef(onNavigate);
  latestNavigate.current = onNavigate;

  // Montar el Modal al solicitar apertura.
  useEffect(() => {
    if (visible) {
      pendingRoute.current = null;
      setRendered(true);
    }
  }, [visible]);

  // Animación de entrada y salida.
  useEffect(() => {
    if (!rendered) return;

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,

      duration: visible
        ? OPEN_DURATION
        : CLOSE_DURATION,

      easing: visible
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),

      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (!finished || visible) return;

      // Desmontar solo cuando terminó de cerrarse.
      setRendered(false);

      // Ejecutar navegación pendiente.
      const route = pendingRoute.current;
      pendingRoute.current = null;

      if (route) {
        latestNavigate.current(route);
      }
    });

    return () => {
      animation.stop();
    };
  }, [visible, rendered, progress]);

  // Desplazamiento horizontal del panel.
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_TRAVEL, 0],
  });

  // Oscurecimiento progresivo del fondo.
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  function navigateAfterClose(route: AccountRoute) {
    pendingRoute.current = route;
    onClose();
  }

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Fondo oscuro animado */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: c.overlay,
              opacity: backdropOpacity,
            },
          ]}
        />

        {/* Cerrar tocando fuera del panel */}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessible={false}
          importantForAccessibility="no"
          onPress={onClose}
        />

        <SafeAreaView
          style={styles.safeArea}
          edges={["top", "bottom", "left", "right"]}
          pointerEvents="box-none"
        >
          {/* Panel deslizable */}
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX }],
              },
            ]}
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
          >
            {/* Encabezado */}
            <View style={styles.header}>
              <Text
                accessibilityRole="header"
                style={styles.title}
              >
                Menú
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close-outline"
                  size={26}
                  color={c.text}
                  accessible={false}
                />
              </Pressable>
            </View>

            {/* Opciones */}
            <View style={styles.options}>
              <MenuOption
                icon="log-in-outline"
                label="Iniciar sesión"
                onPress={() =>
                  navigateAfterClose("/login")
                }
              />

              <MenuOption
                icon="person-add-outline"
                label="Registrarse"
                onPress={() =>
                  navigateAfterClose("/register")
                }
              />

              <MenuOption
                icon="person-circle-outline"
                label="Mi perfil"
                onPress={() =>
                  navigateAfterClose("/profile")
                }
              />
            </View>

            <Text style={styles.caption}>
              NLDMAP · 1.0.0
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MenuOption({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  const { colors: c } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 12,
          backgroundColor: c.surfaceAlt,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons
        name={icon}
        size={23}
        color={c.text}
        accessible={false}
      />

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: c.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "transparent",
    },

    safeArea: {
      flex: 1,
      flexDirection: "row",
    },

    drawer: {
      width: "85%",
      maxWidth: 320,
      height: "100%",
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 24,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      paddingBottom: 12,
    },

    title: {
      color: c.text,
      fontSize: 23,
      fontWeight: "800",
    },

    closeButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },

    options: {
      gap: 10,
    },

    caption: {
      marginTop: "auto",
      color: c.muted,
      fontSize: 12,
      paddingBottom: 12,
    },
  });
}
