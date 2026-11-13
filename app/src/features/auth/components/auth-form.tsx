import { palette as c } from "@/shared/constants/palette";
import { useHeaderHeight } from "expo-router/react-navigation";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Field = "email" | "firstName" | "lastName" | "password";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

export function validateAuth(values: Values, registering: boolean): Errors {
  const errors: Errors = {};
  if (!values.email.trim()) errors.email = "Escribe tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Escribe un correo válido.";
  if (registering && !values.firstName.trim())
    errors.firstName = "Escribe tu nombre.";
  if (registering && !values.lastName.trim())
    errors.lastName = "Escribe tus apellidos.";
  // No password policy exists yet. Do not trim or impose length/complexity rules.
  if (!values.password) errors.password = "Escribe tu contraseña.";
  return errors;
}

export default function AuthForm({
  registering = false,
}: {
  registering?: boolean;
}) {
  const headerHeight = useHeaderHeight();
  const [values, setValues] = useState<Values>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<Partial<Record<Field, TextInput | null>>>({});
  const fields: Field[] = registering
    ? ["email", "firstName", "lastName", "password"]
    : ["email", "password"];
  const labels: Record<Field, string> = {
    email: "Correo",
    firstName: "Nombre",
    lastName: "Apellidos",
    password: "Contraseña",
  };

  // Passwords only live in component memory and are cleared when leaving the screen.
  useFocusEffect(
    useCallback(
      () => () => {
        setValues((current) => ({ ...current, password: "" }));
        setVisible(false);
        setErrors({});
        setNotice(null);
      },
      [],
    ),
  );

  function submit() {
    const nextErrors = validateAuth(values, registering);
    setErrors(nextErrors);
    setNotice(null);
    const firstInvalid = fields.find((field) => nextErrors[field]);
    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus();
      return;
    }
    Keyboard.dismiss();
    setValues((current) => ({ ...current, password: "" }));
    setVisible(false);
    setNotice("Función no disponible");
  }

  function pendingOAuth() {
    Keyboard.dismiss();
    setNotice("El acceso externo no está disponible.");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={false}
        >
          <Text accessibilityRole="header" style={styles.title}>
            {registering ? "Registro" : "Acceso"}
          </Text>
          <View style={styles.card}>
            {fields.map((field, index) => {
              const password = field === "password";
              return (
                <View key={field} style={styles.field}>
                  <Text nativeID={`${field}-label`} style={styles.label}>
                    {labels[field]}
                  </Text>
                  <TextInput
                    ref={(input) => {
                      inputs.current[field] = input;
                    }}
                    accessibilityLabel={labels[field]}
                    accessibilityLabelledBy={`${field}-label`}
                    accessibilityHint={errors[field]}
                    value={values[field]}
                    onChangeText={(text) => {
                      setValues((current) => ({ ...current, [field]: text }));
                      setErrors((current) => ({
                        ...current,
                        [field]: undefined,
                      }));
                      setNotice(null);
                    }}
                    keyboardType={
                      field === "email" ? "email-address" : "default"
                    }
                    autoCapitalize={
                      field === "email" || password ? "none" : "words"
                    }
                    autoCorrect={false}
                    autoComplete="off"
                    secureTextEntry={password && !visible}
                    returnKeyType={password ? "done" : "next"}
                    submitBehavior={password ? "blurAndSubmit" : "submit"}
                    onSubmitEditing={() =>
                      password
                        ? submit()
                        : inputs.current[fields[index + 1]]?.focus()
                    }
                    style={[styles.input, errors[field] && styles.invalid]}
                  />
                  {password && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        visible ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                      onPress={() => setVisible((current) => !current)}
                      style={styles.visibility}
                    >
                      <Text style={styles.linkText}>
                        {visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                      </Text>
                    </Pressable>
                  )}
                  {errors[field] && (
                    <Text
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                      style={styles.error}
                    >
                      {errors[field]}
                    </Text>
                  )}
                </View>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>Iniciar sesion</Text>
            </Pressable>
            {notice && (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={styles.body}
              >
                {notice}
              </Text>
            )}
            {/* <Pressable
              accessibilityRole="button"
              accessibilityLabel="Google · No disponible"
              onPress={pendingOAuth}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
               <Text style={styles.buttonText}>Google · No disponible</Text> 
            </Pressable> */}
            {Platform.OS === "ios" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Acceso externo · No disponible"
                onPress={pendingOAuth}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.buttonText}>
                  Acceso externo · No disponible
                </Text>
              </Pressable>
            )}
          </View>
          <Link href={registering ? "/login" : "/register"} replace asChild>
            <Pressable accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkText}>
                {registering
                  ? "Ver formulario de acceso"
                  : "Ver formulario de registro"}
              </Text>
            </Pressable>
          </Link>
          {!registering && (
            <Link href="/profile" asChild>
              <Pressable accessibilityRole="link" style={styles.link}>
                <Text style={styles.linkText}>Ver Perfil</Text>
              </Pressable>
            </Link>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  content: { padding: 20, gap: 20 },
  title: { color: c.text, fontSize: 26, fontWeight: "800" },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: c.surfaceAlt,
    gap: 16,
  },
  body: { color: c.muted, fontSize: 15, lineHeight: 24 },
  field: { gap: 6 },
  label: { color: c.text, fontSize: 15, fontWeight: "600" },
  input: {
    minHeight: 48,
    padding: 12,
    backgroundColor: c.paper,
    color: c.text,
    borderWidth: 1,
    borderColor: c.muted,
    borderRadius: 10,
    fontSize: 16,
  },
  invalid: { borderColor: c.error },
  error: { color: c.error, fontSize: 14, lineHeight: 20 },
  visibility: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    backgroundColor: c.text,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: c.paper,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  link: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  linkText: {
    color: c.text,
    fontSize: 15,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  pressed: { opacity: 0.7 },
});
