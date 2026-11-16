
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  loadImagePicker,
  MissingNativeFeatureError,
} from "@/shared/native/native-features";

import { useAppTheme } from "@/shared/theme/app-theme-context";
import { Action, useFormStyles } from "./form-controls";

type Props = {
  uri: string | null;
  onChange: (uri: string | null) => void;
  label: string;
  allowCapture?: boolean;
  required?: boolean;
  validationError?: string;
};

type PhotoSource = "gallery" | "camera";

export function LocalPhotoPicker({
  uri,
  onChange,
  label,
  allowCapture = false,
  required = false,
  validationError,
}: Props) {
  const { colors: c } = useAppTheme();
  const s = useFormStyles();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);

  const mounted = useRef(true);
  const running = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  async function choosePhoto(source: PhotoSource) {
    if (running.current) return;

    running.current = true;
    setBusy(true);
    setError(null);
    setSettings(false);

    try {
      const ImagePicker = await loadImagePicker();

      if (!mounted.current) return;

      // Solicitar permiso solamente al usar la cámara.
      if (source === "camera") {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!mounted.current) return;

        if (!permission.granted) {
          setSettings(!permission.canAskAgain);

          setError(
            permission.canAskAgain
              ? "Se necesita permiso para utilizar la cámara. Puedes volver a intentarlo."
              : "El acceso a la cámara está deshabilitado. Habilítalo desde Ajustes."
          );

          return;
        }
      }

      // Abrir la cámara o la galería del dispositivo.
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
            exif: false,
          })
          : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            allowsMultipleSelection: false,
            quality: 0.8,
            exif: false,
          });

      if (!mounted.current || result.canceled) return;

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        throw new Error("No image");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
      ];

      if (
        asset.mimeType &&
        !allowedTypes.includes(asset.mimeType)
      ) {
        setError(
          "Formato no admitido. Selecciona una fotografía JPG, JPEG o PNG."
        );
        return;
      }

      const maxBytes = 5 * 1024 * 1024;

      if (
        typeof asset.fileSize === "number" &&
        asset.fileSize > maxBytes
      ) {
        setError(
          "La imagen supera los 5 MB permitidos. Selecciona otra fotografía."
        );
        return;
      }

      // Se utiliza la misma propiedad para ambas fuentes.
      onChange(asset.uri);
    } catch (cause) {
      if (!mounted.current) return;

      if (cause instanceof MissingNativeFeatureError) {
        setError(cause.message);
        return;
      }

      const code = String(
        (cause as { code?: string })?.code ?? ""
      );

      const denied = /permission|denied/i.test(code);

      setSettings(denied);

      setError(
        denied
          ? "No se pudo acceder a la cámara o a la foto. Revisa los permisos en Ajustes."
          : source === "camera"
            ? "No se pudo abrir la cámara. Comprueba que esté disponible e inténtalo nuevamente."
            : "No se pudo abrir la galería. Inténtalo nuevamente."
      );
    } finally {
      running.current = false;

      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  function removePhoto() {
    onChange(null);
    setError(null);
    setSettings(false);
  }

  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label} · {required ? "Obligatoria" : "Opcional"}
      </Text>

      {/* Vista previa */}
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel={`Vista previa: ${label}`}
          style={[
            styles.image,
            { backgroundColor: c.surfaceAlt },
          ]}
          resizeMode="contain"
          onError={() =>
            setError(
              "La vista previa ya no está disponible. Selecciona o captura otra foto."
            )
          }
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: c.surfaceAlt },
          ]}
          accessible
          accessibilityLabel="Sin foto"
        >
          <Ionicons
            name="person-outline"
            size={48}
            color={c.muted}
          />
        </View>
      )}

      <Text style={s.body}>
        Vista previa local. La imagen no se envía
        ni se publica desde este selector.
      </Text>

      {/* Seleccionar una imagen existente */}
      <Action
        secondary
        label={
          busy
            ? "Procesando imagen…"
            : uri
              ? "Reemplazar desde galería"
              : "Seleccionar foto"
        }
        onPress={() => {
          void choosePhoto("gallery");
        }}
        disabled={busy}
      />

      {/* Tomar una nueva fotografía */}
      {allowCapture && (
        <Action
          secondary
          label="Tomar foto"
          onPress={() => {
            void choosePhoto("camera");
          }}
          disabled={busy}
        />
      )}

      {/* Eliminar imagen actual */}
      {uri && (
        <Action
          secondary
          label="Quitar foto"
          disabled={busy}
          onPress={removePhoto}
        />
      )}

      {/* Errores */}
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}

      {validationError && (
        <Text accessibilityRole="alert" style={s.error}>
          {validationError}
        </Text>
      )}

      {/* Permisos deshabilitados */}
      {settings && (
        <Action
          secondary
          label="Abrir Ajustes"
          onPress={() => {
            Linking.openSettings().catch(() => {
              setError(
                "No se pudieron abrir los Ajustes. Ábrelos desde tu teléfono."
              );
            });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },

  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
