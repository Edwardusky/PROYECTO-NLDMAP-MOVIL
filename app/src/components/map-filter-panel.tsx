import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CASE_STATUSES, type CaseStatus } from '@/constants/map';

export type FilterPanel = 'cases' | 'events' | 'relief';
type Props = {
  panel: FilterPanel | null;
  onClose: () => void;
  caseStatuses: CaseStatus[];
  onToggleCase: (status: CaseStatus) => void;
  showSightings: boolean;
  onToggleSightings: () => void;
};

export function MapFilterPanel({ panel, onClose, caseStatuses, onToggleCase, showSightings, onToggleSightings }: Props) {
  const title = panel === 'cases' ? 'Estados de caso' : panel === 'events' ? 'Capa de eventos' : 'Relieve';
  return (
    <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
          accessibilityLabel="Cerrar panel de filtros" onPress={onClose} />
        <SafeAreaView style={styles.panel} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
              <Text style={styles.label}>Cerrar ×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {panel === 'cases' && <>
              <Text style={styles.body}>Filtra los casos ficticios de esta demostración por su estado.</Text>
              {CASE_STATUSES.map((status) => (
                <Pressable key={status} accessibilityRole="checkbox" accessibilityState={{ checked: caseStatuses.includes(status) }}
                  onPress={() => onToggleCase(status)} style={styles.option}>
                  <Text style={styles.label}>{status}</Text>
                  <Text accessible={false} style={styles.label}>{caseStatuses.includes(status) ? '☑' : '☐'}</Text>
                </Pressable>
              ))}
            </>}
            {panel === 'events' && <>
              <Text style={styles.body}>Los avistamientos son eventos independientes del estado de un caso.</Text>
              <View style={styles.option}>
                <Text style={[styles.label, styles.flex]}>Avistamientos</Text>
                <Switch accessibilityLabel="Mostrar capa de avistamientos" value={showSightings}
                  onValueChange={onToggleSightings} trackColor={{ true: '#173D3A' }} />
              </View>
            </>}
            {panel === 'relief' && <>
              <View style={styles.option}>
                <Text style={[styles.label, styles.flex]}>Sombreado del terreno</Text>
                <Switch accessibilityLabel="Relieve pendiente de configurar" disabled value={false} />
              </View>
              <Text style={styles.body}>Disponible al configurar una fuente de elevación con condiciones de uso adecuadas para esta app. Por ahora está desactivado.</Text>
              <Text style={styles.body}>El mapa de demostración solo contiene límites de países. Acercarlo no añade límites estatales o municipales.</Text>
            </>}
            {panel !== 'relief' && <View style={styles.notice}>
              <Text style={styles.label}>Modo demostración</Text>
              <Text style={styles.body}>Solo hay casos ficticios locales. No hay avistamientos de ejemplo ni reportes conectados a la API. Tu selección se conserva en memoria.</Text>
            </View>}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', alignItems: 'flex-end' },
  panel: { height: '100%', width: '86%', maxWidth: 380, backgroundColor: '#F7F9F6' },
  heading: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#173D3A' },
  close: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-end', paddingHorizontal: 12 },
  content: { padding: 16, gap: 16 },
  body: { fontSize: 14, lineHeight: 22, color: '#52675E' },
  label: { fontSize: 15, fontWeight: '600', color: '#173D3A' },
  option: { minHeight: 56, padding: 12, gap: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderRadius: 12, backgroundColor: '#E8EEE7' },
  flex: { flex: 1 },
  notice: { borderTopWidth: 1, borderColor: '#D8E1D9', paddingTop: 16, gap: 8 },
});
