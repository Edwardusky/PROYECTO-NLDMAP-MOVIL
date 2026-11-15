import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { palette as c } from "@/shared/constants/palette";
import { MapSelectionPopup } from "./map-selection-popup";
import type { MapCase } from "../utils/map-cases";

type Props = {
  point: [number, number];
  viewport: { width: number; height: number };
  selectedCases: MapCase[];
  onClose: () => void;
  onOpenReport: (id: string) => void;
};

export function MapReportPopup(props: Props) {
  const { point, viewport, selectedCases, onClose, onOpenReport } = props;
  return (
    <MapSelectionPopup
      point={point}
      viewport={viewport}
      title={
        selectedCases.length === 1
          ? "1 reporte en esta ubicación"
          : selectedCases.length + " reportes en esta ubicación"
      }
      onClose={onClose}
    >
      <Text style={styles.caption}>
        Compartir ubicación no implica que los reportes estén
        relacionados.
      </Text>
      {selectedCases.map((item) => (
        <View key={item.id} style={styles.caseRow}>
          <Text style={styles.controlText}>{item.name}</Text>
          <Text style={styles.body}>
            <Ionicons
              name={
                item.status === "Localizados"
                  ? "checkmark-circle-outline"
                  : "search-outline"
              }
              size={16}
              color={c.text}
              accessible={false}
            />{" "}
            {item.age} años · {item.status}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              "Ver detalle del reporte de " + item.name
            }
            onPress={() => onOpenReport(item.id)}
            style={({ pressed }) => [
              styles.remove,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="eye-outline"
              size={24}
              color={c.text}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        </View>
      ))}
    </MapSelectionPopup>
  );
}

const styles = StyleSheet.create({
  body: { color: c.muted, fontSize: 12, lineHeight: 18 },
  caption: { color: c.muted, fontSize: 11, lineHeight: 16 },
  caseRow: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderColor: c.divider },
  controlText: { color: c.text, fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  remove: {
    minHeight: 48,
    minWidth: 64,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
  },
});
