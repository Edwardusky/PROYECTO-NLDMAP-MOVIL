import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { palette as c } from "@/shared/constants/palette";
import type { useDeviceLocation } from "../hooks/use-device-location";

type Props = {
  deviceLocation: ReturnType<typeof useDeviceLocation>;
  mapReady: boolean;
  confirming: boolean;
  moving: boolean;
  mapFailed: boolean;
  selecting: boolean;
  selectionError: string | null;
  hasCaseStatuses: boolean;
  visibleCount: number;
  reportStarted: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onStart: () => void;
  onContinue: () => void;
};

export function MapFooter(props: Props) {
  const {
    deviceLocation,
    mapReady,
    confirming,
    moving,
    mapFailed,
    selecting,
    selectionError,
    hasCaseStatuses,
    visibleCount,
    reportStarted,
    onConfirm: confirmLocation,
    onCancel: cancelSelection,
    onStart,
    onContinue,
  } = props;
  return (
    <ScrollView
      style={styles.footerScroll}
      contentContainerStyle={styles.footer}
      accessibilityLiveRegion="polite"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mi ubicación. Centrar mapa"
        accessibilityState={{
          busy: deviceLocation.loading,
          disabled: deviceLocation.loading || !mapReady || confirming,
        }}
        disabled={deviceLocation.loading || !mapReady || confirming}
        onPress={deviceLocation.locate}
        style={({ pressed }) => [
          styles.locationButton,
          (pressed || deviceLocation.loading || !mapReady) && styles.pressed,
        ]}
      >
        <Ionicons
          name="locate-outline"
          size={26}
          color={c.text}
          accessible={false}
        />
        <Text style={styles.controlText}>
          {deviceLocation.loading ? "Obteniendo ubicación…" : "Mi ubicación"}
        </Text>
      </Pressable>
      {deviceLocation.message && (
        <Text style={styles.body}>{deviceLocation.message}</Text>
      )}
      {deviceLocation.settings && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir Ajustes de ubicación"
          onPress={deviceLocation.openSettings}
          style={styles.remove}
        >
          <Text style={styles.controlText}>Abrir Ajustes</Text>
        </Pressable>
      )}
      {!hasCaseStatuses && (
        <Text style={styles.body}>
          No hay estados de seguimiento seleccionados. Abre Reportes para
          elegirlos.
        </Text>
      )}
      <Text style={styles.emptyTitle}>
        {visibleCount} reportes visibles
      </Text>
      <Text style={styles.caption}>
        B · En búsqueda L · Localizados B/L · Ambos
      </Text>
      {mapFailed && (
        <Text accessibilityRole="alert" style={styles.body}>
          No se pudo cargar el mapa. Revisa la conexión y vuelve a abrir esta
          pantalla.
        </Text>
      )}
      <Text style={styles.draftTitle}>
        {selecting ? "Seleccionar ubicación" : "Consultar mapa"}
      </Text>
      {selectionError && (
        <Text accessibilityRole="alert" style={styles.body}>
          {selectionError}
        </Text>
      )}
      {selecting ? (
        <>
          <Text style={styles.body}>
            Coloca el punto bajo el indicador y pulsa Confirmar ubicación.
            Mi ubicación solo centra el mapa.
          </Text>
          <View style={styles.draftRow}>
            <Pressable
              accessibilityRole="button"
              disabled={
                moving || confirming || deviceLocation.loading || !mapReady
              }
              accessibilityState={{
                disabled:
                  moving || confirming || deviceLocation.loading || !mapReady,
                busy: confirming,
              }}
              onPress={confirmLocation}
              style={[
                styles.remove,
                styles.flex,
                (moving ||
                  confirming ||
                  deviceLocation.loading ||
                  !mapReady) &&
                styles.pressed,
              ]}
            >
              <Text style={styles.controlText}>Confirmar ubicación</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={cancelSelection}
              style={styles.remove}
            >
              <Text style={styles.controlText}>Cancelar</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={styles.remove}
        >
          <Text style={styles.controlText}>
            {reportStarted
              ? "Elegir ubicación del borrador"
              : "Crear reporte"}
          </Text>
        </Pressable>
      )}
      {reportStarted && !selecting && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar borrador temporal"
          onPress={onContinue}
          style={styles.remove}
        >
          <Text style={styles.controlText}>Continuar borrador</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { color: c.muted, fontSize: 12, lineHeight: 18 },
  caption: { color: c.muted, fontSize: 11, lineHeight: 16 },
  flex: { flex: 1 },
  locationButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { color: c.text, fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  footerScroll: { maxHeight: "40%", flexGrow: 0 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, gap: 3 },
  emptyTitle: { color: c.text, fontSize: 13, fontWeight: "700" },
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  draftTitle: { color: c.draft, fontSize: 12, fontWeight: "700" },
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
