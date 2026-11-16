
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  optional?: boolean;
  error?: string;
};

export function ReportOptionPicker({
  label,
  value,
  options,
  onChange,
  optional = true,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const { colors: c } = useAppTheme();

  const s = useMemo(() => createStyles(c), [c]);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{
          text: value || "Sin seleccionar",
        }}
        accessibilityHint="Abre la lista de opciones"
        onPress={() => setOpen(true)}
        style={[
          s.trigger,
          error ? s.invalid : null,
        ]}
      >
        <Text style={[
          s.value,
          !value && s.placeholder,
        ]}>
          {value || "Seleccionar opción"}
        </Text>

        <Ionicons
          name="chevron-down"
          size={20}
          color={c.text}
          accessible={false}
        />
      </Pressable>

      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={s.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Cerrar opciones"
            onPress={() => setOpen(false)}
          />

          <View style={s.panel}>
            <View style={s.panelHeader}>
              <Text style={s.heading}>{label}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={() => setOpen(false)}
                style={s.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={c.text}
                />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.options}
            >
              {optional && (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: !value,
                  }}
                  style={s.option}
                  onPress={() => select("")}
                >
                  <Text style={s.optionText}>
                    No indicar
                  </Text>
                </Pressable>
              )}

              {options.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={option}
                  accessibilityState={{
                    checked: value === option,
                  }}
                  style={s.option}
                  onPress={() => select(option)}
                >
                  <Text style={s.optionText}>
                    {option}
                  </Text>

                  {value === option && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={c.action}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    field: {
      gap: 8,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    trigger: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.paper,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    value: {
      flex: 1,
      fontSize: 16,
      color: c.text,
    },
    placeholder: {
      color: c.muted,
    },
    invalid: {
      borderColor: c.error,
    },
    error: {
      fontSize: 14,
      color: c.error,
    },
    modal: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.overlay,
    },
    panel: {
      maxHeight: "80%",
      backgroundColor: c.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingBottom: 12,
      overflow: "hidden",
    },
    panelHeader: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    heading: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: c.text,
    },
    closeButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    options: {
      padding: 14,
      gap: 6,
    },
    option: {
      minHeight: 52,
      borderRadius: 10,
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionText: {
      fontSize: 16,
      color: c.text,
    },
  });
}
