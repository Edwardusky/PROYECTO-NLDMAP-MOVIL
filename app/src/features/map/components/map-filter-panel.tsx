
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  CASE_STATUSES,
  type CaseStatus,
} from "@/features/reports/model/case-status";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import { CloseButton } from "@/shared/components/close-button";

export type FilterPanel = "filters";

type Props = {
  panel: FilterPanel | null;
  onClose: () => void;
  caseStatuses: CaseStatus[];
  onToggleCase: (status: CaseStatus) => void;
};

export function MapFilterPanel({
  panel,
  onClose,
  caseStatuses,
  onToggleCase,
}: Props) {
  const { colors: c } = useAppTheme();
  const styles = createStyles(c);

  return (
    <Modal
      visible={panel === "filters"}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={["portrait", "landscape"]}
    >
      <SafeAreaProvider style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Cerrar panel de filtros"
          onPress={onClose}
        />

        <SafeAreaView
          style={styles.safeArea}
          edges={["top", "bottom", "left", "right"]}
          pointerEvents="box-none"
        >
          <View
            style={styles.panel}
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
          >
            <View style={styles.heading}>
              <Text
                accessibilityRole="header"
                style={styles.title}
              >
                Filtros
              </Text>

              <CloseButton
                label="Cerrar panel de filtros"
                onPress={onClose}
              />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
            >
              <Text style={styles.body}>
                Selecciona qué reportes deseas
                visualizar en el mapa.
              </Text>

              <Text
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                Estado de seguimiento
              </Text>

              {CASE_STATUSES.map((status) => {
                const checked =
                  caseStatuses.includes(status);

                return (
                  <Pressable
                    key={status}
                    accessibilityRole="checkbox"
                    accessibilityLabel={status}
                    accessibilityState={{
                      checked,
                    }}
                    onPress={() => onToggleCase(status)}
                    style={({ pressed }) => [
                      styles.option,
                      checked && styles.selected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={
                        checked
                          ? "checkbox-outline"
                          : "square-outline"
                      }
                      size={26}
                      color={c.text}
                      accessible={false}
                    />

                    <View style={styles.flex}>
                      <Text style={styles.label}>
                        {status}
                      </Text>

                      <Text style={styles.body}>
                        {checked
                          ? "Seleccionado"
                          : "Sin seleccionar"}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        status === "Localizados"
                          ? "checkmark-circle-outline"
                          : "search-outline"
                      }
                      size={24}
                      color={
                        status === "Localizados"
                          ? c.located
                          : c.searching
                      }
                      accessible={false}
                    />
                  </Pressable>
                );
              })}

              {!caseStatuses.length && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.body}
                >
                  No hay estados seleccionados.
                  Selecciona al menos uno para
                  mostrar reportes.
                </Text>
              )}

              <View style={styles.notice}>
                <Text style={styles.body}>
                  Demostración: los reportes
                  mostrados son ficticios.
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
    },

    safeArea: {
      flex: 1,
      alignItems: "flex-end",
    },

    panel: {
      flex: 1,
      minHeight: 0,
      width: "86%",
      maxWidth: 380,
      backgroundColor: c.surface,
    },

    heading: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderBottomWidth: 1,
      borderColor: c.divider,
    },

    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
    },

    scroll: {
      flex: 1,
      minHeight: 0,
    },

    content: {
      padding: 16,
      gap: 16,
    },

    body: {
      fontSize: 14,
      lineHeight: 22,
      color: c.muted,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
    },

    label: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },

    option: {
      minHeight: 56,
      padding: 12,
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },

    selected: {
      borderColor: c.action,
      borderWidth: 2,
    },

    flex: {
      flex: 1,
    },

    pressed: {
      opacity: 0.7,
    },

    notice: {
      borderTopWidth: 1,
      borderColor: c.divider,
      paddingTop: 16,
    },
  });
}
