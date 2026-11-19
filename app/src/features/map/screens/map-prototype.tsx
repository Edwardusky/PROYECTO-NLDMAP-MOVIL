import { AccountDrawer } from "@/features/profile/components/account-drawer";
import { useMapSelection } from "../hooks/use-map-selection";
import { MapFooter } from "../components/map-footer";
import { MapReportPopup } from "../components/map-report-popup";
import { MapToolbar } from "../components/map-toolbar";
import { MapCaseLayers } from "../components/map-case-layers";
import { MapBottomSheet } from "../components/map-bottom-sheet";
import {
  getMapSheetSnapPoints,
  type MapSheetIndex,
} from "../utils/map-sheet-layout";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
} from "@maplibre/maplibre-react-native";
import { useMemo, useState } from "react";
import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useReportDraft } from "@/features/reports/state/report-draft-context";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapReportList } from "../components/map-report-list";
import { MapFilterPanel, type FilterPanel } from "../components/map-filter-panel";
import { filterCases } from "@/features/map/utils/map-cases";
import { DEMO_CASES } from "@/features/reports/fixtures/demo-cases";
import {
  INITIAL_VIEW,
  MAP_STYLE,
  MAP_STYLE_DARK,
} from "@/features/map/constants/map";
import { CASE_STATUSES, type CaseStatus } from "@/features/reports/model/case-status";

export default function MapPrototype() {
  // Tema centralizado de NLDMAP.
  const {
    colors: c,
    isDark,
  } = useAppTheme();

  // Estilos que se actualizan al cambiar de tema.
  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  const { discardDraft } = useReportDraft();

  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([
    ...CASE_STATUSES,
  ]);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetIndex, setSheetIndex] =
    useState<MapSheetIndex>(0);
  const visibleCases = filterCases(DEMO_CASES, caseStatuses);
  const {
    mapRef, cameraRef, viewport, resizeViewport,
    mapReady, mapFailed, moving, confirming, selectionError,
    selecting, reportStarted, selectedCases, selectedCoordinate, point, setSelection,
    deviceLocation, startSelection, confirmLocation, cancelSelection, leaveSelection,
    onRegionWillChange, onRegionDidChange, onDidFailLoadingMap, onDidFinishLoadingMap,
  } = useMapSelection(visibleCases);
  const northTop = Math.min(80, viewport.height * 0.15);
  const [compactHeight] = getMapSheetSnapPoints(
    viewport.height
  );
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


  function confirmDiscardDraft() {
    Alert.alert(
      "Descartar borrador",
      "¿Quieres descartar este borrador? " +
      "Se perderán los datos capturados, " +
      "la fotografía asociada y la ubicación " +
      "seleccionada. Esta acción no se puede deshacer.",
      [
        {
          text: "Conservar borrador",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            // Invalida la selección pendiente del mapa.
            leaveSelection();

            // Restablece el formulario y su estado.
            discardDraft();
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  }


  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: c.surfaceAlt },
      ]}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.header}>

        <View style={styles.topRow}>
          {/* Menú y logotipo */}
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir menú de navegación"
              accessibilityState={{ expanded: drawerOpen }}
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="menu-outline"
                size={28}
                color={c.text}
                accessible={false}
              />
            </Pressable>

            {/* Logotipo NLDMAP */}
            <View
              style={styles.brand}
              accessible
              accessibilityLabel="NLDMAP"
            >
              <View style={styles.brandBox}>
                <Text style={styles.brandLetter}>N</Text>
              </View>

              <Text style={styles.title}>LDMAP</Text>
            </View>
          </View>

        </View>

        <Text style={[styles.body, { color: c.muted }]}>Aplicación móvil para gestión de reportes de personas no localizadas y desaparecidas
        </Text>
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
          mapStyle={isDark ? MAP_STYLE_DARK : MAP_STYLE}
          attribution
          attributionPosition={{
            top: 12,
            left: 12,
          }}
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

          {/* Ubicación personal obtenida del GPS */}
          {deviceLocation.coordinate && (
            <GeoJSONSource
              id="device-location"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: deviceLocation.coordinate,
                },
              }}
            >
              {/* Halo azul alrededor de la ubicación */}
              <Layer
                id="device-location-halo"
                type="circle"
                paint={{
                  "circle-radius": 28,
                  "circle-color": c.userLocation,
                  "circle-opacity": 0.18,
                }}
              />

              {/* Punto central azul con contorno blanco */}
              <Layer
                id="device-location-point"
                type="circle"
                paint={{
                  "circle-radius": 10,
                  "circle-color": c.userLocation,
                  "circle-stroke-width": 3,
                  "circle-stroke-color": "#FFFFFF",
                }}
              />
            </GeoJSONSource>
          )}

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
          !listOpen &&
          sheetIndex === 0 &&
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
        {!selecting && sheetIndex === 0 && (
          <MapToolbar
            height={viewport.height}
            panel={panel}
            caseCount={caseStatuses.length}
            listOpen={listOpen}
            bottomOffset={compactHeight + 12}
            onOpen={(nextPanel) => {
              setListOpen(false);
              setPanel(nextPanel);
            }}
            onOpenList={() => {
              setPanel(null);
              setListOpen(true);
            }}
          />
        )}

        <MapBottomSheet
          viewportHeight={viewport.height}
          visibleCount={visibleCases.length}
          selecting={selecting}
          reportStarted={reportStarted}
          confirming={confirming}
          canConfirmLocation={
            mapReady &&
            viewport.width > 0 &&
            viewport.height > 0 &&
            !moving &&
            !confirming &&
            !deviceLocation.loading
          }
          onStartReport={startSelection}
          onContinueReport={() => {
            router.navigate("/create-report");
          }}
          onConfirmLocation={confirmLocation}
          onCancelSelection={cancelSelection}
          onIndexChange={setSheetIndex}
        >
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
            onContinue={() => {
              router.navigate("/create-report");
            }}
            onDiscard={confirmDiscardDraft}
          />
        </MapBottomSheet>

      </View>

      <MapFilterPanel
        panel={panel}
        onClose={() => setPanel(null)}
        caseStatuses={caseStatuses}
        onToggleCase={toggleCaseStatus}
      />
      <MapReportList
        visible={listOpen}
        cases={visibleCases}
        onClose={() => setListOpen(false)}
        onOpenReport={(id) => {
          setListOpen(false);

          router.push({
            pathname: "/case-detail",
            params: { id },
          });
        }}
      />

      <AccountDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(route) => {
          setDrawerOpen(false);
          leaveSelection();
          router.push(route);
        }}
      />

    </SafeAreaView>
  );
}


function createStyles(c: Palette) {
  return StyleSheet.create({
    // Contenedor principal
    screen: {
      flex: 1,
      backgroundColor: c.surface,
    },

    // Encabezado
    header: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 2,
    },

    // Distribución horizontal del encabezado
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },

    // Grupo izquierdo: menú hamburguesa + logotipo
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },

    // Botón de menú hamburguesa
    menuButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
    },

    // Logotipo completo NLDMAP
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },

    // Recuadro redondeado de la N
    brandBox: {
      width: 36,
      height: 36,
      borderWidth: 2,
      borderColor: c.text,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    // Letra N
    brandLetter: {
      color: c.text,
      fontSize: 22,
      fontWeight: "800",
    },

    // Texto LDMAP
    title: {
      color: c.text,
      fontSize: 21,
      fontWeight: "800",
      flexShrink: 1,
    },


    // Textos secundarios del encabezado
    body: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
    },

    caption: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 16,
    },

    // Contenedor del mapa
    viewport: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: c.mapPlaceholder,
    },

    // Indicador central al elegir ubicación de un reporte
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

    targetDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.draft,
    },

    // Retroalimentación visual al presionar botones
    pressed: {
      opacity: 0.7,
    },
  });
}

