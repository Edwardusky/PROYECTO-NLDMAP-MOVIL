
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

type AuthPurpose = "report" | "profile";

type Props = {
  visible: boolean;
  purpose: AuthPurpose;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

export function AuthEntrySheet({
  visible,
  purpose,
  onClose,
  onLogin,
  onRegister,
}: Props) {
  const { colors: c } = useAppTheme();

  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  const isReport = purpose === "report";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: c.overlay },
          ]}
          accessible={false}
          onPress={onClose}
        />

        <SafeAreaView
          style={styles.sheet}
          edges={["bottom"]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar opciones de acceso"
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

          <View style={styles.iconContainer}>
            <Ionicons
              name="person-circle-outline"
              size={36}
              color={c.action}
              accessible={false}
            />
          </View>

          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {isReport
              ? "Crea tu reporte con NLDMAP"
              : "Accede a NLDMAP"}
          </Text>

          <Text style={styles.description}>
            {isReport
              ? "Para crear un reporte necesitas iniciar sesión o registrarte."
              : "Inicia sesión o crea una cuenta para acceder a tu perfil."}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
            onPress={onLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>
              Iniciar sesión
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
            onPress={onRegister}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryText}>
              Crear cuenta
            </Text>
          </Pressable>

          <Text style={styles.note}>
            Puedes continuar consultando el mapa
            sin iniciar sesión.
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "transparent",
    },

    sheet: {
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
      backgroundColor: c.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 24,
      alignItems: "center",
      gap: 14,
    },

    handle: {
      width: 42,
      height: 5,
      backgroundColor: c.border,
      borderRadius: 5,
      marginBottom: 2,
    },

    closeButton: {
      width: 48,
      height: 48,
      alignSelf: "flex-end",
      justifyContent: "center",
      alignItems: "center",
    },

    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: c.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: c.text,
      fontSize: 23,
      fontWeight: "800",
      textAlign: "center",
    },

    description: {
      color: c.muted,
      fontSize: 15,
      lineHeight: 23,
      textAlign: "center",
      marginBottom: 12,
    },

    primaryButton: {
      width: "100%",
      minHeight: 52,
      borderRadius: 14,
      backgroundColor: c.action,
      justifyContent: "center",
      alignItems: "center",
    },

    primaryText: {
      color: c.onAction,
      fontSize: 16,
      fontWeight: "700",
    },

    secondaryButton: {
      width: "100%",
      minHeight: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },

    secondaryText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },

    note: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 6,
    },

    pressed: {
      opacity: 0.7,
    },
  });
}
