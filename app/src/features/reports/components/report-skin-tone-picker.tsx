
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { useAppTheme } from "@/shared/theme/app-theme-context";
import type { Palette } from "@/shared/constants/palette";

import {
  MONK_SKIN_TONES,
  skinToneLabel,
} from "../model/report-appearance-options";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ReportSkinTonePicker({
  value,
  onChange,
}: Props) {
  const { colors: c } = useAppTheme();
  const s = useMemo(() => createStyles(c), [c]);

  return (
    <View style={s.container}>
      <Text style={s.label}>
        Tono de piel · Opcional
      </Text>

      <Text style={s.help}>
        Selecciona la muestra más parecida al tono
        que recuerdas. La iluminación puede
        alterar los colores percibidos.
      </Text>

      <View style={s.grid}>
        {MONK_SKIN_TONES.map((tone) => {
          const selected = value === tone.id;

          return (
            <Pressable
              key={tone.id}
              accessibilityRole="radio"
              accessibilityLabel={
                `Tono de piel Monk ${tone.number}`
              }
              accessibilityState={{
                checked: selected,
              }}
              onPress={() => onChange(tone.id)}
              style={[
                s.item,
                selected && s.selected,
              ]}
            >
              <View
                style={[
                  s.swatch,
                  { backgroundColor: tone.hex },
                ]}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={
                      Number(tone.number) >= 7
                        ? "#FFFFFF"
                        : "#202020"
                    }
                  />
                )}
              </View>

              <Text style={s.number}>
                {tone.number}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.help}>
        {value
          ? `Seleccionado: ${skinToneLabel(value)}`
          : "Ningún tono seleccionado."}
      </Text>

      {!!value && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange("")}
          style={s.clear}
        >
          <Text style={s.clearText}>
            Quitar selección
          </Text>
        </Pressable>
      )}

      <Text style={s.credit}>
        Referencia visual: Monk Skin Tone Scale,
        Ellis Monk / Google, CC BY 4.0.
      </Text>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      gap: 10,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    help: {
      fontSize: 14,
      lineHeight: 21,
      color: c.muted,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: "space-between",
    },
    item: {
      width: "18%",
      minHeight: 76,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.paper,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 5,
    },
    selected: {
      borderWidth: 2,
      borderColor: c.action,
    },
    swatch: {
      width: 43,
      height: 43,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    number: {
      fontSize: 12,
      fontWeight: "700",
      color: c.text,
    },
    clear: {
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    clearText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.action,
    },
    credit: {
      fontSize: 11,
      color: c.muted,
    },
  });
}
