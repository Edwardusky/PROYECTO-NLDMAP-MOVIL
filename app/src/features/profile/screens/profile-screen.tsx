
import { Text, View } from "react-native";
import { router } from "expo-router";

import {
  Action,
  Field,
  FormScreen,
  useFormStyles,
} from "@/shared/components/form-controls";

import {
  LocalPhotoPicker,
} from "@/shared/components/local-photo-picker";

import {
  useProfile,
} from "@/features/profile/state/profile-context";

import {
  useAuthSession,
} from "@/features/auth/state/auth-session-context";

import type {
  Profile,
} from "@/features/profile/model/profile";

import {
  phoneValid,
} from "@/shared/validation/contact";

type ExtraField = Exclude<
  keyof Profile,
  "firstName" | "lastName" | "email" | "photo"
>;

export default function ProfileScreen() {
  const s = useFormStyles();

  const { user, logout } = useAuthSession();
  const { profile, setProfile } = useProfile();

  function field(
    key: ExtraField,
    label: string,
    keyboardType:
      | "default"
      | "phone-pad"
      | "number-pad" = "default"
  ) {
    const error =
      key === "phone" &&
        profile.phone &&
        !phoneValid(profile.phone)
        ? "Escribe un teléfono válido de 7 a 15 dígitos."
        : undefined;

    return (
      <Field
        key={key}
        label={label}
        value={profile[key]}
        onChangeText={(value) =>
          setProfile((current) => ({
            ...current,
            [key]: value,
          }))
        }
        keyboardType={keyboardType}
        error={error || undefined}
      />
    );
  }

  // Evitar mostrar información privada
  // cuando no hay sesión iniciada.
  if (!user) {
    return (
      <FormScreen>
        <Text
          accessibilityRole="header"
          style={s.title}
        >
          Mi perfil
        </Text>

        <View style={s.card}>
          <Text style={s.body}>
            Inicia sesión para consultar los
            datos de tu cuenta de NLDMAP.
          </Text>

          <Action
            label="Iniciar sesión"
            onPress={() =>
              router.replace("/login")
            }
          />
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <Text
        accessibilityRole="header"
        style={s.title}
      >
        Mi perfil
      </Text>

      {/* Datos reales obtenidos de /me */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Información de mi cuenta
        </Text>

        <Field
          label="Nombre completo registrado"
          value={user.displayName}
          editable={false}
        />

        <Field
          label="Correo electrónico"
          value={user.email ?? ""}
          editable={false}
        />
      </View>

      {/* Información complementaria local */}
      <LocalPhotoPicker
        label="Foto de perfil"
        uri={profile.photo}
        onChange={(photo) =>
          setProfile((current) => ({
            ...current,
            photo,
          }))
        }
      />

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Datos de contacto adicionales
        </Text>

        {field(
          "phone",
          "Teléfono",
          "phone-pad"
        )}

        {field(
          "social",
          "Redes sociales de contacto"
        )}

      </View>

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Domicilio de contacto · Opcional
        </Text>

        {field("state", "Estado")}
        {field("municipality", "Municipio")}
        {field("locality", "Localidad o colonia")}
        {field(
          "postalCode",
          "Código postal",
          "number-pad"
        )}
        {field("street", "Calle y número")}
        {field("reference", "Referencias")}
      </View>

      <Action
        secondary
        label="Volver al mapa"
        onPress={() => router.replace("/")}
      />

      <Action
        secondary
        label="Cerrar sesión"
        onPress={() => {
          logout();
          router.replace("/login");
        }}
      />
    </FormScreen>
  );
}
