import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export class MissingNativeFeatureError extends Error {
  constructor(moduleName: string, feature: string) {
    super(`${feature} no está disponible en esta instalación. Se necesita una development build actualizada que incluya ${moduleName}.`);
    this.name = 'MissingNativeFeatureError';
  }
}

function checkNativeModule(moduleName: string, feature: string) {
  // Check before importing: these packages resolve their native module at evaluation time.
  // Web uses each package's web implementation, not the Android/iOS native registry.
  if (Platform.OS !== 'web' && requireOptionalNativeModule<unknown>(moduleName) == null) {
    throw new MissingNativeFeatureError(moduleName, feature);
  }
}

export async function loadLocation() {
  checkNativeModule('ExpoLocation', 'La ubicación');
  return import('expo-location');
}

export async function loadImagePicker() {
  checkNativeModule('ExponentImagePicker', 'La galería');
  return import('expo-image-picker');
}
