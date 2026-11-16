
import { useMemo, type ReactNode } from "react";
import { useHeaderHeight } from "expo-router/react-navigation";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  lightPalette,
  type Palette,
} from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

function createFormStyles(c: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.surface,
    },
    content: {
      padding: 20,
      gap: 20,
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
    },
    heading: {
      fontSize: 19,
      fontWeight: "700",
      color: c.text,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: c.muted,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    field: {
      gap: 8,
    },
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surfaceAlt,
      gap: 16,
    },
    input: {
      minHeight: 48,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      color: c.text,
      backgroundColor: c.paper,
      fontSize: 16,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    invalid: {
      borderColor: c.error,
    },
    error: {
      color: c.error,
      fontSize: 15,
    },
    button: {
      minHeight: 48,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.action,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: c.onAction,
      fontWeight: "700",
      fontSize: 15,
      textAlign: "center",
    },
    secondary: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    secondaryText: {
      color: c.text,
    },
    choices: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    choice: {
      minHeight: 48,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
      flexShrink: 1,
    },
    chosen: {
      backgroundColor: c.action,
    },
    pressed: {
      opacity: 0.7,
    },
    stickyHeader: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
  });
}

/**
 * Estilos dinámicos para componentes que usan
 * la paleta activa de NLDMAP.
 */
export function useFormStyles() {
  const { colors } = useAppTheme();

  return useMemo(
    () => createFormStyles(colors),
    [colors],
  );
}

/**
 * Compatibilidad temporal con componentes que
 * aún importan formStyles de manera estática.
 */
export const formStyles = createFormStyles(lightPalette);


export function FormScreen({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const s = useFormStyles();
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView
      style={s.screen}
      edges={["bottom", "left", "right"]}
    >
      {header && (
        <View style={s.stickyHeader}>
          <View
            style={{
              width: "100%",
              maxWidth: 680,
              alignSelf: "center",
            }}
          >
            {header}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


export function Field({
  label,
  error,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
}) {
  const s = useFormStyles();
  const { colors: c } = useAppTheme();

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={
          props.placeholderTextColor ?? c.muted
        }
        selectionColor={props.selectionColor ?? c.action}
        style={[
          s.input,
          props.multiline && s.multiline,
          error && s.invalid,
          props.style,
        ]}
      />
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

export function Action({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const s = useFormStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && s.pressed,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary && s.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const s = useFormStyles();

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <View style={s.choices}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option}`}
            accessibilityState={{
              checked: value === option,
            }}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              s.choice,
              value === option && s.chosen,
              pressed && s.pressed,
            ]}
          >
            <Text
              style={[
                s.label,
                value === option && s.buttonText,
              ]}
            >
              {value === option ? "✓ " : ""}
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
