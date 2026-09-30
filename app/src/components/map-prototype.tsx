import { Camera, Map, Marker, type LngLat } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Camera only, not a report coordinate. MapLibre uses [longitude, latitude].
const INITIAL_VIEW = { center: [-102.58, 23.94] as LngLat, zoom: 5 };
// Public basemap for development. No NLDMAP reports are loaded from this service.
const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const CASE_STATUSES = ['En búsqueda', 'Localizados'] as const;
type CaseStatus = (typeof CASE_STATUSES)[number];

export default function MapPrototype() {
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([...CASE_STATUSES]);
  // Sightings are an independent event layer, not a case status.
  const [showSightings, setShowSightings] = useState(true);
  const [draftCoordinate, setDraftCoordinate] = useState<LngLat | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  function toggleCaseStatus(status: CaseStatus) {
    setCaseStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status)
      : [...current, status]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Mapa NLDMAP</Text>
        <Text style={styles.subtitle}>México · Vista inicial provisional</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={styles.groupLabel}>ESTADOS DE CASO</Text>
            <View style={styles.row}>
              {CASE_STATUSES.map((status) => {
                const active = caseStatuses.includes(status);
                return (
                  <Pressable
                    key={status}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Estado de caso: ${status}`}
                    accessibilityState={{ checked: active }}
                    onPress={() => toggleCaseStatus(status)}
                    style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {active ? '✓ ' : ''}{status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.layerGroup}>
            <Text style={styles.groupLabel}>CAPA DE EVENTOS</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Capa de avistamientos"
              accessibilityState={{ checked: showSightings }}
              onPress={() => setShowSightings((current) => !current)}
              style={({ pressed }) => [styles.chip, showSightings && styles.chipActive, pressed && styles.pressed]}>
              <Text style={[styles.chipText, showSightings && styles.chipTextActive]}>
                {showSightings ? '✓ ' : ''}Avistamientos
              </Text>
            </Pressable>
          </View>
        </ScrollView>
        {/* The report source is empty; these filters hold UI preferences only. */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin reportes cargados</Text>
          <Text style={styles.body}>Los casos y avistamientos aparecerán al conectar la API.</Text>
        </View>
        {mapFailed && <Text accessibilityRole="alert" style={styles.body}>No se pudo cargar el mapa base. Revisa tu conexión y vuelve a abrir la pantalla.</Text>}
      </View>

      <Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        attribution
        onDidFailLoadingMap={() => setMapFailed(true)}
        onDidFinishLoadingMap={() => setMapFailed(false)}
        onPress={(event) => setDraftCoordinate(event.nativeEvent.lngLat)}>
        <Camera initialViewState={INITIAL_VIEW} />
        {draftCoordinate && (
          <Marker id="temporary-draft" lngLat={draftCoordinate} anchor="bottom" onPress={(event) => event.stopPropagation()}>
            <View collapsable={false} accessible accessibilityLabel="Pin de borrador temporal, no enviado ni guardado" style={styles.marker}>
              <Text style={styles.markerLabel}>Borrador</Text>
              <View style={styles.markerPoint} />
            </View>
          </Marker>
        )}
      </Map>

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        {draftCoordinate ? (
          <View style={styles.draftPanel} accessibilityLiveRegion="polite">
            <Text style={styles.draftTitle}>Pin de borrador temporal</Text>
            <Text style={styles.body}>No enviado ni guardado. No es un reporte.</Text>
            <Text style={styles.body}>Toca otro lugar del mapa para moverlo.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar pin de borrador temporal"
              onPress={() => setDraftCoordinate(null)}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
              <Text style={styles.removeText}>Quitar borrador</Text>
            </Pressable>
          </View>
        ) : <Text style={styles.body}>Toca el mapa para colocar un pin temporal de borrador. No se guardará ni enviará.</Text>}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  header: { padding: 16, gap: 8 },
  title: { color: '#173D3A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#5C7069', fontSize: 12, lineHeight: 18 },
  filters: { gap: 16, paddingVertical: 4 },
  filterGroup: { gap: 6 },
  layerGroup: { gap: 6, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: '#D8E1D9' },
  groupLabel: { color: '#5C7069', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#D8E1D9', backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#173D3A', borderColor: '#173D3A' },
  chipText: { color: '#52675E', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
  emptyState: { backgroundColor: '#E8EEE7', borderRadius: 12, padding: 10, gap: 2 },
  emptyTitle: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
  body: { color: '#52675E', fontSize: 12, lineHeight: 18 },
  map: { flex: 1 },
  marker: { alignItems: 'center' },
  markerLabel: { backgroundColor: '#875619', color: '#FFFFFF', fontSize: 12, fontWeight: '700', padding: 7, borderRadius: 8 },
  markerPoint: { width: 12, height: 12, backgroundColor: '#875619', borderColor: '#FFFFFF', borderWidth: 2, borderRadius: 6 },
  footer: { backgroundColor: '#F7F9F6', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  draftPanel: { gap: 6 },
  draftTitle: { color: '#875619', fontSize: 14, fontWeight: '700' },
  removeButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D8E1D9', borderRadius: 12, backgroundColor: '#FFFFFF', padding: 10 },
  removeText: { color: '#173D3A', fontSize: 13, fontWeight: '700' },
});
