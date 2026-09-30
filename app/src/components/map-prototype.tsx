import { Camera, GeoJSONSource, Layer, Map, type LngLat, type MapRef, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapFilterPanel, type FilterPanel } from './map-filter-panel';
import { MapSelectionPopup } from './map-selection-popup';
import { DEMO_CASES } from '@/data/demo-cases';
import { CASE_STATUSES, INITIAL_VIEW, MAP_STYLE, type CaseStatus } from '@/constants/map';

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([...CASE_STATUSES]);
  const [showSightings, setShowSightings] = useState(true);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const [draftCoordinate, setDraftCoordinate] = useState<LngLat | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [projection, setProjection] = useState<{ coordinate: LngLat; point: [number, number] } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [northHeight, setNorthHeight] = useState(60);
  const [mapReady, setMapReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [moving, setMoving] = useState(false);
  const selectedCase = DEMO_CASES.find((item) => item.id === selection && caseStatuses.includes(item.status));
  const selectedCoordinate = selection === 'draft' ? draftCoordinate : selectedCase?.coordinates;
  const point = projection && projection.coordinate === selectedCoordinate ? projection.point : null;
  const northTop = Math.min(80, viewport.height * 0.15);
  const visibleCases = DEMO_CASES.filter((item) => caseStatuses.includes(item.status));

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
    if (selectedCase?.status === status && caseStatuses.includes(status)) setSelection(null);
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
              onPress={() => router.push('/login')} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
              <SymbolView name={{ ios: 'person.crop.circle', android: 'person' }} size={22} tintColor="#173D3A" />
              <Text style={styles.controlText}>Perfil</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.body}>Tlaxcala · Encuadre inicial provisional</Text>
        <Text style={styles.caption}>DEMOSTRACIÓN · Casos ficticios · No es tu ubicación</Text>
      </View>
      <View style={styles.viewport} onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport({ width, height });
      }}>
        <Map ref={mapRef} style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE} attribution compass={false}
          onRegionWillChange={() => setMoving(true)}
          onRegionDidChange={() => { setMoving(false); setCameraRevision((value) => value + 1); }}
          onDidFailLoadingMap={() => { setMapFailed(true); setMapReady(false); }}
          onDidFinishLoadingMap={() => { setMapFailed(false); setMapReady(true); }}
          onPress={(event) => {
            if (panel !== null || ('features' in event.nativeEvent && event.nativeEvent.features.length > 0)) return;
            setDraftCoordinate(event.nativeEvent.lngLat);
            setSelection('draft');
          }}>
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW} />
          {/* Only existing country geometry. This source has no state boundaries. */}
          <Layer id="country-outline-contrast" type="line" source="maplibre"
            source-layer="countries" beforeId="countries-label"
            paint={{ 'line-color': '#52675E', 'line-opacity': 0.65,
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.5, 16, 2] }} />
          <GeoJSONSource id="demo-cases" data={{ type: 'FeatureCollection', features: visibleCases.map((item) => ({
            type: 'Feature', id: item.id, properties: { id: item.id, status: item.status },
            geometry: { type: 'Point', coordinates: item.coordinates },
          })) }} onPress={(event) => {
            event.stopPropagation();
            const id = event.nativeEvent.features[0]?.properties?.id;
            if (typeof id === 'string') setSelection(id);
          }}>
            <Layer id="demo-points" type="circle" paint={{ 'circle-radius': 9,
              'circle-color': ['match', ['get', 'status'], 'Localizados', '#246D59', '#654DA4'],
              'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} />
          </GeoJSONSource>
          {draftCoordinate && (
            <GeoJSONSource id="temporary-draft" onPress={(event) => {
              event.stopPropagation(); setSelection('draft');
            }} data={{ type: 'Feature', properties: {},
              geometry: { type: 'Point', coordinates: draftCoordinate } }}>
              {/* Rendered inside the map framebuffer, not as an unclipped native Marker view. */}
              <Layer id="draft-halo" type="circle" paint={{ 'circle-radius': 13,
                'circle-color': '#FFFFFF', 'circle-opacity': 0.85 }} />
              <Layer id="draft-point" type="circle" paint={{ 'circle-radius': 8,
                'circle-color': '#875619', 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' }} />
            </GeoJSONSource>
          )}
        </Map>
        {point && selectedCoordinate && panel === null && !moving && (
          <MapSelectionPopup key={selection} point={point} viewport={viewport}
            title={selectedCase?.name ?? 'Ubicación seleccionada'} onClose={() => setSelection(null)}
            action={selectedCase ? 'Ver detalle' : 'Crear reporte'}
            onAction={() => {
              if (selectedCase) router.push({ pathname: '/case-detail', params: { id: selectedCase.id } });
              else if (draftCoordinate) router.push({ pathname: '/create-report', params: {
                longitude: String(draftCoordinate[0]), latitude: String(draftCoordinate[1]),
              } });
            }}>
            <Text style={styles.body}>{selectedCase
              ? `DEMOSTRACIÓN · ${selectedCase.age} años\n${selectedCase.status}\n${selectedCase.municipality}`
              : 'Borrador temporal. No enviado ni guardado.'}</Text>
          </MapSelectionPopup>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Norte. Restablecer orientación sin mover ni cambiar el zoom"
          disabled={!mapReady} accessibilityState={{ disabled: !mapReady }}
          onLayout={(event) => setNorthHeight(event.nativeEvent.layout.height)}
          onPress={() => cameraRef.current?.setStop({ bearing: 0, duration: 250, easing: 'ease' })}
          style={[styles.north, { top: northTop }, !mapReady && styles.pressed]}>
          <SymbolView name={{ ios: 'location.north', android: 'north' }} size={22} tintColor="#173D3A" />
          <Text style={styles.controlText}>Norte</Text>
        </Pressable>
        <ScrollView style={[styles.rail, { top: Math.max(viewport.height * 0.45, northTop + northHeight + 24) }]}
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
        {draftCoordinate ? (
          <View style={styles.draftRow}>
            <View style={styles.draftText}>
              <Text style={styles.draftTitle}>● Borrador temporal · No es un reporte</Text>
              <Text style={styles.body}>Sin guardar ni enviar. Toca otro punto para moverlo.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Quitar pin de borrador temporal"
              onPress={() => { setDraftCoordinate(null); if (selection === 'draft') setSelection(null); }} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
              <Text style={styles.controlText}>Quitar</Text>
            </Pressable>
          </View>
        ) : <Text style={styles.caption}>Toca el mapa para crear un pin temporal. No se guarda ni se envía.</Text>}
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
  north: { position: 'absolute', right: 12, width: 88, minHeight: 48, padding: 6,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F7F9F6' },
  rail: { position: 'absolute', right: 12, bottom: 48, width: 88 },
  controls: { gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  control: { minWidth: 76, minHeight: 64, padding: 8, borderRadius: 16, alignItems: 'center',
    backgroundColor: '#F7F9F6', borderWidth: 1, borderColor: '#D8E1D9' },
  controlText: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, gap: 3 },
  emptyTitle: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  draftText: { flex: 1, gap: 2 },
  draftTitle: { color: '#875619', fontSize: 12, fontWeight: '700' },
  remove: { minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center',
    padding: 10, backgroundColor: '#E8EEE7', borderRadius: 12 },
});
