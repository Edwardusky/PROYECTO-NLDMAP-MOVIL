import { palette as c } from '@/constants/palette';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_CASES } from '@/data/demo-cases';

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = DEMO_CASES.find((entry) => entry.id === id);
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Caso de demostración</Text>
        <Text style={styles.body}>Datos de demostración. No representa a una persona ni un reporte real.</Text>
        {item ? <>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.body}>Identificador: {item.id}{'\n'}Edad ficticia: {item.age} años{'\n'}Estado: {item.status}{'\n'}Municipio: {item.municipality}{'\n'}Fecha ficticia: {item.date}</Text>
          <Text selectable style={styles.body}>Latitud: {item.coordinates[1]}{'\n'}Longitud: {item.coordinates[0]}</Text>
        </> : <Text accessibilityRole="alert" style={styles.body}>No se encontró este caso de demostración.</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={styles.button}>
          <Text style={styles.buttonText}>Volver al mapa</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  content: { padding: 20, gap: 20 },
  title: { fontSize: 24, fontWeight: '800', color: c.text },
  body: { fontSize: 15, lineHeight: 24, color: c.muted },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: c.text, alignItems: 'center' },
  buttonText: { color: c.paper, fontWeight: '600' },
});
