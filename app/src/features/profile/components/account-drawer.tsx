
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, type ComponentProps } from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import type { Palette } from "@/shared/constants/palette";

import {
  useAppTheme,
} from "@/shared/theme/app-theme-context";

import {
  useAuthSession,
} from "@/features/auth/state/auth-session-context";

type AccountRoute = "/profile" | "/settings";

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: AccountRoute) => void;
  onRequestAuth: () => void;
  onLogout: () => void;
};

/**
 * Contenido del menú Push.
 *
 * No utiliza Modal ni aplica animaciones.
 * El contenedor del mapa mueve el menú
 * y la pantalla principal simultáneamente.
 */
export function AccountDrawer({
  visible,
  onClose,
  onNavigate,
  onRequestAuth,
  onLogout,
}: Props) {
  const { colors: c } = useAppTheme();
  const { user } = useAuthSession();

  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  return (
    <View
      style={styles.page}
      pointerEvents={visible ? "auto" : "none"}
      importantForAccessibility={
        visible ? "yes" : "no-hide-descendants"
      }
      accessibilityViewIsModal={visible}
      onAccessibilityEscape={onClose}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
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
              size={28}
              color={c.text}
              accessible={false}
            />
          </Pressable>
        </View>

        {/* Información del usuario */}
        {user ? (
          <View style={styles.identity}>
            <Ionicons
              name="person-circle-outline"
              size={48}
              color={c.text}
              accessible={false}
            />

            <View style={styles.identityContent}>
              <Text style={styles.identityCaption}>
                Sesión iniciada
              </Text>

              <Text
                style={styles.identityName}
                numberOfLines={2}
              >
                {user.displayName}
              </Text>

              <Text
                style={styles.identityEmail}
                numberOfLines={1}
              >
                {user.email ?? "Sin correo"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.description}>
            Consulta los reportes libremente.
            Para acceder a tu perfil, inicia
            sesión o crea una cuenta.
          </Text>
        )}

        {/* Opciones del menú */}
        <View style={styles.options}>
          <MenuOption
            icon="person-outline"
            label="Mi perfil"
            badge={!user ? "Registrarse" : undefined}
            onPress={() => {
              if (user) {
                onNavigate("/profile");
              } else {
                onRequestAuth();
              }
            }}
          />

          {user && (
            <MenuOption
              icon="albums-outline"
              label="Mis aportaciones (próximamente)"
              disabled
              onPress={() => {}}
            />
          )}

          <MenuOption
            icon="settings-outline"
            label="Ajustes"
            onPress={() => onNavigate("/settings")}
          />

          {user && (
            <MenuOption
              icon="log-out-outline"
              label="Cerrar sesión"
              onPress={onLogout}
            />
          )}
        </View>

        {/* Pie de página */}
        <Text style={styles.caption}>
          NLDMAP · 1.0.0
        </Text>
      </SafeAreaView>
    </View>
  );
}

function MenuOption({
  icon,
  label,
  badge,
  onPress,
  disabled = false,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  badge?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors: c } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        badge ? `${label}. ${badge}` : label
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 58,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 14,
          backgroundColor: c.surfaceAlt,
          opacity: disabled ? 0.45 : 1,
        },
        pressed && {
          opacity: 0.7,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={c.text}
        accessible={false}
      />

      <Text
        style={{
          flex: 1,
          color: c.text,
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      {badge && (
        <View
          style={{
            backgroundColor: c.action,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              color: c.onAction,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    page: {
      flex: 1,
      width: "100%",
      height: "100%",
      backgroundColor: c.surface,
    },

    safeArea: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 22,
    },

    header: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      paddingBottom: 12,
    },

    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
    },

    closeButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },

    description: {
      color: c.muted,
      fontSize: 15,
      lineHeight: 23,
    },

    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surfaceAlt,
    },

    identityContent: {
      flex: 1,
      gap: 4,
    },

    identityCaption: {
      fontSize: 13,
      color: c.muted,
    },

    identityName: {
      fontSize: 17,
      fontWeight: "700",
      color: c.text,
    },

    identityEmail: {
      fontSize: 13,
      color: c.muted,
    },

    options: {
      gap: 12,
    },

    caption: {
      marginTop: "auto",
      fontSize: 12,
      color: c.muted,
      paddingBottom: 12,
    },
  });
}
