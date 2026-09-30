import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [notice, setNotice] = useState<string | null>(null);

  function explainPendingAccess(provider: string) {
    setNotice(`La autenticación con ${provider} estará disponible después. No se ha iniciado sesión.`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Bienvenido a NLDMAP</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>Accede a tu cuenta</Text>
          <Text style={styles.body}>El acceso todavía no está disponible. Puedes seguir explorando el mapa sin iniciar sesión.</Text>
          <Pressable accessibilityRole="button" accessibilityHint="Muestra un aviso; la autenticación está pendiente"
            onPress={() => explainPendingAccess('Google')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Continuar con Google</Text>
          </Pressable>
          {Platform.OS === 'ios' && (
            <Pressable accessibilityRole="button" accessibilityHint="Muestra un aviso; la autenticación está pendiente"
              onPress={() => explainPendingAccess('Apple')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </Pressable>
          )}
          {notice && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text>}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Volver al mapa</Text>
        </Pressable>
        <Link href="/profile" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Ver información del perfil</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  content: { padding: 20, gap: 20 },
  title: { color: '#173D3A', fontSize: 26, fontWeight: '800' },
  heading: { color: '#173D3A', fontSize: 18, fontWeight: '700' },
  card: { padding: 20, borderRadius: 20, backgroundColor: '#E8EEE7', gap: 16 },
  body: { color: '#52675E', fontSize: 15, lineHeight: 24 },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: '#173D3A', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  link: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 12 },
  linkText: { color: '#173D3A', fontSize: 15, textDecorationLine: 'underline', textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
