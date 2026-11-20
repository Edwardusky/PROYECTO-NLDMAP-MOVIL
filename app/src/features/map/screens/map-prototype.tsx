
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  router,
  useFocusEffect,
} from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
} from "@maplibre/maplibre-react-native";

import type { Palette } from "@/shared/constants/palette";

import {
  useAppTheme,
} from "@/shared/theme/app-theme-context";

import {
  useAuthSession,
} from "@/features/auth/state/auth-session-context";

import {
  AuthEntrySheet,
} from "@/features/auth/components/auth-entry-sheet";

import {
  useReportDraft,
} from "@/features/reports/state/report-draft-context";

import {
  DEMO_CASES,
} from "@/features/reports/fixtures/demo-cases";

import {
  CASE_STATUSES,
  type CaseStatus,
} from "@/features/reports/model/case-status";

import {
  AccountDrawer,
} from "@/features/profile/components/account-drawer";

import {
  useMapSelection,
} from "../hooks/use-map-selection";

import { MapFooter } from "../components/map-footer";
import { MapReportPopup } from "../components/map-report-popup";
import { MapToolbar } from "../components/map-toolbar";
import { MapCaseLayers } from "../components/map-case-layers";
import { MapBottomSheet } from "../components/map-bottom-sheet";
import { MapReportList } from "../components/map-report-list";

import {
  MapFilterPanel,
  type FilterPanel,
} from "../components/map-filter-panel";

import {
  filterCases,
} from "@/features/map/utils/map-cases";

import {
  getMapSheetSnapPoints,
  type MapSheetIndex,
} from "../utils/map-sheet-layout";

import {
  INITIAL_VIEW,
  MAP_STYLE,
  MAP_STYLE_DARK,
} from "@/features/map/constants/map";

type AuthPurpose = "report" | "profile";

export default function MapPrototype() {
  const { colors: c, isDark } = useAppTheme();

  const { user, logout } = useAuthSession();

  const { width } = useWindowDimensions();

  const { discardDraft } = useReportDraft();

  const styles = useMemo(
    () => createStyles(c),
    [c],
  );

  // Estados del mapa
  const [caseStatuses, setCaseStatuses] =
    useState<CaseStatus[]>([
      ...CASE_STATUSES,
    ]);

  const [panel, setPanel] =
    useState<FilterPanel | null>(null);

  const [listOpen, setListOpen] = useState(false);

  // Estado del menú lateral Push
  const [drawerOpen, setDrawerOpen] =
    useState(false);

  // Estado del panel de autenticación
  const [authSheetOpen, setAuthSheetOpen] =
    useState(false);

  const [authPurpose, setAuthPurpose] =
    useState<AuthPurpose>("report");

  const [sheetIndex, setSheetIndex] =
    useState<MapSheetIndex>(0);

  /**
   * Animación Push.
   *
   * 0 = Menú cerrado.
   * 1 = Menú abierto.
   *
   * Una sola animación controla
   * el menú y el contenido principal.
   */
  const pushProgress = useRef(
    new Animated.Value(0),
  ).current;

  // Acción que debe ejecutarse al cerrar el menú.
  const pendingDrawerAction = useRef<
    (() => void) | null
  >(null);

  /**
   * Solicita cerrar el menú.
   * Opcionalmente ejecuta una acción
   * cuando termina la animación.
   */
  const closeDrawer = useCallback(
    (afterClose?: () => void) => {
      pendingDrawerAction.current =
        afterClose ?? null;

      setDrawerOpen(false);
    },
    [],
  );

  /**
   * Ejecuta la animación Push.
   *
   * El menú se mueve hacia dentro
   * mientras el mapa se desplaza
   * hacia la derecha.
   */
  useEffect(() => {
    const animation = Animated.timing(
      pushProgress,
      {
        toValue: drawerOpen ? 1 : 0,

        duration: drawerOpen ? 280 : 250,

        easing: Easing.out(Easing.cubic),

        useNativeDriver: true,
      },
    );

    animation.start(({ finished }) => {
      if (!finished || drawerOpen) {
        return;
      }

      const action = pendingDrawerAction.current;

      pendingDrawerAction.current = null;

      action?.();
    });

    return () => animation.stop();
  }, [drawerOpen, pushProgress]);

  /**
   * Cerrar el menú utilizando
   * el botón Atrás de Android.
   */
  useFocusEffect(
    useCallback(() => {
      if (!drawerOpen) return;

      const listener = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          closeDrawer();
          return true;
        },
      );

      return () => listener.remove();
    }, [drawerOpen, closeDrawer]),
  );

  /**
   * Desplazamiento del menú.
   *
   * Cerrado: fuera de la pantalla,
   * hacia la izquierda.
   *
   * Abierto: ocupa toda la pantalla.
   */
  const drawerTranslateX = pushProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  /**
   * Desplazamiento del mapa.
   *
   * Cerrado: posición original.
   *
   * Abierto: desplazado hacia la derecha.
   */
  const contentTranslateX = pushProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  function openDrawer() {
    pendingDrawerAction.current = null;
    setDrawerOpen(true);
  }

  // Reportes visibles
  const visibleCases = filterCases(
    DEMO_CASES,
    caseStatuses,
  );

  // Selección de ubicación y controles del mapa
  const {
    mapRef,
    cameraRef,
    viewport,
    resizeViewport,
    mapReady,
    mapFailed,
    moving,
    confirming,
    selectionError,
    selecting,
    reportStarted,
    selectedCases,
    selectedCoordinate,
    point,
    setSelection,
    deviceLocation,
    startSelection,
    confirmLocation,
    cancelSelection,
    leaveSelection,
    onRegionWillChange,
    onRegionDidChange,
    onDidFailLoadingMap,
    onDidFinishLoadingMap,
  } = useMapSelection(visibleCases);

  const northTop = Math.min(
    80,
    viewport.height * 0.15,
  );

  const [compactHeight] =
    getMapSheetSnapPoints(viewport.height);

  /**
   * Activar o desactivar los filtros
   * correspondientes a los reportes.
   */
  function toggleCaseStatus(status: CaseStatus) {
    const remaining = caseStatuses.includes(status)
      ? caseStatuses.filter(
          (value) => value !== status,
        )
      : [...caseStatuses, status];

    if (
      !selectedCases.some(
        (item) => remaining.includes(item.status),
      )
    ) {
      setSelection(null);
    }

    setCaseStatuses((current) =>
      current.includes(status)
        ? current.filter(
            (item) => item !== status,
          )
        : [...current, status],
    );
  }

  /**
   * Confirmar el descarte del borrador
   * temporal del reporte.
   */
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
            leaveSelection();
            discardDraft();
          },
        },
      ],
      {
        cancelable: true,
      },
    );
  }

  /**
   * Abrir panel inferior de autenticación.
   */
  function openAuthSheet(purpose: AuthPurpose) {
    setAuthPurpose(purpose);
    setAuthSheetOpen(true);
  }

  /**
   * Solo los usuarios autenticados
   * pueden comenzar un reporte.
   */
  function handleStartReport() {
    if (!user) {
      openAuthSheet("report");
      return;
    }

    startSelection();
  }

  /**
   * Continuar un reporte en proceso.
   */
  function handleContinueReport() {
    if (!user) {
      openAuthSheet("report");
      return;
    }

    router.navigate("/create-report");
  }

  /**
   * Navegación desde el panel
   * inferior de autenticación.
   */
  function openAuthRoute(
    route: "/login" | "/register",
  ) {
    setAuthSheetOpen(false);

    if (authPurpose === "report") {
      router.push({
        pathname: route,
        params: {
          next: "report",
        },
      });
    } else {
      router.push(route);
    }
  }

  return (
    <View style={styles.pushRoot}>
      {/* MENÚ LATERAL PUSH */}
      <Animated.View
        style={[
          styles.drawerLayer,
          {
            transform: [
              { translateX: drawerTranslateX },
            ],
          },
        ]}
      >
        <AccountDrawer
          visible={drawerOpen}
          onClose={() => closeDrawer()}
          onNavigate={(route) =>
            closeDrawer(() => {
              leaveSelection();
              router.push(route);
            })
          }
          onRequestAuth={() =>
            closeDrawer(() =>
              openAuthSheet("profile"),
            )
          }
          onLogout={() =>
            closeDrawer(() => {
              leaveSelection();
              logout();
            })
          }
        />
      </Animated.View>

      {/* PANTALLA PRINCIPAL DESPLAZABLE */}
      <Animated.View
        pointerEvents={
          drawerOpen ? "none" : "auto"
        }
        importantForAccessibility={
          drawerOpen
            ? "no-hide-descendants"
            : "auto"
        }
        style={[
          styles.mainLayer,
          {
            transform: [
              { translateX: contentTranslateX },
            ],
          },
        ]}
      >
        <SafeAreaView
          style={[
            styles.screen,
            {
              backgroundColor: c.surfaceAlt,
            },
          ]}
          edges={[
            "top",
            "bottom",
            "left",
            "right",
          ]}
        >
          {/* ENCABEZADO */}
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.headerLeft}>
                {/* Abrir menú */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir menú de navegación"
                  accessibilityState={{
                    expanded: drawerOpen,
                  }}
                  onPress={openDrawer}
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
                    <Text style={styles.brandLetter}>
                      N
                    </Text>
                  </View>

                  <Text style={styles.title}>
                    LDMAP
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.body}>
              Aplicación móvil para gestión
              de reportes de personas no
              localizadas y desaparecidas
            </Text>
          </View>

          {/* MAPA */}
          <View
            style={styles.viewport}
            onLayout={(event) => {
              const { width, height } =
                event.nativeEvent.layout;

              resizeViewport(width, height);
            }}
          >
            <Map
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              mapStyle={
                isDark
                  ? MAP_STYLE_DARK
                  : MAP_STYLE
              }
              attribution
              attributionPosition={{
                top: 12,
                left: 12,
              }}
              compass
              compassPosition={{
                top: northTop,
                right: 24,
              }}
              onRegionWillChange={
                onRegionWillChange
              }
              onRegionDidChange={
                onRegionDidChange
              }
              onDidFailLoadingMap={
                onDidFailLoadingMap
              }
              onDidFinishLoadingMap={
                onDidFinishLoadingMap
              }
              onPress={() => {
                if (
                  !selecting &&
                  panel === null
                ) {
                  setSelection(null);
                }
              }}
            >
              <Camera
                ref={cameraRef}
                initialViewState={INITIAL_VIEW}
              />

              {/* Reportes sobre el mapa */}
              <MapCaseLayers
                visibleCases={visibleCases}
                selecting={selecting}
                onSelect={setSelection}
              />

              {/* Ubicación del dispositivo */}
              {deviceLocation.coordinate && (
                <GeoJSONSource
                  id="device-location"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "Point",
                      coordinates:
                        deviceLocation.coordinate,
                    },
                  }}
                >
                  {/* Halo de ubicación */}
                  <Layer
                    id="device-location-halo"
                    type="circle"
                    paint={{
                      "circle-radius": 28,
                      "circle-color":
                        c.userLocation,
                      "circle-opacity": 0.18,
                    }}
                  />

                  {/* Punto de ubicación */}
                  <Layer
                    id="device-location-point"
                    type="circle"
                    paint={{
                      "circle-radius": 10,
                      "circle-color":
                        c.userLocation,
                      "circle-stroke-width": 3,
                      "circle-stroke-color":
                        "#FFFFFF",
                    }}
                  />
                </GeoJSONSource>
              )}
            </Map>

            {/* PUNTO CENTRAL DE SELECCIÓN */}
            {selecting && (
              <View
                pointerEvents="none"
                style={[
                  styles.target,
                  {
                    left:
                      viewport.width / 2 - 18,
                    top:
                      viewport.height / 2 - 18,
                  },
                ]}
                accessible
                accessibilityLabel="Indicador central de ubicación elegida manualmente"
              >
                <View
                  style={styles.targetDot}
                />
              </View>
            )}

            {/* INFORMACIÓN DE REPORTES */}
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
                  onClose={() =>
                    setSelection(null)
                  }
                  onOpenReport={(id) =>
                    router.push({
                      pathname:
                        "/case-detail",
                      params: { id },
                    })
                  }
                />
              )}

            {/* BARRA DE HERRAMIENTAS */}
            {!selecting &&
              sheetIndex === 0 && (
                <MapToolbar
                  height={viewport.height}
                  panel={panel}
                  caseCount={
                    caseStatuses.length
                  }
                  listOpen={listOpen}
                  bottomOffset={
                    compactHeight + 12
                  }
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

            {/* PANEL INFERIOR DEL MAPA */}
            <MapBottomSheet
              viewportHeight={
                viewport.height
              }
              visibleCount={
                visibleCases.length
              }
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
              onStartReport={
                handleStartReport
              }
              onContinueReport={
                handleContinueReport
              }
              onConfirmLocation={
                confirmLocation
              }
              onCancelSelection={
                cancelSelection
              }
              onIndexChange={
                setSheetIndex
              }
            >
              <MapFooter
                deviceLocation={
                  deviceLocation
                }
                mapReady={mapReady}
                confirming={confirming}
                moving={moving}
                mapFailed={mapFailed}
                selecting={selecting}
                selectionError={
                  selectionError
                }
                hasCaseStatuses={
                  caseStatuses.length > 0
                }
                visibleCount={
                  visibleCases.length
                }
                reportStarted={
                  reportStarted
                }
                onConfirm={
                  confirmLocation
                }
                onCancel={
                  cancelSelection
                }
                onStart={
                  handleStartReport
                }
                onContinue={
                  handleContinueReport
                }
                onDiscard={
                  confirmDiscardDraft
                }
              />
            </MapBottomSheet>
          </View>

          {/* FILTROS */}
          <MapFilterPanel
            panel={panel}
            onClose={() =>
              setPanel(null)
            }
            caseStatuses={
              caseStatuses
            }
            onToggleCase={
              toggleCaseStatus
            }
          />

          {/* LISTA DE REPORTES */}
          <MapReportList
            visible={listOpen}
            cases={visibleCases}
            onClose={() =>
              setListOpen(false)
            }
            onOpenReport={(id) => {
              setListOpen(false);

              router.push({
                pathname: "/case-detail",
                params: { id },
              });
            }}
          />
        </SafeAreaView>
      </Animated.View>

      {/* PANEL INFERIOR DE AUTENTICACIÓN */}
      <AuthEntrySheet
        visible={authSheetOpen}
        purpose={authPurpose}
        onClose={() =>
          setAuthSheetOpen(false)
        }
        onLogin={() =>
          openAuthRoute("/login")
        }
        onRegister={() =>
          openAuthRoute("/register")
        }
      />
    </View>
  );
}

/**
 * Estilos del mapa y del contenedor Push.
 */
function createStyles(c: Palette) {
  return StyleSheet.create({
    // Contenedor general
    pushRoot: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: c.surface,
    },

    // Menú situado detrás de la pantalla principal
    drawerLayer: {
      ...StyleSheet.absoluteFill,
      backgroundColor: c.surface,
    },

    // Contenedor que se desplaza hacia la derecha
    mainLayer: {
      flex: 1,
      backgroundColor: c.surface,
    },

    // Pantalla principal
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

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },

    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },

    // Botón del menú
    menuButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
    },

    // Logotipo
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },

    brandBox: {
      width: 36,
      height: 36,
      borderWidth: 2,
      borderColor: c.text,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    brandLetter: {
      color: c.text,
      fontSize: 22,
      fontWeight: "800",
    },

    title: {
      color: c.text,
      fontSize: 21,
      fontWeight: "800",
      flexShrink: 1,
    },

    body: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
    },

    // Contenedor del mapa
    viewport: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: c.mapPlaceholder,
    },

    // Indicador de ubicación del reporte
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

    // Retroalimentación al presionar botones
    pressed: {
      opacity: 0.7,
    },
  });
}
