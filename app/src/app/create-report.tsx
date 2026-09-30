import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateReportScreen() {
  const params = useLocalSearchParams<{ longitude?: string; latitude?: string }>();
  const longitude = typeof params.longitude === 'string' && params.longitude.trim() !== '' ? Number(params.longitude) : NaN;
  const latitude = typeof params.latitude === 'string' && params.latitude.trim() !== '' ? Number(params.latitude) : NaN;
  const valid = Number.isFinite(longitude) && Math.abs(longitude) <= 180 && Number.isFinite(latitude) && Math.abs(latitude) <= 90;
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Crear reporte · Preparación</Text>
        <Text style={styles.body}>No se ha creado, enviado ni guardado un reporte.</Text>
        {valid ? <Text selectable style={styles.body}>Ubicación seleccionada manualmente:{'\n'}Latitud: {latitude.toFixed(6)}{'\n'}Longitud: {longitude.toFixed(6)}</Text>
          : <Text accessibilityRole="alert" style={styles.body}>Falta una ubicación válida. Vuelve al mapa para seleccionarla.</Text>}
        <Text style={styles.body}>Será necesario iniciar sesión para enviar un reporte. La autenticación y el envío aún no están disponibles.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={styles.button}>
          <Text style={styles.buttonText}>Volver al mapa</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  content: { padding: 20, gap: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#173D3A' },
  body: { fontSize: 15, lineHeight: 24, color: '#52675E' },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: '#173D3A', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
