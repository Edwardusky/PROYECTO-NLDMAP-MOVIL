import { Text, View } from "react-native";
import {
  Action,
  Field,
  FormScreen,
  formStyles as s,
} from "@/shared/components/form-controls";
import { LocalPhotoPicker } from "@/shared/components/local-photo-picker";
import { useProfile } from "@/features/profile/state/profile-context";
import type { Profile } from "@/features/profile/model/profile";
import { emailValid, phoneValid } from "@/shared/validation/contact";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { profile, setProfile } = useProfile();
  function field(
    key: Exclude<keyof Profile, "photo">,
    label: string,
    keyboardType:
      | "default"
      | "email-address"
      | "phone-pad"
      | "number-pad" = "default",
  ) {
    const error =
      key === "email" && profile.email && !emailValid(profile.email)
        ? "Escribe un correo válido."
        : key === "phone" && profile.phone && !phoneValid(profile.phone)
          ? "Escribe un teléfono válido de 7 a 15 dígitos."
          : undefined;
    return (
      <Field
        key={key}
        label={label}
        value={profile[key]}
        onChangeText={(value) =>
          setProfile((current) => ({ ...current, [key]: value }))
        }
        keyboardType={keyboardType}
        autoCapitalize={key === "email" ? "none" : "sentences"}
        error={error || undefined}
      />
    );
  }
  return (
    <FormScreen>
      <Text accessibilityRole="header" style={s.title}>
        Perfil
      </Text>
      <LocalPhotoPicker
        label="Foto de perfil"
        uri={profile.photo}
        onChange={(photo) => setProfile((current) => ({ ...current, photo }))}
      />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Datos de contacto
        </Text>
        {field("firstName", "Nombre")}
        {field("lastName", "Apellidos")}
        {field("email", "Correo", "email-address")}
        {field("phone", "Teléfono", "phone-pad")}
        {field("social", "Redes sociales de contacto")}
        <Text style={s.body}>
          Estos datos no aparecen en las fichas públicas del mapa.
        </Text>
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Domicilio de contacto · Opcional
        </Text>
        {field("state", "Estado")}
        {field("municipality", "Municipio")}
        {field("locality", "Localidad o colonia")}
        {field("postalCode", "Código postal", "number-pad")}
        {field("street", "Calle y número")}
        {field("reference", "Referencias")}
      </View>
      <Action
        secondary
        label="Ver formulario de acceso"
        onPress={() => router.navigate("/login")}
      />
      <Action
        secondary
        label="Volver al mapa"
        onPress={() => router.dismissTo("/")}
      />
    </FormScreen>
  );
}
