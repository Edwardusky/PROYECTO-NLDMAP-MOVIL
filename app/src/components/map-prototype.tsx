import { Camera, GeoJSONSource, Layer, Map, type LngLat, type MapRef } from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapFilterPanel, type FilterPanel } from './map-filter-panel';
import { MapSelectionPopup } from './map-selection-popup';
import { DEMO_CASES } from '@/data/demo-cases';
import { CASE_STATUSES, INITIAL_VIEW, MAP_STYLE, type CaseStatus } from '@/constants/map';

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([...CASE_STATUSES]);
  const [showSightings, setShowSightings] = useState(true);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const [selecting, setSelecting] = useState(false);
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
  const visibleCases = DEMO_CASES.filter((item) => caseStatuses.includes(item.status));
  // Exact equality only: nearby points are not clustered or displaced.
  const selectedCases = visibleCases.filter((item) => selection &&
    item.coordinates[0] === selection[0] && item.coordinates[1] === selection[1]);
  const selectedCoordinate = selectedCases.length ? selection : null;
  const point = projection && projection.coordinate === selectedCoordinate ? projection.point : null;
  const northTop = Math.min(80, viewport.height * 0.15);

  function cancelSelection() {
    operation.current += 1;
    busy.current = null;
    setSelecting(false);
    setConfirming(false);
    setSelectionError(null);
    setSelection(null);
  }

  useEffect(() => {
    if (!selecting) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelSelection();
      return true;
    });
    return () => subscription.remove();
  }, [selecting]);

  useEffect(() => () => { operation.current += 1; busy.current = null; }, []);

  async function confirmLocation() {
    if (!selecting || busy.current !== null || moving || !mapReady || !mapRef.current || !viewport.width || !viewport.height) return;
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
      cancelSelection();
      router.push({ pathname: '/create-report', params: {
        longitude: String(longitude), latitude: String(coordinate[1]),
      } });
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
              onPress={() => { cancelSelection(); router.push('/login'); }} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
              <SymbolView name={{ ios: 'person.crop.circle', android: 'person' }} size={22} tintColor="#173D3A" />
              <Text style={styles.controlText}>Perfil</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.body}>Tlaxcala  Encuadre inicial</Text>
        <Text style={styles.caption}>DEMOSTRACIÓN · Casos ficticios · No es tu ubicación</Text>
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
          <Camera initialViewState={INITIAL_VIEW} />
          {/* Only existing country geometry. This source has no state boundaries. */}
          <Layer id="country-outline-contrast" type="line" source="maplibre"
            source-layer="countries" beforeId="countries-label"
            paint={{ 'line-color': '#52675E', 'line-opacity': 0.65,
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.5, 16, 2] }} />
          <GeoJSONSource id="demo-cases" data={{ type: 'FeatureCollection', features: visibleCases.map((item) => ({
            type: 'Feature', id: item.id, properties: { id: item.id, status: item.status },
            geometry: { type: 'Point', coordinates: item.coordinates },
          })) }} onPress={selecting ? undefined : (event) => {
            event.stopPropagation();
            const id = event.nativeEvent.features[0]?.properties?.id;
            const item = visibleCases.find((entry) => entry.id === id);
            if (item) setSelection(item.coordinates);
          }}>
            <Layer id="demo-points" type="circle" paint={{ 'circle-radius': 9,
              'circle-color': ['match', ['get', 'status'], 'Localizados', '#246D59', '#654DA4'],
              'circle-opacity': selecting ? 0.35 : 1, 'circle-stroke-opacity': selecting ? 0.35 : 1,
              'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} />
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
                <Text style={styles.body}>{item.age} años · {item.status}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={'Ver detalle de ' + item.name}
                  onPress={() => router.push({ pathname: '/case-detail', params: { id: item.id } })} style={styles.remove}>
                  <Text style={styles.controlText}>Ver detalle</Text>
                </Pressable>
              </View>
            ))}
          </MapSelectionPopup>
        )}
        <ScrollView style={[styles.rail, { top: Math.max(viewport.height * 0.45, northTop + 72) }]}
          contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
          {([
            ['relief', { ios: 'square.3.layers.3d', android: 'layers' }, 'Capas', 'Pendiente'],
            ['cases', { ios: 'line.3.horizontal.decrease', android: 'filter_list' }, 'Casos', `${caseStatuses.length}/2`],
            ['events', { ios: 'eye', android: 'visibility' }, 'Eventos', showSightings ? 'Activa' : 'Oculta'],
          ] as const).map(([id, icon, label, value]) => (
            <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. Abrir opciones`}
              onPress={() => setPanel(id)} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
              <SymbolView name={icon} size={22} tintColor="#173D3A" />
              <Text style={styles.controlText}>{label}</Text>
              <Text style={styles.caption}>{value}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={styles.footer} accessibilityLiveRegion="polite">
        <Text style={styles.emptyTitle}>Demostración · {visibleCases.length} casos ficticios visibles</Text>
        <Text style={styles.body}>Sin reportes reales ni avistamientos. API sin conectar.</Text>
        {mapFailed && <Text accessibilityRole="alert" style={styles.body}>No se pudo cargar el mapa. Revisa la conexión y vuelve a abrir esta pantalla.</Text>}
        <Text style={styles.draftTitle}>{selecting ? 'Seleccionar ubicación' : 'Consultar mapa'}</Text>
        {selectionError && <Text accessibilityRole="alert" style={styles.body}>{selectionError}</Text>}
        {selecting ? <>
          <Text style={styles.body}>Mueve y amplía el mapa bajo el indicador. Ubicación manual, no GPS.</Text>
          <View style={styles.draftRow}>
            <Pressable accessibilityRole="button" disabled={moving || confirming || !mapReady}
              accessibilityState={{ disabled: moving || confirming || !mapReady, busy: confirming }}
              onPress={confirmLocation} style={[styles.remove, styles.flex, (moving || confirming || !mapReady) && styles.pressed]}>
              <Text style={styles.controlText}>Confirmar ubicación</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={cancelSelection} style={styles.remove}>
              <Text style={styles.controlText}>Cancelar</Text>
            </Pressable>
          </View>
        </> : (
          <Pressable accessibilityRole="button" onPress={() => {
            operation.current += 1;
            setSelection(null); setSelectionError(null); setSelecting(true);
          }} style={styles.remove}>
            <Text style={styles.controlText}>Crear reporte</Text>
          </Pressable>
        )}
      </View>
      <MapFilterPanel panel={panel} onClose={() => setPanel(null)} caseStatuses={caseStatuses}
        onToggleCase={toggleCaseStatus} showSightings={showSightings}
        onToggleSightings={() => setShowSightings((value) => !value)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  header: { paddingHorizontal: 16, paddingVertical: 8, gap: 2 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topActions: { flexDirection: 'row', gap: 8 },
  topButton: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 2,
    borderRadius: 12, backgroundColor: '#E8EEE7' },
  title: { color: '#173D3A', fontSize: 21, fontWeight: '800', flexShrink: 1 },
  body: { color: '#52675E', fontSize: 12, lineHeight: 18 },
  caption: { color: '#52675E', fontSize: 11, lineHeight: 16 },
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: '#DDE9E5' },
  // Separate clear zones for the compass (top) and attribution (bottom).
  target: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 3,
    borderColor: '#875619', backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  targetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#875619' },
  caseRow: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderColor: '#D8E1D9' },
  flex: { flex: 1 },
  rail: { position: 'absolute', right: 12, bottom: 48, width: 88 },
  controls: { gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  control: { minWidth: 76, minHeight: 64, padding: 8, borderRadius: 16, alignItems: 'center',
    backgroundColor: '#F7F9F6', borderWidth: 1, borderColor: '#D8E1D9' },
  controlText: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, gap: 3 },
  emptyTitle: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  draftTitle: { color: '#875619', fontSize: 12, fontWeight: '700' },
  remove: { minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center',
    padding: 10, backgroundColor: '#E8EEE7', borderRadius: 12 },
});
