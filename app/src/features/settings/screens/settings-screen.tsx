
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  useMemo,
  type ComponentProps,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useAppTheme,
  type ThemeMode,
} from "@/shared/theme/app-theme-context";

import type {
  Palette,
} from "@/shared/constants/palette";

type ThemeOption = {
  value: ThemeMode;
  label: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Claro",
    description: "Mantener siempre el tema claro.",
    icon: "sunny-outline",
  },
  {
    value: "system",
    label: "Automático",
    description:
      "Utilizar la apariencia configurada en el dispositivo.",
    icon: "phone-portrait-outline",
  },
  {
    value: "dark",
    label: "Oscuro",
    description: "Mantener siempre el tema oscuro.",
    icon: "moon-outline",
  },
];

export default function SettingsScreen() {
  const { mode, setMode, colors: c } = useAppTheme();

  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.surface }}
      contentContainerStyle={styles.content}
    >
      <Text
        accessibilityRole="header"
        style={styles.heading}
      >
        Apariencia
      </Text>

      <Text style={styles.description}>
        Personaliza cómo se muestra NLDMAP.
        Puedes utilizar el tema del dispositivo
        o seleccionar uno de manera permanente.
      </Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Apariencia de NLDMAP"
        style={styles.options}
      >
        {THEME_OPTIONS.map((option) => {
          const selected = mode === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
              accessibilityState={{
                checked: selected,
              }}
              onPress={() => setMode(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selectedOption,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={26}
                color={c.text}
                accessible={false}
              />

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {option.label}
                </Text>

                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>

              <Ionicons
                name={
                  selected
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={24}
                color={selected ? c.action : c.muted}
                accessible={false}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>
        La preferencia se guarda automáticamente
        y se conserva al volver a abrir la aplicación.
      </Text>
    </ScrollView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 16,
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
    },

    heading: {
      color: c.text,
      fontSize: 24,
      fontWeight: "700",
    },

    description: {
      color: c.muted,
      fontSize: 16,
      lineHeight: 24,
    },

    options: {
      gap: 12,
      marginTop: 8,
    },

    option: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 84,
      gap: 14,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.paper,
    },

    selectedOption: {
      borderColor: c.action,
      backgroundColor: c.surfaceAlt,
    },

    pressed: {
      opacity: 0.7,
    },

    optionContent: {
      flex: 1,
      gap: 4,
    },

    optionTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: "600",
    },

    optionDescription: {
      color: c.muted,
      fontSize: 14,
      lineHeight: 20,
    },

    note: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
  });
}
