type Permission = { granted: boolean; canAskAgain: boolean; android?: { accuracy: string }; ios?: { accuracy: string } };
type Position = { coords: { longitude: number; latitude: number; accuracy: number | null } };
export type LocationPort = {
  permissions: () => Promise<Permission>;
  request: () => Promise<Permission>;
  services: () => Promise<boolean>;
  position: () => Promise<Position>;
};
export type LocationResult =
  | { kind: 'position'; coordinate: [number, number]; approximate: boolean; accuracy: number | null }
  | { kind: 'denied'; settings: boolean }
  | { kind: 'services' | 'outside' | 'cancelled' };

// No app-specific geographic restriction exists. Mercator cannot display the poles.
export const MAX_MAP_LATITUDE = 85.051129;
export async function locateOnce(api: LocationPort, active: () => boolean): Promise<LocationResult> {
  let permission = await api.permissions();
  if (!active()) return { kind: 'cancelled' };
  if (!permission.granted && permission.canAskAgain) permission = await api.request();
  if (!active()) return { kind: 'cancelled' };
  if (!permission.granted) return { kind: 'denied', settings: !permission.canAskAgain };
  const services = await api.services();
  if (!active()) return { kind: 'cancelled' };
  if (!services) return { kind: 'services' };
  const { coords } = await api.position();
  if (!active()) return { kind: 'cancelled' };
  if (![coords.longitude, coords.latitude].every(Number.isFinite) || Math.abs(coords.longitude) > 180 || Math.abs(coords.latitude) > 90) throw new Error('Invalid position');
  if (Math.abs(coords.latitude) > MAX_MAP_LATITUDE) return { kind: 'outside' };
  const accuracy = coords.accuracy !== null && Number.isFinite(coords.accuracy) && coords.accuracy >= 0 ? coords.accuracy : null;
  return { kind: 'position', coordinate: [coords.longitude, coords.latitude], accuracy,
    approximate: permission.android?.accuracy === 'coarse' || permission.ios?.accuracy === 'reduced' || accuracy === null || accuracy > 100 };
}
