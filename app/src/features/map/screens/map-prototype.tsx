import { useMapSelection } from "../hooks/use-map-selection";
import { MapFooter } from "../components/map-footer";
import { MapReportPopup } from "../components/map-report-popup";
import { MapToolbar } from "../components/map-toolbar";
import { MapCaseLayers } from "../components/map-case-layers";
import { palette as c } from "@/shared/constants/palette";
import { Camera, Map } from "@maplibre/maplibre-react-native";
import { useState } from "react";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MapFilterPanel, type FilterPanel } from "../components/map-filter-panel";
import { filterCases } from "@/features/map/utils/map-cases";
import { DEMO_CASES } from "@/features/reports/fixtures/demo-cases";
import { INITIAL_VIEW, MAP_STYLE } from "@/features/map/constants/map";
import { CASE_STATUSES, type CaseStatus } from "@/features/reports/model/case-status";

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([
    ...CASE_STATUSES,
  ]);
  const [showSightings, setShowSightings] = useState(true);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const visibleCases = filterCases(DEMO_CASES, caseStatuses);
  const {
    mapRef, cameraRef, viewport, resizeViewport,
    mapReady, mapFailed, moving, confirming, selectionError,
    selecting, reportStarted, selectedCases, selectedCoordinate, point, setSelection,
    deviceLocation, startSelection, confirmLocation, cancelSelection, leaveSelection,
    onRegionWillChange, onRegionDidChange, onDidFailLoadingMap, onDidFinishLoadingMap,
  } = useMapSelection(visibleCases);
  const northTop = Math.min(80, viewport.height * 0.15);

  function toggleCaseStatus(status: CaseStatus) {
    const remaining = caseStatuses.includes(status)
      ? caseStatuses.filter((value) => value !== status)
      : [...caseStatuses, status];
    if (!selectedCases.some((item) => remaining.includes(item.status)))
      setSelection(null);
    setCaseStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text accessibilityRole="header" style={styles.title}>
            NLDMAP
          </Text>
          <View style={styles.topActions}>
            {/* No authentication provider exists yet: always open the signed-out screen. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Perfil. Abrir Iniciar sesión"
              onPress={() => {
                leaveSelection();
                router.push("/login");
              }}
              style={({ pressed }) => [
                styles.topButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={c.text}
                style={{ width: 22, height: 22 }}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </Pressable>
          </View>
        </View>
        <Text style={styles.body}>Mapa de reportes</Text>
        <Text style={styles.caption}>DEMOSTRACIÓN · Casos ficticios</Text>
      </View>
      <View
        style={styles.viewport}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          resizeViewport(width, height);
        }}
      >
        <Map
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE}
          attribution
          compass
          compassPosition={{ top: northTop, right: 24 }}
          onRegionWillChange={onRegionWillChange}
          onRegionDidChange={onRegionDidChange}
          onDidFailLoadingMap={onDidFailLoadingMap}
          onDidFinishLoadingMap={onDidFinishLoadingMap}
          onPress={() => {
            if (!selecting && panel === null) setSelection(null);
          }}
        >
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW} />
          {/* Only existing country geometry. This source has no state boundaries. */}

          <MapCaseLayers
            visibleCases={visibleCases}
            selecting={selecting}
            onSelect={setSelection}
          />
        </Map>
        {selecting && (
          <View
            pointerEvents="none"
            style={[
              styles.target,
              { left: viewport.width / 2 - 18, top: viewport.height / 2 - 18 },
            ]}
            accessible
            accessibilityLabel="Indicador central de ubicación elegida manualmente"
          >
            <View style={styles.targetDot} />
          </View>
        )}
        {point &&
          selectedCoordinate &&
          panel === null &&
          !moving &&
          !selecting && (
            <MapReportPopup
              point={point}
              viewport={viewport}
              selectedCases={selectedCases}
              onClose={() => setSelection(null)}
              onOpenReport={(id) => router.push({ pathname: "/case-detail", params: { id } })}
            />
          )}
        <MapToolbar
          height={viewport.height}
          northTop={northTop}
          panel={panel}
          caseCount={caseStatuses.length}
          showSightings={showSightings}
          onOpen={setPanel}
        />
      </View>
      <MapFooter
        deviceLocation={deviceLocation}
        mapReady={mapReady}
        confirming={confirming}
        moving={moving}
        mapFailed={mapFailed}
        selecting={selecting}
        selectionError={selectionError}
        hasCaseStatuses={caseStatuses.length > 0}
        visibleCount={visibleCases.length}
        reportStarted={reportStarted}
        onConfirm={confirmLocation}
        onCancel={cancelSelection}
        onStart={startSelection}
        onContinue={() => router.navigate("/create-report")}
      />
      <MapFilterPanel
        panel={panel}
        onClose={() => setPanel(null)}
        caseStatuses={caseStatuses}
        onToggleCase={toggleCaseStatus}
        showSightings={showSightings}
        onToggleSightings={() => setShowSightings((value) => !value)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingVertical: 8, gap: 2 },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  topActions: { flexDirection: "row", gap: 8 },
  topButton: {
    minWidth: 56,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    gap: 2,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
  },
  title: { color: c.text, fontSize: 21, fontWeight: "800", flexShrink: 1 },
  body: { color: c.muted, fontSize: 12, lineHeight: 18 },
  caption: { color: c.muted, fontSize: 11, lineHeight: 16 },
  viewport: { flex: 1, overflow: "hidden", backgroundColor: c.mapPlaceholder },
  // Separate clear zones for the compass (top) and attribution (bottom).
  target: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: c.draft,
    backgroundColor: "#FFFFFF99",
    alignItems: "center",
    justifyContent: "center",
  },
  targetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.draft },
  pressed: { opacity: 0.7 },
});
