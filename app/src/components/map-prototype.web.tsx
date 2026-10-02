import { StyleSheet, Text, View } from 'react-native';

// Keep this fallback independent of the native map and its re-exports.
// Metro resolves map-prototype.tsx on Android/iOS and this file on web.
export default function MapPrototype() {
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>NLDMAP</Text>
      <Text style={styles.body}>El mapa está disponible en la app para Android e iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6', padding: 24, gap: 12 },
  title: { color: '#173D3A', fontSize: 24, fontWeight: '800' },
  body: { color: '#52675E', fontSize: 15, lineHeight: 24 },
});
