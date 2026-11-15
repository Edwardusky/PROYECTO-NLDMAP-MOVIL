import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import type { FilterPanel } from "./map-filter-panel";

type Props = {
  height: number;
  northTop: number;
  panel: FilterPanel | null;
  caseCount: number;
  showSightings: boolean;
  onOpen: (panel: FilterPanel) => void;
};

export function MapToolbar(props: Props) {
  const { colors: c } = useAppTheme();
  const styles = createStyles(c);
  const { height, northTop, panel, caseCount, showSightings, onOpen: setPanel } = props;
  return (
    <ScrollView
      style={[
        styles.rail,
        { top: Math.max(height * 0.45, northTop + 72) },
      ]}
      contentContainerStyle={styles.controls}
      showsVerticalScrollIndicator={false}
    >
      {(
        [
          ["relief", "layers-outline", "Capas", "Relieve no disponible"],
          ["cases", "filter-outline", "Reportes", `${caseCount}/2`],
          [
            "events",
            "radio-outline",
            "Avistamientos",
            showSightings ? "Opción activada" : "Opción desactivada",
          ],
        ] as const
      ).map(([id, icon, label, value]) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}. Abrir opciones`}
          accessibilityState={{
            expanded: panel === id,
            selected: panel === id,
          }}
          onPress={() => setPanel(id)}
          style={({ pressed }) => [
            styles.control,
            pressed && styles.controlPressed,
          ]}
        >
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {[
              [1.5, 0],
              [-1.5, 0],
              [0, 1.5],
              [0, -1.5],
            ].map(([x, y], index) => (
              <Ionicons
                key={index}
                name={icon}
                size={32}
                color={c.paper}
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateX: x }, { translateY: y }] },
                ]}
              />
            ))}
            <Ionicons
              name={icon}
              size={32}
              color={panel === id ? c.draft : c.text}
            />
          </View>
          <Text style={styles.floatingLabel}>{label}</Text>
          {panel === id && <View style={styles.activeDot} />}
        </Pressable>
      ))}
    </ScrollView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    rail: { position: "absolute", right: 12, bottom: 48, width: 88 },
    controls: { gap: 8, flexGrow: 1, justifyContent: "flex-end" },
    control: {
      minWidth: 76,
      minHeight: 64,
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    controlPressed: { transform: [{ scale: 0.9 }], opacity: 0.75 },
    activeDot: {
      position: "absolute",
      bottom: 4,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.draft,
      borderWidth: 1,
      borderColor: c.paper,
    },
    floatingLabel: {
      color: c.text,
      backgroundColor: c.surface,
      borderRadius: 4,
      paddingHorizontal: 4,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
  });
}
