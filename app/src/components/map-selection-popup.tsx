import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  point: [number, number];
  viewport: { width: number; height: number };
  title: string;
  children: ReactNode;
  onClose: () => void;
};

// Rightmost 112px belong to the controls; bottom 48px to map attribution.
// This is a sibling of Map inside its clipped viewport, never a native Marker child.
export function MapSelectionPopup({ point, viewport, title, children, onClose }: Props) {
  const [height, setHeight] = useState(200);
  const width = Math.min(260, viewport.width - 128);
  const maxHeight = viewport.height - 64;
  if (width < 100 || maxHeight < 80 || point[0] < 0 || point[1] < 0 ||
    point[0] > viewport.width || point[1] > viewport.height) return null;
  const left = Math.max(8, Math.min(point[0] - width / 2, viewport.width - 120 - width));
  const top = Math.max(8, Math.min(point[1] - height - 18, viewport.height - 56 - height));
  const anchorX = Math.max(left, Math.min(point[0], left + width));
  const anchorY = Math.max(top, Math.min(point[1], top + height));
  const dx = point[0] - anchorX;
  const dy = point[1] - anchorY;
  const length = Math.hypot(dx, dy);

  return <>
    <View pointerEvents="none" style={[styles.connector, {
      left: (anchorX + point[0]) / 2 - length / 2, top: (anchorY + point[1]) / 2,
      width: length, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
    }]} />
    <View style={[styles.popup, { left, top, width, maxHeight }]}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar ventana del marcador"
          onPress={onClose} style={styles.close}><Text style={styles.label}>Cerrar <Ionicons name="close-outline" size={13} color="#173D3A" accessible={false} accessibilityElementsHidden importantForAccessibility="no" /></Text></Pressable>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </View>
  </>;
}

const styles = StyleSheet.create({
  connector: { position: 'absolute', height: 2, backgroundColor: '#173D3A' },
  popup: { position: 'absolute', borderRadius: 14, borderWidth: 1, borderColor: '#52675E',
    backgroundColor: '#F7F9F6', overflow: 'hidden' },
  content: { padding: 10, gap: 8 },
  close: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center', alignSelf: 'flex-end' },
  label: { color: '#173D3A', fontSize: 13, fontWeight: '600' },
  title: { color: '#173D3A', fontSize: 15, fontWeight: '700' },
});
