import { Camera, GeoJSONSource, Layer, Map, type LngLat } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapFilterPanel, type FilterPanel } from './map-filter-panel';
import { CASE_STATUSES, INITIAL_VIEW, MAP_STYLE, type CaseStatus } from '@/constants/map';

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([...CASE_STATUSES]);
  const [showSightings, setShowSightings] = useState(true);
  const [panel, setPanel] = useState<FilterPanel | null>(null);
  const [draftCoordinate, setDraftCoordinate] = useState<LngLat | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  function toggleCaseStatus(status: CaseStatus) {
    setCaseStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status) : [...current, status]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>NLDMAP</Text>
        <Text style={styles.body}>Tlaxcala · Encuadre inicial provisional</Text>
        <Text style={styles.caption}>No es tu ubicación</Text>
      </View>
      <View style={styles.viewport}>
        <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE} attribution
          onDidFailLoadingMap={() => setMapFailed(true)}
          onDidFinishLoadingMap={() => setMapFailed(false)}
          onPress={(event) => setDraftCoordinate(event.nativeEvent.lngLat)}>
          <Camera initialViewState={INITIAL_VIEW} />
          {/* Only existing country geometry. This source has no state boundaries. */}
          <Layer id="country-outline-contrast" type="line" source="maplibre"
            source-layer="countries" beforeId="countries-label"
            paint={{ 'line-color': '#52675E', 'line-opacity': 0.65,
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.5, 16, 2] }} />
          {draftCoordinate && (
            <GeoJSONSource id="temporary-draft" data={{ type: 'Feature', properties: {},
              geometry: { type: 'Point', coordinates: draftCoordinate } }}>
              {/* Rendered inside the map framebuffer, not as an unclipped native Marker view. */}
              <Layer id="draft-halo" type="circle" paint={{ 'circle-radius': 13,
                'circle-color': '#FFFFFF', 'circle-opacity': 0.85 }} />
              <Layer id="draft-point" type="circle" paint={{ 'circle-radius': 8,
                'circle-color': '#875619', 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' }} />
            </GeoJSONSource>
          )}
        </Map>
        <ScrollView style={styles.rail} contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
          {([
            ['cases', { ios: 'line.3.horizontal.decrease', android: 'filter_list' }, 'Casos', `${caseStatuses.length}/2`],
            ['events', { ios: 'eye', android: 'visibility' }, 'Eventos', showSightings ? 'Activa' : 'Oculta'],
            ['relief', { ios: 'mountain.2', android: 'terrain' }, 'Relieve', 'Pendiente'],
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
        <Text style={styles.emptyTitle}>Sin reportes cargados</Text>
        <Text style={styles.body}>Casos y avistamientos aparecerán al conectar la API.</Text>
        {mapFailed && <Text accessibilityRole="alert" style={styles.body}>No se pudo cargar el mapa. Revisa la conexión y vuelve a abrir esta pantalla.</Text>}
        {draftCoordinate ? (
          <View style={styles.draftRow}>
            <View style={styles.draftText}>
              <Text style={styles.draftTitle}>● Borrador temporal · No es un reporte</Text>
              <Text style={styles.body}>Sin guardar ni enviar. Toca otro punto para moverlo.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Quitar pin de borrador temporal"
              onPress={() => setDraftCoordinate(null)} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
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
  title: { color: '#173D3A', fontSize: 21, fontWeight: '800' },
  body: { color: '#52675E', fontSize: 12, lineHeight: 18 },
  caption: { color: '#52675E', fontSize: 11, lineHeight: 16 },
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: '#DDE9E5' },
  rail: { position: 'absolute', top: 12, right: 12, bottom: 48, maxWidth: '42%' },
  controls: { gap: 8 },
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
