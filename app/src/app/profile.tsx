import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Perfil</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>Acceso a NLDMAP</Text>
          <Text style={styles.body}>El acceso y el perfil estarán disponibles cuando se integre la autenticación.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  content: { padding: 20, gap: 20 },
  title: { color: '#173D3A', fontSize: 26, fontWeight: '800' },
  card: { padding: 20, borderRadius: 20, backgroundColor: '#E8EEE7', gap: 12 },
  heading: { color: '#173D3A', fontSize: 18, fontWeight: '700' },
  body: { color: '#52675E', fontSize: 15, lineHeight: 24 },
});
