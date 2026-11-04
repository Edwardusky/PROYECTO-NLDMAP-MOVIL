import { palette as c } from '@/constants/palette';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef, type LngLat, type MapRef } from '@maplibre/maplibre-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapFilterPanel, type FilterPanel } from './map-filter-panel';
import { MapSelectionPopup } from './map-selection-popup';
import { useLocalDraft } from '@/state/local-draft-context';
import { seedReport } from '@/data/local-draft';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { filterCases, casesAtPoint, pointStatusLabel } from '@/data/map-cases';
import { DEMO_CASES } from '@/data/demo-cases';
import { CASE_STATUSES, INITIAL_VIEW, MAP_STYLE, type CaseStatus } from '@/constants/map';

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([...CASE_STATUSES]);
  const [showSightings, setShowSightings] = useState(true);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const { profile, report, setReport, picking: selecting, setPicking: setSelecting, editingLocation, setEditingLocation } = useLocalDraft();
  const cameraRef = useRef<CameraRef>(null);
  const [confirming, setConfirming] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const operation = useRef(0);
  const busy = useRef<number | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const [selection, setSelection] = useState<LngLat | null>(null);
  const [projection, setProjection] = useState<{ coordinate: LngLat; point: [number, number] } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [moving, setMoving] = useState(false);
  const visibleCases = filterCases(DEMO_CASES, caseStatuses);
  // Exact equality only: nearby points are not clustered or displaced.
  const selectedCases = casesAtPoint(visibleCases, selection);
  const selectedCoordinate = selectedCases.length ? selection : null;
  const point = projection && projection.coordinate === selectedCoordinate ? projection.point : null;
  const northTop = Math.min(80, viewport.height * 0.15);

  const deviceLocation = useDeviceLocation((coordinate, approximate) => {
    if (!mapReady || !cameraRef.current) throw new Error('Map not ready');
    operation.current += 1;
    setSelection(null);
    setMoving(true);
    cameraRef.current.flyTo({ center: coordinate, zoom: approximate ? 11 : 14, duration: 700 });
  });

  function stopSelection() {
    operation.current += 1;
    busy.current = null;
    setSelecting(false);
    setConfirming(false);
    setSelectionError(null);
    setSelection(null);
  }

  function cancelSelection() {
    stopSelection();
    if (editingLocation) {
      setEditingLocation(false);
      router.navigate('/create-report');
    }
  }

  useFocusEffect(useCallback(() => {
    if (editingLocation && selecting && mapReady && report.coordinate) {
      cameraRef.current?.jumpTo({ center: report.coordinate, zoom: 14 });
    }
  }, [editingLocation, selecting, mapReady, report.coordinate]));

  useEffect(() => {
    if (!selecting) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelSelection();
      return true;
    });
    return () => subscription.remove();
  }, [selecting, editingLocation]);

  useEffect(() => () => { operation.current += 1; busy.current = null; }, []);

  async function confirmLocation() {
    if (!selecting || busy.current !== null || deviceLocation.loading || moving || !mapReady || !mapRef.current || !viewport.width || !viewport.height) return;
    setConfirming(true);
    setSelectionError(null);
    const request = ++operation.current;
    busy.current = request;
    try {
      // Pixel center of the measured Map view, accounting for camera padding via unproject.
      const coordinate = await mapRef.current.unproject([viewport.width / 2, viewport.height / 2]);
      if (request !== operation.current) return;
      if (!coordinate.every(Number.isFinite) || Math.abs(coordinate[1]) > 90) throw new Error('Invalid coordinate');
      // Wrap longitude when the user has panned across a repeated world.
      const longitude = ((coordinate[0] + 180) % 360 + 360) % 360 - 180;
      setReport(current => ({ ...seedReport(current, profile), coordinate: [longitude, coordinate[1]] }));
      stopSelection();
      setEditingLocation(false);
      router.navigate('/create-report');
    } catch {
      if (request === operation.current) setSelectionError('No se pudo obtener la ubicación. Inténtalo de nuevo.');
    } finally {
      if (busy.current === request) {
        busy.current = null;
        setConfirming(false);
      }
    }
  }

  // Projection responses can arrive after another selection or camera gesture.
  // Cleanup prevents such stale responses from placing a window at the wrong point.
  useEffect(() => {
    let cancelled = false;
    setProjection(null);
    if (!moving && selectedCoordinate && viewport.width && viewport.height) {
      mapRef.current?.project(selectedCoordinate).then((nextPoint) => {
        if (!cancelled) setProjection({ coordinate: selectedCoordinate, point: nextPoint });
      }).catch(() => { if (!cancelled) setProjection(null); });
    }
    return () => { cancelled = true; };
  }, [selectedCoordinate, moving, cameraRevision, viewport]);

  function toggleCaseStatus(status: CaseStatus) {
    const remaining = caseStatuses.includes(status) ? caseStatuses.filter((value) => value !== status) : [...caseStatuses, status];
    if (!selectedCases.some((item) => remaining.includes(item.status))) setSelection(null);
    setCaseStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status) : [...current, status]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text accessibilityRole="header" style={styles.title}>NLDMAP</Text>
          <View style={styles.topActions}>
            {/* No authentication provider exists yet: always open the signed-out screen. */}
            <Pressable accessibilityRole="button" accessibilityLabel="Perfil. Abrir Iniciar sesión"
              onPress={() => { stopSelection(); setEditingLocation(false); router.push('/login'); }} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
              <Ionicons name="person-circle-outline" size={22} color={c.text} style={{ width: 22, height: 22 }} accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
            </Pressable>
          </View>
        </View>
        <Text style={styles.body}>Mapa de casos</Text>
        <Text style={styles.caption}>DEMOSTRACIÓN · Casos ficticios</Text>
      </View>
      <View style={styles.viewport} onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        operation.current += 1;
        setViewport({ width, height });
      }}>
        <Map ref={mapRef} style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE} attribution compass
          compassPosition={{ top: northTop, right: 24 }}
          onRegionWillChange={() => { operation.current += 1; setMoving(true); }}
          onRegionDidChange={() => { setMoving(false); setCameraRevision((value) => value + 1); }}
          onDidFailLoadingMap={() => { operation.current += 1; setMapFailed(true); setMapReady(false); }}
          onDidFinishLoadingMap={() => { setMapFailed(false); setMapReady(true); }}
          onPress={() => { if (!selecting && panel === null) setSelection(null); }}>
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW} />
          {/* Only existing country geometry. This source has no state boundaries. */}
          <Layer id="country-outline-contrast" type="line" source="maplibre"
            source-layer="countries" beforeId="countries-label"
            paint={{ 'line-color': c.muted, 'line-opacity': 0.65,
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.5, 16, 2] }} />
          <GeoJSONSource id="demo-cases" data={{ type: 'FeatureCollection', features: visibleCases.map((item) => ({
            type: 'Feature', id: item.id, properties: { id: item.id, status: item.status, label: pointStatusLabel(visibleCases, item.coordinates) },
            geometry: { type: 'Point', coordinates: item.coordinates },
          })) }} onPress={selecting ? undefined : (event) => {
            event.stopPropagation();
            const id = event.nativeEvent.features[0]?.properties?.id;
            const item = visibleCases.find((entry) => entry.id === id);
            if (item) setSelection(item.coordinates);
          }}>
            <Layer id="demo-points" type="circle" paint={{ 'circle-radius': ['match', ['get', 'label'], 'B/L', 13, 9],
              'circle-color': ['match', ['get', 'status'], 'Localizados', c.located, c.searching],
              'circle-opacity': selecting ? 0.35 : 1, 'circle-stroke-opacity': selecting ? 0.35 : 1,
              'circle-stroke-width': 3, 'circle-stroke-color': c.paper }} />
            <Layer id="demo-status-labels" type="symbol" layout={{
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Semibold'], 'text-size': 11,
              'text-allow-overlap': true, 'text-ignore-placement': true,
            }} paint={{ 'text-color': c.paper, 'text-opacity': selecting ? 0.35 : 1 }} />
          </GeoJSONSource>
        </Map>
        {selecting && (
          <View pointerEvents="none" style={[styles.target, { left: viewport.width / 2 - 18, top: viewport.height / 2 - 18 }]}
            accessible accessibilityLabel="Indicador central de ubicación elegida manualmente">
            <View style={styles.targetDot} />
          </View>
        )}
        {point && selectedCoordinate && panel === null && !moving && !selecting && (
          <MapSelectionPopup point={point} viewport={viewport}
            title={selectedCases.length === 1 ? '1 caso en esta ubicación' : selectedCases.length + ' casos en esta ubicación'}
            onClose={() => setSelection(null)}>
            <Text style={styles.caption}>DEMOSTRACIÓN · Coincidir en ubicación no implica relación entre casos.</Text>
            {selectedCases.map((item) => (
              <View key={item.id} style={styles.caseRow}>
                <Text style={styles.controlText}>{item.name}</Text>
                <Text style={styles.body}><Ionicons name={item.status === 'Localizados' ? 'checkmark-circle-outline' : 'search-outline'} size={16} color={c.text} accessible={false} /> {item.age} años · {item.status}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={'Ver detalle del reporte de ' + item.name}
                  onPress={() => router.push({ pathname: '/case-detail', params: { id: item.id } })}
                  style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
                  <Ionicons name="eye-outline" size={24} color={c.text} accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
                </Pressable>
              </View>
            ))}
          </MapSelectionPopup>
        )}
        <ScrollView style={[styles.rail, { top: Math.max(viewport.height * 0.45, northTop + 72) }]}
          contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
          {([
            ['relief', 'layers-outline', 'Capas', 'Relieve no disponible'],
            ['cases', 'filter-outline', 'Casos', `${caseStatuses.length}/2`],
            ['events', 'radio-outline', 'Eventos', showSightings ? 'Activa' : 'Oculta'],
          ] as const).map(([id, icon, label, value]) => (
            <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. Abrir opciones`}
              accessibilityState={{ expanded: panel === id, selected: panel === id }}
              onPress={() => setPanel(id)} style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}>
              <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {[[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].map(([x, y], index) => (
                  <Ionicons key={index} name={icon} size={32} color={c.paper} style={[StyleSheet.absoluteFill, { transform: [{ translateX: x }, { translateY: y }] }]} />
                ))}
                <Ionicons name={icon} size={32} color={panel === id ? c.draft : c.text} />
              </View>
              <Text style={styles.floatingLabel}>{label}</Text>
              {panel === id && <View style={styles.activeDot} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.footerScroll} contentContainerStyle={styles.footer} accessibilityLiveRegion="polite">
        <Pressable accessibilityRole="button" accessibilityLabel="Mi ubicación. Centrar mapa"
          accessibilityState={{ busy: deviceLocation.loading, disabled: deviceLocation.loading || !mapReady || confirming }}
          disabled={deviceLocation.loading || !mapReady || confirming} onPress={deviceLocation.locate}
          style={({ pressed }) => [styles.locationButton, (pressed || deviceLocation.loading || !mapReady) && styles.pressed]}>
          <Ionicons name="locate-outline" size={26} color={c.text} accessible={false} />
          <Text style={styles.controlText}>{deviceLocation.loading ? 'Obteniendo ubicación…' : 'Mi ubicación'}</Text>
        </Pressable>
        {deviceLocation.message && <Text style={styles.body}>{deviceLocation.message}</Text>}
        {deviceLocation.settings && <Pressable accessibilityRole="button" accessibilityLabel="Abrir Ajustes de ubicación" onPress={deviceLocation.openSettings} style={styles.remove}><Text style={styles.controlText}>Abrir Ajustes</Text></Pressable>}
        {caseStatuses.length === 0 && <Text style={styles.body}>No hay estados seleccionados. Abre Casos para mostrar reportes.</Text>}
        <Text style={styles.emptyTitle}>Demostración · {visibleCases.length} casos ficticios visibles</Text>
        <Text style={styles.caption}>B · En búsqueda   L · Localizados   B/L · Ambos</Text>
        {mapFailed && <Text accessibilityRole="alert" style={styles.body}>No se pudo cargar el mapa. Revisa la conexión y vuelve a abrir esta pantalla.</Text>}
        <Text style={styles.draftTitle}>{selecting ? 'Seleccionar ubicación' : 'Consultar mapa'}</Text>
        {selectionError && <Text accessibilityRole="alert" style={styles.body}>{selectionError}</Text>}
        {selecting ? <>
          <Text style={styles.body}>Mueve el mapa bajo el indicador y confirma el punto. Centrar en Mi ubicación no lo confirma.</Text>
          <View style={styles.draftRow}>
            <Pressable accessibilityRole="button" disabled={moving || confirming || deviceLocation.loading || !mapReady}
              accessibilityState={{ disabled: moving || confirming || deviceLocation.loading || !mapReady, busy: confirming }}
              onPress={confirmLocation} style={[styles.remove, styles.flex, (moving || confirming || deviceLocation.loading || !mapReady) && styles.pressed]}>
              <Text style={styles.controlText}>Confirmar ubicación</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={cancelSelection} style={styles.remove}>
              <Text style={styles.controlText}>Cancelar</Text>
            </Pressable>
          </View>
        </> : (
          <Pressable accessibilityRole="button" onPress={() => {
            operation.current += 1;
            setReport(current => seedReport(current, profile));
            setEditingLocation(false);
            setSelection(null); setSelectionError(null); setSelecting(true);
          }} style={styles.remove}>
            <Text style={styles.controlText}>{report.started ? 'Elegir ubicación del borrador' : 'Crear reporte'}</Text>
          </Pressable>
        )}
        {report.started && !selecting && <Pressable accessibilityRole="button" accessibilityLabel="Continuar borrador temporal" onPress={() => router.navigate('/create-report')} style={styles.remove}><Text style={styles.controlText}>Continuar borrador</Text></Pressable>}
      </ScrollView>
      <MapFilterPanel panel={panel} onClose={() => setPanel(null)} caseStatuses={caseStatuses}
        onToggleCase={toggleCaseStatus} showSightings={showSightings}
        onToggleSightings={() => setShowSightings((value) => !value)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingVertical: 8, gap: 2 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topActions: { flexDirection: 'row', gap: 8 },
  topButton: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 2,
    borderRadius: 12, backgroundColor: c.surfaceAlt },
  title: { color: c.text, fontSize: 21, fontWeight: '800', flexShrink: 1 },
  body: { color: c.muted, fontSize: 12, lineHeight: 18 },
  caption: { color: c.muted, fontSize: 11, lineHeight: 16 },
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: c.mapPlaceholder },
  // Separate clear zones for the compass (top) and attribution (bottom).
  target: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 3,
    borderColor: c.draft, backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  targetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.draft },
  caseRow: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderColor: c.divider },
  flex: { flex: 1 },
  rail: { position: 'absolute', right: 12, bottom: 48, width: 88 },
  controls: { gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  control: { minWidth: 76, minHeight: 64, padding: 8, alignItems: 'center', justifyContent: 'center' },
  controlPressed: { transform: [{ scale: 0.9 }], opacity: 0.75 },
  activeDot: { position: 'absolute', bottom: 4, width: 7, height: 7, borderRadius: 4,
    backgroundColor: c.draft, borderWidth: 1, borderColor: c.paper },
  floatingLabel: { color: c.text, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 4, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  locationButton: { minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  controlText: { color: c.text, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  footerScroll: { maxHeight: '40%', flexGrow: 0 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, gap: 3 },
  emptyTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  draftTitle: { color: c.draft, fontSize: 12, fontWeight: '700' },
  remove: { minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center',
    padding: 10, backgroundColor: c.surfaceAlt, borderRadius: 12 },
});
