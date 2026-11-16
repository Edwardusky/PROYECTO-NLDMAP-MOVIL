
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import { CloseButton } from "@/shared/components/close-button";
import type { MapCase } from "../utils/map-cases";

type ListedCase = MapCase & {
  municipality?: string;
};

type Props = {
  visible: boolean;
  cases: ListedCase[];
  onClose: () => void;
  onOpenReport: (id: string) => void;
};

export function MapReportList({
  visible,
  cases,
  onClose,
  onOpenReport,
}: Props) {
  const { colors: c } = useAppTheme();
  const styles = createStyles(c);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={[
        "portrait",
        "landscape",
      ]}
    >
      <SafeAreaProvider style={styles.overlay}>
        {/* Cerrar al pulsar fuera del panel */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar lista de reportes"
          style={StyleSheet.absoluteFill}
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
                Lista de reportes
              </Text>

              <CloseButton
                label="Cerrar lista de reportes"
                onPress={onClose}
              />
            </View>

            <FlatList
              data={cases}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.content}
              ListHeaderComponent={
                <Text style={styles.summary}>
                  {cases.length} {
                    cases.length === 1
                      ? "reporte visible"
                      : "reportes visibles"
                  }
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    "Ver detalle del reporte de " +
                    item.name
                  }
                  accessibilityHint={
                    "Abre la ficha del reporte seleccionado"
                  }
                  onPress={() => onOpenReport(item.id)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardHeading}>
                    <Text
                      style={styles.caseName}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Ionicons
                      name="chevron-forward-outline"
                      size={22}
                      color={c.text}
                      accessible={false}
                    />
                  </View>

                  <View style={styles.statusRow}>
                    <Ionicons
                      name={
                        item.status === "Localizados"
                          ? "checkmark-circle-outline"
                          : "search-outline"
                      }
                      size={20}
                      color={
                        item.status === "Localizados"
                          ? c.located
                          : c.searching
                      }
                      accessible={false}
                    />

                    <Text style={styles.caseStatus}>
                      {item.status}
                    </Text>
                  </View>

                  <Text style={styles.caseDetail}>
                    Edad: {item.age} años
                  </Text>

                  {item.municipality && (
                    <Text style={styles.caseDetail}>
                      Municipio: {item.municipality}
                    </Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons
                    name="search-outline"
                    size={36}
                    color={c.muted}
                    accessible={false}
                  />

                  <Text
                    accessibilityRole="text"
                    style={styles.emptyTitle}
                  >
                    No hay reportes visibles
                  </Text>

                  <Text style={styles.caseDetail}>
                    No hay reportes que coincidan
                    con los filtros seleccionados.
                    Puedes cerrar la lista y
                    modificar los filtros.
                  </Text>
                </View>
              }
              ListFooterComponent={
                <Text style={styles.notice}>
                  Demostración: los casos mostrados
                  son ficticios y no representan
                  reportes reales.
                </Text>
              }
            />
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
      width: "90%",
      maxWidth: 420,
      backgroundColor: c.surface,
    },

    heading: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: c.divider,
    },

    title: {
      flex: 1,
      color: c.text,
      fontSize: 21,
      fontWeight: "800",
    },

    list: {
      flex: 1,
    },

    content: {
      padding: 16,
      paddingBottom: 24,
      gap: 12,
    },

    summary: {
      color: c.muted,
      fontSize: 14,
      fontWeight: "600",
    },

    card: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      minHeight: 112,
    },

    cardHeading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },

    caseName: {
      flex: 1,
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },

    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    caseStatus: {
      color: c.text,
      fontSize: 14,
      fontWeight: "600",
    },

    caseDetail: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 20,
    },

    pressed: {
      opacity: 0.7,
    },

    empty: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 48,
      paddingHorizontal: 16,
    },

    emptyTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
    },

    notice: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: c.divider,
    },
  });
}
