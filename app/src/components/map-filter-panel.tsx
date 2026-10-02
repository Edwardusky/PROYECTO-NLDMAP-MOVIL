import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { CASE_STATUSES, type CaseStatus } from "@/constants/map";

export type FilterPanel = "cases" | "events" | "relief";
type Props = {
  panel: FilterPanel | null;
  onClose: () => void;
  caseStatuses: CaseStatus[];
  onToggleCase: (status: CaseStatus) => void;
  showSightings: boolean;
  onToggleSightings: () => void;
};

export function MapFilterPanel({
  panel,
  onClose,
  caseStatuses,
  onToggleCase,
  showSightings,
  onToggleSightings,
}: Props) {
  const title =
    panel === "cases"
      ? "Estados de caso"
      : panel === "events"
        ? "Capa de eventos"
        : "Capas";
  return (
    <Modal
      visible={panel !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <SafeAreaProvider style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Cerrar panel de filtros"
          onPress={onClose}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']} pointerEvents="box-none">
          <View
            style={styles.panel}
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
          >
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.heading}>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar panel"
                  onPress={onClose}
                  style={styles.close}
                >
                  <Text style={styles.label}>
                    Cerrar{" "}
                    <Ionicons
                      name="close-outline"
                      size={15}
                      color="#173D3A"
                      accessible={false}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  </Text>
                </Pressable>
              </View>
              {panel === "cases" && (
                <>
                  <Text style={styles.body}>
                    Filtra los casos ficticios de esta demostración por su estado.
                  </Text>
                  {CASE_STATUSES.map((status) => (
                    <Pressable
                      key={status}
                      accessibilityRole="checkbox"
                      accessibilityLabel={status}
                      accessibilityState={{
                        checked: caseStatuses.includes(status),
                      }}
                      onPress={() => onToggleCase(status)}
                      style={styles.option}
                    >
                      <Text style={[styles.label, styles.flex]}>{status}</Text>
                      <Text accessible={false} style={styles.label}>
                        <Ionicons
                          name={
                            caseStatuses.includes(status)
                              ? "checkbox-outline"
                              : "square-outline"
                          }
                          size={15}
                          color="#173D3A"
                          accessible={false}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}
              {panel === "events" && (
                <>
                  <Text style={styles.body}>
                    Los avistamientos son eventos independientes del estado de un
                    caso.
                  </Text>
                  <View style={styles.option}>
                    <Text style={[styles.label, styles.flex]}>Avistamientos</Text>
                    <Switch
                      accessibilityLabel="Mostrar capa de avistamientos"
                      value={showSightings}
                      onValueChange={onToggleSightings}
                      trackColor={{ true: "#173D3A" }}
                    />
                  </View>
                </>
              )}
              {panel === "relief" && (
                <>
                  <View style={styles.option}>
                    <Text style={[styles.label, styles.flex]}>
                      Relieve
                    </Text>
                    <Switch
                      accessibilityLabel="Relieve no disponible"
                      disabled
                      value={false}
                    />
                  </View>
                  <Text style={styles.body}>
                    No disponible.
                  </Text>
                </>
              )}
              {panel !== "relief" && (
                <View style={styles.notice}>
                  <Text style={styles.label}>Modo demostración</Text>
                  <Text style={styles.body}>
                    Casos ficticios. No hay avistamientos en esta demostración.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000066" },
  safeArea: { flex: 1, alignItems: "flex-end" },
  panel: {
    flex: 1,
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#F7F9F6",
  },
  heading: { gap: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#173D3A" },
  close: {
    minHeight: 48,
    justifyContent: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 12,
  },
  content: { padding: 16, gap: 16 },
  body: { fontSize: 14, lineHeight: 22, color: "#52675E" },
  label: { fontSize: 15, fontWeight: "600", color: "#173D3A" },
  option: {
    minHeight: 56,
    padding: 12,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: "#E8EEE7",
  },
  flex: { flex: 1 },
  notice: { borderTopWidth: 1, borderColor: "#D8E1D9", paddingTop: 16, gap: 8 },
});
