import Ionicons from '@expo/vector-icons/Ionicons';
import { loadImagePicker, MissingNativeFeatureError } from '@/utils/native-features';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { palette as c } from '@/constants/palette';
import { Action, formStyles as s } from './form-controls';

export function LocalPhotoPicker({ uri, onChange, label }: { uri: string | null; onChange: (uri: string | null) => void; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function select() {
    if (running.current) return;
    running.current = true;
    setBusy(true); setError(null); setSettings(false);
    try {
      const ImagePicker = await loadImagePicker();
      if (!mounted.current) return;
      // Still images via the system picker need no broad library permission.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: false, quality: 0.8, exif: false });
      if (!mounted.current || result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) throw new Error('No image');
      onChange(asset.uri);
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof MissingNativeFeatureError) {
        setError(cause.message);
        return;
      }
      const code = String((cause as { code?: string })?.code ?? '');
      const denied = /permission|denied/i.test(code);
      setSettings(denied);
      setError(denied ? 'No se pudo acceder a la foto. Revisa los permisos en Ajustes.' : 'No se pudo abrir la foto. Inténtalo de nuevo.');
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return <View style={s.field}>
    <Text style={s.label}>{label} · Opcional</Text>
    {uri ? <Image source={{ uri }} accessibilityLabel={`Vista previa: ${label}`} style={styles.image} resizeMode="contain"
      onError={() => setError('La vista previa ya no está disponible. Selecciona la foto otra vez.')} />
      : <View style={styles.placeholder} accessible accessibilityLabel="Sin foto"><Ionicons name="person-outline" size={48} color={c.muted} /></View>}
    <Text style={s.body}>Vista previa local. No se sube ni se guarda en una cuenta.</Text>
    <Action secondary label={busy ? 'Abriendo galería…' : uri ? 'Reemplazar foto' : 'Seleccionar foto'} onPress={select} disabled={busy} />
    {uri && <Action secondary label="Quitar foto" disabled={busy} onPress={() => { onChange(null); setError(null); }} />}
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {settings && <Action secondary label="Abrir Ajustes" onPress={() => { Linking.openSettings().catch(() => setError('No se pudieron abrir los Ajustes. Ábrelos desde tu teléfono.')); }} />}
  </View>;
}
const styles = StyleSheet.create({
  image: { width: '100%', height: 200, borderRadius: 16, backgroundColor: c.surfaceAlt },
  placeholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
