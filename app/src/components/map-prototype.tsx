import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';

type CaseStatus = 'En seguimiento' | 'Resuelto';
type Filter = 'Todos' | CaseStatus;
type DemoCase = {
  id: string;
  area: string;
  status: CaseStatus;
  summary: string;
  // Percentages in the illustration, not geographic coordinates.
  x: number;
  y: number;
};

const DEMO_CASES: DemoCase[] = [
  { id: '01', area: 'Sector norte', status: 'En seguimiento', summary: 'Punto ficticio para explorar la selección de casos en el mapa.', x: 30, y: 27 },
  { id: '02', area: 'Sector centro', status: 'En seguimiento', summary: 'Registro de ejemplo con información pendiente de revisión.', x: 53, y: 49 },
  { id: '03', area: 'Sector poniente', status: 'Resuelto', summary: 'Registro ficticio que muestra cómo se presenta un caso resuelto.', x: 20, y: 67 },
  { id: '04', area: 'Sector sur', status: 'Resuelto', summary: 'Otro punto de ejemplo para comparar los estados del mapa.', x: 70, y: 76 },
];
const FILTERS: Filter[] = ['Todos', 'En seguimiento', 'Resuelto'];
const INK = '#173D3A';
const GREEN = '#176B58';

export default function MapPrototype() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const [selectedId, setSelectedId] = useState('02');
  const visibleCases = DEMO_CASES.filter((item) => filter === 'Todos' || item.status === filter);
  const selected = visibleCases.find((item) => item.id === selectedId) ?? visibleCases[0];

  function changeFilter(next: Filter) {
    setFilter(next);
    const nextCases = DEMO_CASES.filter((item) => next === 'Todos' || item.status === next);
    if (!nextCases.some((item) => item.id === selectedId)) {
      setSelectedId(nextCases[0]?.id ?? '');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>NLDMAP<Text style={styles.brandDot}>•</Text></Text>
            <Text style={styles.eyebrow}>EXPLORA TU ENTORNO</Text>
          </View>
          <View style={styles.demoBadge}><Text style={styles.demoText}>DEMO</Text></View>
        </View>

        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Mapa de casos</Text>
          <Text style={styles.subtitle}>Una mirada al territorio y sus casos.</Text>
        </View>

        <View style={styles.filters} accessibilityLabel="Filtrar casos por estado">
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              onPress={() => changeFilter(item)}
              style={({ pressed }) => [styles.filter, filter === item && styles.filterActive, pressed && styles.pressed]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.map}>
          <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
            <View style={styles.park} />
            <View style={styles.parkSmall} />
            {[18, 39, 60, 81].map((top) => <View key={top} style={[styles.streetHorizontal, { top: `${top}%` }]} />)}
            {[16, 37, 58, 79].map((left) => <View key={left} style={[styles.streetVertical, { left: `${left}%` }]} />)}
            <View style={styles.avenue} />
            <View style={styles.river} />
            <Text style={[styles.mapLabel, { top: '12%', left: '24%' }]}>SECTOR NORTE</Text>
            <Text style={[styles.mapLabel, { top: '57%', left: '34%' }]}>CENTRO</Text>
            <Text style={[styles.mapLabel, { top: '85%', left: '12%' }]}>SECTOR SUR</Text>
          </View>

          <View style={styles.mapCaption}><Text style={styles.mapCaptionText}>Mapa ilustrativo · sin geolocalización</Text></View>
          {visibleCases.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Caso ${item.id}, ${item.area}, ${item.status}`}
              accessibilityHint="Muestra la ficha de este caso debajo del mapa"
              accessibilityState={{ selected: selected?.id === item.id }}
              onPress={() => setSelectedId(item.id)}
              style={({ pressed }) => [styles.marker, { left: `${item.x}%`, top: `${item.y}%` }, item.status === 'Resuelto' && styles.markerResolved, selected?.id === item.id && styles.markerSelected, pressed && styles.pressed]}>
              <Text style={styles.markerText}>{item.id}</Text>
            </Pressable>
          ))}
          <View style={styles.mapFooter}><Text style={styles.mapFooterText}>Toca un punto para conocer el caso</Text></View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: GREEN }]} /><Text style={styles.legendText}>En seguimiento</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#64748B' }]} /><Text style={styles.legendText}>Resuelto</Text></View>
        </View>

        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>En este mapa</Text>
          <Text accessibilityLiveRegion="polite" style={styles.count}>{visibleCases.length} casos ficticios</Text>
        </View>

        {selected ? (
          <View style={styles.card} accessibilityLiveRegion="polite">
            <View style={styles.cardTop}>
              <Text style={styles.caseId}>CASO {selected.id}</Text>
              <Text style={[styles.status, selected.status === 'Resuelto' && styles.statusResolved]}>{selected.status}</Text>
            </View>
            <Text style={styles.caseTitle}>Caso de demostración {selected.id}</Text>
            <Text style={styles.area}>{selected.area} · Ubicación de ejemplo</Text>
            <Text style={styles.summary}>{selected.summary}</Text>
            <View style={styles.cardBottom}><View style={styles.selectedDot} /><Text style={styles.selectedLabel}>Seleccionado en el mapa</Text></View>
          </View>
        ) : <Text style={styles.subtitle}>No hay casos para este filtro.</Text>}

        <Text style={styles.disclaimer}>Prototipo visual. Todos los casos y las ubicaciones son ficticios.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 100 : 16, paddingBottom: BottomTabInset + 28, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  brand: { fontSize: 25, fontWeight: '900', letterSpacing: -1, color: INK },
  brandDot: { color: GREEN },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#576E65', marginTop: 3 },
  demoBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#E8EEE7' },
  demoText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#46634D' },
  heading: { gap: 6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -1, color: INK },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#5C7069' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#D8E1D9', backgroundColor: '#FFFFFF' },
  filterActive: { backgroundColor: INK, borderColor: INK },
  filterText: { color: '#52675E', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
  map: { height: 330, overflow: 'hidden', backgroundColor: '#E6ECE1', borderRadius: 24, borderWidth: 1, borderColor: '#D9E2D6' },
  park: { position: 'absolute', width: '33%', height: '37%', left: '2%', top: '5%', borderRadius: 36, backgroundColor: '#CEDDC1', transform: [{ rotate: '-12deg' }] },
  parkSmall: { position: 'absolute', width: '27%', height: '24%', left: '53%', top: '64%', borderRadius: 25, backgroundColor: '#CEDDC1' },
  streetHorizontal: { position: 'absolute', height: 10, width: '100%', backgroundColor: '#F8FAF4', borderWidth: 1, borderColor: '#DDE4D8', transform: [{ rotate: '-9deg' }] },
  streetVertical: { position: 'absolute', width: 9, height: '100%', backgroundColor: '#F8FAF4', borderWidth: 1, borderColor: '#DDE4D8', transform: [{ rotate: '12deg' }] },
  avenue: { position: 'absolute', width: 19, height: '150%', left: '46%', top: '-25%', backgroundColor: '#FFFCED', borderWidth: 2, borderColor: '#E4DCC2', transform: [{ rotate: '48deg' }] },
  river: { position: 'absolute', width: 70, height: '150%', right: -38, top: '-20%', backgroundColor: '#BAD9DD', borderWidth: 7, borderColor: '#CBE3E0', transform: [{ rotate: '17deg' }] },
  mapLabel: { position: 'absolute', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#61745D' },
  mapCaption: { alignSelf: 'flex-start', margin: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FFFFFF' },
  mapCaptionText: { fontSize: 10, color: '#53685E' },
  marker: { position: 'absolute', marginLeft: -23, marginTop: -23, width: 46, height: 46, borderRadius: 23, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  markerResolved: { backgroundColor: '#64748B' },
  markerSelected: { borderWidth: 4, borderColor: '#F4C56B', transform: [{ scale: 1.12 }] },
  markerText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  mapFooter: { position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  mapFooterText: { fontSize: 10, fontWeight: '600', color: '#53685E' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: -8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#5C7069' },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: INK },
  count: { fontSize: 12, color: '#5C7069' },
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#DCE5DC', gap: 10, marginTop: -8 },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  caseId: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#5C7069' },
  status: { backgroundColor: '#E8F3EC', color: '#176B58', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, fontSize: 10, fontWeight: '700' },
  statusResolved: { backgroundColor: '#EEF1F5', color: '#526178' },
  caseTitle: { fontSize: 18, fontWeight: '700', color: INK },
  area: { fontSize: 12, color: '#5C7069' },
  summary: { fontSize: 13, lineHeight: 20, color: '#5C7069' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 12, marginTop: 2, borderTopWidth: 1, borderTopColor: '#EDF1EC' },
  selectedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C28E2C' },
  selectedLabel: { fontSize: 11, color: '#637365' },
  disclaimer: { fontSize: 11, lineHeight: 17, textAlign: 'center', color: '#637365', paddingHorizontal: 12 },
});
