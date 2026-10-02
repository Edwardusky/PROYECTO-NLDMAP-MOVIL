import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Linking } from 'react-native';
import { loadLocation, MissingNativeFeatureError } from '@/utils/native-features';
import { locateOnce } from '@/data/device-location';

export function useDeviceLocation(onPosition: (point: [number, number], approximate: boolean) => void) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const requestId = useRef(0);
  const latestOnPosition = useRef(onPosition);
  latestOnPosition.current = onPosition;
  const running = useRef(false);
  useFocusEffect(useCallback(() => () => { requestId.current++; running.current = false; setLoading(false); }, []));
  async function locate() {
    if (running.current) return;
    const id = ++requestId.current;
    running.current = true; setLoading(true); setMessage('Obteniendo ubicación…'); setSettings(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const Location = await loadLocation();
      if (requestId.current !== id) return;
      const result = await Promise.race([
        locateOnce({ permissions: Location.getForegroundPermissionsAsync, request: Location.requestForegroundPermissionsAsync,
          services: Location.hasServicesEnabledAsync,
          position: () => Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false }),
        }, () => requestId.current === id),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 25000); }),
      ]);
      if (requestId.current !== id) return;
      if (result.kind === 'position') {
        latestOnPosition.current(result.coordinate, result.approximate);
        setMessage(`${result.approximate ? 'Ubicación aproximada' : 'Ubicación obtenida'}${result.accuracy === null ? ' · Precisión no disponible' : ` · Margen estimado: ${Math.round(result.accuracy)} m`}.`);
      } else if (result.kind === 'denied') {
        setSettings(result.settings); setMessage(result.settings ? 'Permiso de ubicación denegado. Puedes habilitarlo en Ajustes.' : 'Permiso de ubicación denegado. Puedes volver a intentarlo.');
      } else if (result.kind === 'services') {
        setSettings(true); setMessage('La ubicación del teléfono está desactivada. Actívala en Ajustes y vuelve a intentarlo.');
      } else if (result.kind === 'outside') setMessage('Tu ubicación está fuera del área que este mapa puede representar. No se movió la cámara.');
    } catch (cause) {
      if (requestId.current === id) setMessage(cause instanceof MissingNativeFeatureError
        ? cause.message
        : 'No se pudo obtener tu ubicación. Revisa la señal y vuelve a intentarlo.');
    } finally {
      clearTimeout(timer);
      if (requestId.current === id) { requestId.current++; running.current = false; setLoading(false); }
    }
  }
  function openSettings() { Linking.openSettings().catch(() => setMessage('No se pudieron abrir los Ajustes. Ábrelos desde tu teléfono.')); }
  return { loading, message, settings, locate, openSettings };
}
