import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import { useHeaderHeight } from "expo-router/react-navigation";
import {
  Link,
  router,
  useFocusEffect,
} from "expo-router"; import { useCallback, useRef, useState } from "react";
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

import {
  useAuthSession,
} from "@/features/auth/state/auth-session-context";
import {
  validateAuth,
  type Field,
  type Values,
  type Errors,
} from "../model/auth-validation";
import {
  registrarCuenta,
} from "../api/auth-api";
export { validateAuth } from "../model/auth-validation";

type PasswordField = "password" | "confirmPassword";

const labels: Record<Field, string> = {
  firstName: "Nombres *",
  paternalSurname: "Apellido paterno *",
  maternalSurname: "Apellido materno (opcional)",
  email: "Correo electrónico *",
  password: "Contraseña *",
  confirmPassword: "Confirmar contraseña *",
};

const registrationFields: Field[] = [
  "firstName",
  "paternalSurname",
  "maternalSurname",
  "email",
  "password",
  "confirmPassword",
];

const loginFields: Field[] = [
  "email",
  "password",
];

export default function AuthForm({
  registering = false,
}: {
  registering?: boolean;
}) {
  const { colors: c } = useAppTheme();
  const { login } = useAuthSession();
  const styles = createStyles(c);
  const headerHeight = useHeaderHeight();

  const [values, setValues] = useState<Values>({
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [visible, setVisible] = useState<
    Record<PasswordField, boolean>
  >({
    password: false,
    confirmPassword: false,
  });

  const inputs = useRef<
    Partial<Record<Field, TextInput | null>>
  >({});

  const fields = registering
    ? registrationFields
    : loginFields;

  useFocusEffect(
    useCallback(
      () => () => {
        setValues((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));
        setVisible({
          password: false,
          confirmPassword: false,
        });
        setErrors({});
        setNotice(null);
      },
      [],
    ),
  );


  async function submit() {
    if (submittingRef.current) return;

    const nextErrors = validateAuth(
      values,
      registering
    );

    setErrors(nextErrors);
    setNotice(null);

    const firstInvalid = fields.find(
      (field) => nextErrors[field]
    );

    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus();
      return;
    }

    Keyboard.dismiss();



    if (!registering) {
      submittingRef.current = true;
      setSubmitting(true);

      try {
        await login(
          values.email,
          values.password
        );

        setValues((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));

        setVisible({
          password: false,
          confirmPassword: false,
        });

        // Ahora la cuenta está disponible
        // para el menú y para Mi perfil.
        router.replace("/profile");
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "No fue posible iniciar sesión."
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }

      return;
    }



    const displayName = [
      values.firstName,
      values.paternalSurname,
      values.maternalSurname,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

    submittingRef.current = true;
    setSubmitting(true);

    try {
      await registrarCuenta({
        displayName,
        email: values.email,
        password: values.password,
      });

      // No conservar contraseñas en el formulario.
      setValues((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));

      // El registro no inicia sesión automáticamente.
      router.replace("/login");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar la cuenta."
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }


  function pendingOAuth() {
    Keyboard.dismiss();
    setNotice(
      "El acceso externo no está disponible.",
    );
  }

  function updateField(field: Field, text: string) {
    setValues((current) => ({
      ...current,
      [field]: text,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "password"
        ? { confirmPassword: undefined }
        : {}),
    }));

    setNotice(null);
  }

  function togglePassword(field: PasswordField) {
    setVisible((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={false}
        >
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {registering
              ? "Crear cuenta"
              : "Iniciar sesión"}
          </Text>

          <View style={styles.card}>
            {fields.map((field, index) => {
              const isPassword =
                field === "password" ||
                field === "confirmPassword";

              const passwordField = isPassword
                ? (field as PasswordField)
                : null;

              const isLast = index === fields.length - 1;

              return (
                <View key={field} style={styles.field}>
                  <Text
                    nativeID={`${field}-label`}
                    style={styles.label}
                  >
                    {labels[field]}
                  </Text>

                  {registering &&
                    field === "password" && (
                      <Text style={styles.body}>
                        La contraseña debe tener al menos
                        12 caracteres e incluir mayúscula,
                        minúscula, número y símbolo.
                      </Text>
                    )}

                  <TextInput
                    ref={(input) => {
                      inputs.current[field] = input;
                    }}
                    accessibilityLabel={labels[field]}
                    accessibilityLabelledBy={`${field}-label`}
                    accessibilityHint={errors[field]}
                    value={values[field]}
                    onChangeText={(text) =>
                      updateField(field, text)
                    }
                    keyboardType={
                      field === "email"
                        ? "email-address"
                        : "default"
                    }
                    autoCapitalize={
                      field === "email" || isPassword
                        ? "none"
                        : "words"
                    }
                    autoCorrect={false}
                    autoComplete="off"
                    secureTextEntry={
                      passwordField !== null &&
                      !visible[passwordField]
                    }
                    returnKeyType={
                      isLast ? "done" : "next"
                    }
                    submitBehavior={
                      isLast
                        ? "blurAndSubmit"
                        : "submit"
                    }
                    onSubmitEditing={() => {
                      if (isLast) {
                        void submit();
                      } else {
                        inputs.current[
                          fields[index + 1]
                        ]?.focus();
                      }
                    }}
                    style={[
                      styles.input,
                      errors[field] && styles.invalid,
                    ]}
                  />

                  {passwordField && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        visible[passwordField]
                          ? `Ocultar ${labels[field]}`
                          : `Mostrar ${labels[field]}`
                      }
                      onPress={() =>
                        togglePassword(passwordField)
                      }
                      style={styles.visibility}
                    >
                      <Text style={styles.linkText}>
                        {visible[passwordField]
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"}
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
              accessibilityState={{
                disabled: submitting,
                busy: submitting,
              }}
              disabled={submitting}
              onPress={() => {
                void submit();
              }}
              style={({ pressed }) => [
                styles.button,
                (pressed || submitting) && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {submitting
                  ? "Creando cuenta..."
                  : registering
                    ? "Crear cuenta"
                    : "Iniciar sesión"}
              </Text>
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

            {Platform.OS === "ios" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  "Acceso externo · No disponible"
                }
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

          <Link
            href={
              registering ? "/login" : "/register"
            }
            replace
            asChild
          >
            <Pressable
              accessibilityRole="link"
              style={styles.link}
            >
              <Text style={styles.linkText}>
                {registering
                  ? "Ver formulario de acceso"
                  : "Ver formulario de registro"}
              </Text>
            </Pressable>
          </Link>

          {!registering && (
            <Link href="/profile" asChild>
              <Pressable
                accessibilityRole="link"
                style={styles.link}
              >
                <Text style={styles.linkText}>
                  Ver Perfil
                </Text>
              </Pressable>
            </Link>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.surface,
    },
    content: {
      padding: 20,
      gap: 20,
    },
    title: {
      color: c.text,
      fontSize: 26,
      fontWeight: "800",
    },
    card: {
      padding: 20,
      borderRadius: 20,
      backgroundColor: c.surfaceAlt,
      gap: 16,
    },
    body: {
      color: c.muted,
      fontSize: 15,
      lineHeight: 24,
    },
    field: {
      gap: 6,
    },
    label: {
      color: c.text,
      fontSize: 15,
      fontWeight: "600",
    },
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
    invalid: {
      borderColor: c.error,
    },
    error: {
      color: c.error,
      fontSize: 14,
      lineHeight: 20,
    },
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
    pressed: {
      opacity: 0.7,
    },
  });
}