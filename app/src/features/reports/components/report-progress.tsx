
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

type Props = {
  step: number;
  sections: readonly string[];
};

export function ReportProgress({ step, sections }: Props) {
  const { colors: c } = useAppTheme();
  const s = useMemo(() => createStyles(c), [c]);

  const current = Math.max(
    0,
    Math.min(step, sections.length - 1)
  );

  const remaining = sections.length - current - 1;

  return (
    <View style={s.container}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso del registro"
        accessibilityValue={{
          min: 1,
          max: sections.length,
          now: current + 1,
          text: `Paso ${current + 1} de ${sections.length}: ${sections[current]}`,
        }}
      >
        <View style={s.progressRow}>
          {sections.map((section, index) => {
            const complete = index < current;
            const active = index === current;

            return (
              <View
                key={section}
                style={s.progressItem}
                accessible={false}
              >
                <View
                  style={[
                    s.circle,
                    complete && s.circleComplete,
                    active && s.circleActive,
                  ]}
                >
                  {complete ? (
                    <Ionicons
                      name="checkmark"
                      color={c.onAction}
                      size={16}
                    />
                  ) : (
                    <Text
                      style={[
                        s.circleText,
                        active && s.circleTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    s.segment,
                    index <= current && s.segmentActive,
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.description}>
        <Text style={s.counter}>
          PASO {current + 1} DE {sections.length}
        </Text>

        <Text
          accessibilityRole="header"
          style={s.title}
        >
          {sections[current]}
        </Text>

        <Text style={s.caption}>
          {remaining === 0
            ? "Última sección: revisa los datos capturados."
            : `${remaining} ${
                remaining === 1 ? "paso restante" : "pasos restantes"
              } después de esta sección.`}
        </Text>
      </View>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      width: "100%",
      gap: 12,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    progressItem: {
      flex: 1,
      alignItems: "center",
      gap: 5,
    },
    circle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    circleComplete: {
      backgroundColor: c.action,
      borderColor: c.action,
    },
    circleActive: {
      borderColor: c.action,
      borderWidth: 2,
      backgroundColor: c.paper,
    },
    circleText: {
      color: c.muted,
      fontSize: 13,
      fontWeight: "700",
    },
    circleTextActive: {
      color: c.text,
    },
    segment: {
      width: "100%",
      height: 4,
      borderRadius: 4,
      backgroundColor: c.divider,
    },
    segmentActive: {
      backgroundColor: c.action,
    },
    description: {
      gap: 3,
    },
    counter: {
      color: c.action,
      fontSize: 12,
      fontWeight: "800",
    },
    title: {
      color: c.text,
      fontSize: 21,
      fontWeight: "800",
    },
    caption: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}
