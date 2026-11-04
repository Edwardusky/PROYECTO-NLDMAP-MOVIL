import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CASE_STATUSES, type CaseStatus } from '@/constants/map';
import { palette as c } from '@/constants/palette';
import { CloseButton } from './close-button';

export type FilterPanel = 'cases' | 'events' | 'relief';
type Props = {
  panel: FilterPanel | null; onClose: () => void; caseStatuses: CaseStatus[];
  onToggleCase: (status: CaseStatus) => void; showSightings: boolean; onToggleSightings: () => void;
};
const trackColor = { false: c.muted, true: c.action };

export function MapFilterPanel({ panel, onClose, caseStatuses, onToggleCase, showSightings, onToggleSightings }: Props) {
  const title = panel === 'cases' ? 'Casos' : panel === 'events' ? 'Eventos' : 'Capas';
  return <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
    {/* Measure the Modal window itself. No inherited screen insets or fixed bar heights. */}
    <SafeAreaProvider style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cerrar panel de filtros" onPress={onClose} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']} pointerEvents="box-none">
        <View style={styles.panel} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <CloseButton label={`Cerrar panel de ${title.toLowerCase()}`} onPress={onClose} />
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {panel === 'cases' && <>
              <Text style={styles.body}>Elige los estados que quieres mostrar.</Text>
              {CASE_STATUSES.map(status => {
                const checked = caseStatuses.includes(status);
                return <Pressable key={status} accessibilityRole="checkbox" accessibilityLabel={status} accessibilityState={{ checked }}
                  onPress={() => onToggleCase(status)} style={({ pressed }) => [styles.option, checked && styles.selected, pressed && styles.pressed]}>
                  <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={26} color={c.text} accessible={false} />
                  <View style={styles.flex}>
                    <Text style={styles.label}>{status}</Text>
                    <Text style={styles.body}>{checked ? 'Seleccionado' : 'Sin seleccionar'}</Text>
                  </View>
                  <Ionicons name={status === 'Localizados' ? 'checkmark-circle-outline' : 'search-outline'} size={24} color={status === 'Localizados' ? c.located : c.searching} accessible={false} />
                </Pressable>;
              })}
              {!caseStatuses.length && <Text accessibilityLiveRegion="polite" style={styles.body}>Sin estados seleccionados. No se muestran casos en el mapa.</Text>}
            </>}
            {panel === 'events' && <>
              <Text style={styles.body}>Los avistamientos son eventos independientes del estado de un caso.</Text>
              <View style={styles.option}>
                <Ionicons name="radio-outline" size={24} color={c.sighting} accessible={false} />
                <Text style={[styles.label, styles.flex]}>Avistamientos</Text>
                <Switch accessibilityLabel="Mostrar avistamientos" value={showSightings} onValueChange={onToggleSightings}
                  trackColor={trackColor} thumbColor={c.paper} ios_backgroundColor={c.muted} />
              </View>
            </>}
            {panel === 'relief' && <>
              <View style={styles.option}>
                <Text style={[styles.label, styles.flex]}>Relieve</Text>
                <Switch accessibilityLabel="Relieve no disponible" accessibilityState={{ disabled: true, checked: false }} disabled value={false}
                  trackColor={trackColor} thumbColor={c.paper} ios_backgroundColor={c.muted} />
              </View>
              <Text style={styles.body}>No disponible por ahora.</Text>
            </>}
            <View style={styles.notice}><Text style={styles.body}>Demostración · Casos ficticios. Sin avistamientos de ejemplo.</Text></View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.overlay },
  safeArea: { flex: 1, alignItems: 'flex-end' },
  panel: { flex: 1, minHeight: 0, width: '86%', maxWidth: 380, backgroundColor: c.surface },
  heading: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: c.divider },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: c.text },
  scroll: { flex: 1, minHeight: 0 }, content: { padding: 16, gap: 16 },
  body: { fontSize: 14, lineHeight: 22, color: c.muted }, label: { fontSize: 15, fontWeight: '600', color: c.text },
  option: { minHeight: 56, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
  selected: { borderColor: c.action, borderWidth: 2 }, flex: { flex: 1 }, pressed: { opacity: 0.7 },
  notice: { borderTopWidth: 1, borderColor: c.divider, paddingTop: 16 },
});
