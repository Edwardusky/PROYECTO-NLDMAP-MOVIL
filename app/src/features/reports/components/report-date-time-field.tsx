
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/shared/theme/app-theme-context";
import type { Palette } from "@/shared/constants/palette";

type Props = {
  label: string;
  mode: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatPickerValue(
  value: Date,
  mode: "date" | "time"
): string {
  if (mode === "time") {
    return (
      `${twoDigits(value.getHours())}:` +
      twoDigits(value.getMinutes())
    );
  }

  return (
    `${value.getFullYear()}-` +
    `${twoDigits(value.getMonth() + 1)}-` +
    twoDigits(value.getDate())
  );
}

function parsePickerValue(
  value: string,
  mode: "date" | "time"
): Date {
  const now = new Date();

  if (mode === "date") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const candidate = new Date(
        year,
        month - 1,
        day,
        12
      );

      if (
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day
      ) {
        return candidate;
      }
    }

    return now;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (match) {
    now.setHours(
      Number(match[1]),
      Number(match[2]),
      0,
      0
    );
  }

  return now;
}

export function ReportDateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
}: Props) {
  const { colors: c } = useAppTheme();

  const styles = useMemo(
    () => createStyles(c),
    [c]
  );

  const [open, setOpen] = useState(false);

  const [pending, setPending] = useState(
    () => parsePickerValue(value, mode)
  );

  function openPicker() {
    const initial = parsePickerValue(value, mode);


    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode,

        // Utilizar ruedas en lugar de calendario o reloj.
        display: "spinner",

        // Mantener formato de 24 horas.
        is24Hour: false,

        // Impedir seleccionar fechas futuras.
        maximumDate:
          mode === "date" ? new Date() : undefined,

        positiveButton: {
          label: "Aceptar",
        },

        negativeButton: {
          label: "Cancelar",
        },

        onChange: (event, selectedDate) => {
          if (
            event.type !== "set" ||
            !selectedDate
          ) {
            return;
          }

          onChange(
            formatPickerValue(selectedDate, mode)
          );
        },
      });

      return;
    }


    setPending(initial);
    setOpen(true);
  }

  function confirmIOS() {
    onChange(formatPickerValue(pending, mode));
    setOpen(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{
          text: value || "Sin seleccionar",
        }}
        accessibilityHint={
          mode === "date"
            ? "Abre el calendario para seleccionar una fecha"
            : "Abre el reloj para seleccionar una hora"
        }
        onPress={openPicker}
        style={[
          styles.trigger,
          error && styles.invalid,
        ]}
      >
        <Ionicons
          name={
            mode === "date"
              ? "calendar-outline"
              : "time-outline"
          }
          size={22}
          color={c.action}
          accessible={false}
        />


        <Text style={styles.value}>
          {value
            ? mode === "date"
              ? parsePickerValue(value, mode).toLocaleDateString(
                "es-MX",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )
              : new Date(
                `2000-01-01T${value}:00`
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : mode === "date"
              ? "Seleccionar fecha"
              : "Seleccionar hora"}
        </Text>


        <Ionicons
          name="chevron-forward"
          size={20}
          color={c.muted}
          accessible={false}
        />
      </Pressable>

      {!!error && (
        <Text
          accessibilityRole="alert"
          style={styles.error}
        >
          {error}
        </Text>
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.overlay}>
            <SafeAreaView
              edges={["bottom"]}
              style={styles.dialog}
            >
              <Text style={styles.heading}>
                {label}
              </Text>

              <DateTimePicker
                value={pending}
                mode={mode}
                display="spinner"
                is24Hour={false}
                locale="es-MX"
                maximumDate={
                  mode === "date"
                    ? new Date()
                    : undefined
                }
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setPending(selectedDate);
                  }
                }}
                style={styles.picker}
              />

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(false)}
                  style={styles.action}
                >
                  <Text style={styles.actionText}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirmIOS}
                  style={styles.action}
                >
                  <Text style={styles.actionText}>
                    Confirmar
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      color: c.text,
      fontSize: 15,
      fontWeight: "600",
    },
    trigger: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.paper,
    },
    invalid: {
      borderColor: c.error,
    },
    value: {
      flex: 1,
      color: c.text,
      fontSize: 16,
    },
    error: {
      color: c.error,
      fontSize: 14,
    },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.overlay,
    },
    dialog: {
      padding: 18,
      gap: 12,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: c.surface,
    },
    heading: {
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
    },
    picker: {
      height: 200,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    action: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
    },
    actionText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
