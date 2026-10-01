import { useHeaderHeight } from 'expo-router/react-navigation';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Field = 'email' | 'firstName' | 'lastName' | 'password';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

export function validateAuth(values: Values, registering: boolean): Errors {
  const errors: Errors = {};
  if (!values.email.trim()) errors.email = 'Escribe tu correo.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Escribe un correo válido.';
  if (registering && !values.firstName.trim()) errors.firstName = 'Escribe tu nombre.';
  if (registering && !values.lastName.trim()) errors.lastName = 'Escribe tus apellidos.';
  // No password policy exists yet. Do not trim or impose length/complexity rules.
  if (!values.password) errors.password = 'Escribe tu contraseña.';
  return errors;
}

export default function AuthForm({ registering = false }: { registering?: boolean }) {
  const headerHeight = useHeaderHeight();
  const [values, setValues] = useState<Values>({ email: '', firstName: '', lastName: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<Partial<Record<Field, TextInput | null>>>({});
  const fields: Field[] = registering ? ['email', 'firstName', 'lastName', 'password'] : ['email', 'password'];
  const labels: Record<Field, string> = { email: 'Correo', firstName: 'Nombre', lastName: 'Apellidos', password: 'Contraseña' };

  // Passwords only live in component memory and are cleared when leaving the screen.
  useFocusEffect(useCallback(() => () => {
    setValues((current) => ({ ...current, password: '' }));
    setVisible(false);
    setErrors({});
    setNotice(null);
  }, []));

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
    setValues((current) => ({ ...current, password: '' }));
    setVisible(false);
    setNotice('La autenticación todavía no está conectada. No se ha creado una cuenta ni iniciado sesión.');
  }

  function pendingOAuth(provider: string) {
    Keyboard.dismiss();
    setNotice(`La autenticación con ${provider} estará disponible después. No se ha iniciado sesión.`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={false}>
          <Text accessibilityRole="header" style={styles.title}>{registering ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
          <Text style={styles.body}>Puedes volver al mapa sin iniciar sesión. El acceso todavía no está conectado.</Text>
          <View style={styles.card}>
            {fields.map((field, index) => {
              const password = field === 'password';
              return (
                <View key={field} style={styles.field}>
                  <Text nativeID={`${field}-label`} style={styles.label}>{labels[field]}</Text>
                  <TextInput
                    ref={(input) => { inputs.current[field] = input; }}
                    accessibilityLabel={labels[field]}
                    accessibilityLabelledBy={`${field}-label`}
                    accessibilityHint={errors[field]}
                    value={values[field]}
                    onChangeText={(text) => {
                      setValues((current) => ({ ...current, [field]: text }));
                      setErrors((current) => ({ ...current, [field]: undefined }));
                      setNotice(null);
                    }}
                    keyboardType={field === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field === 'email' || password ? 'none' : 'words'}
                    autoCorrect={false}
                    autoComplete="off"
                    secureTextEntry={password && !visible}
                    returnKeyType={password ? 'done' : 'next'}
                    submitBehavior={password ? 'blurAndSubmit' : 'submit'}
                    onSubmitEditing={() => password ? submit() : inputs.current[fields[index + 1]]?.focus()}
                    style={[styles.input, errors[field] && styles.invalid]}
                  />
                  {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onPress={() => setVisible((current) => !current)} style={styles.visibility}>
                    <Text style={styles.linkText}>{visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text>
                  </Pressable>}
                  {errors[field] && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{errors[field]}</Text>}
                </View>
              );
            })}
            <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>{registering ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
            </Pressable>
            {notice && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text>}
            <Pressable accessibilityRole="button" accessibilityHint="Autenticación pendiente" onPress={() => pendingOAuth('Google')}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Continuar con Google</Text>
            </Pressable>
            {Platform.OS === 'ios' && <Pressable accessibilityRole="button" accessibilityHint="Autenticación pendiente"
              onPress={() => pendingOAuth('Apple')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </Pressable>}
          </View>
          <Link href={registering ? '/login' : '/register'} replace asChild>
            <Pressable accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkText}>{registering ? '¿Ya tienes cuenta? Iniciar sesión' : '¿No tienes cuenta? Crear cuenta'}</Text>
            </Pressable>
          </Link>
          <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={styles.button}>
            <Text style={styles.buttonText}>Volver al mapa sin iniciar sesión</Text>
          </Pressable>
          {!registering && <Link href="/profile" asChild>
            <Pressable accessibilityRole="link" style={styles.link}><Text style={styles.linkText}>Ver información del perfil</Text></Pressable>
          </Link>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F6' },
  content: { padding: 20, gap: 20 },
  title: { color: '#173D3A', fontSize: 26, fontWeight: '800' },
  card: { padding: 20, borderRadius: 20, backgroundColor: '#E8EEE7', gap: 16 },
  body: { color: '#52675E', fontSize: 15, lineHeight: 24 },
  field: { gap: 6 },
  label: { color: '#173D3A', fontSize: 15, fontWeight: '600' },
  input: { minHeight: 48, padding: 12, backgroundColor: '#FFFFFF', color: '#173D3A', borderWidth: 1, borderColor: '#52675E', borderRadius: 10, fontSize: 16 },
  invalid: { borderColor: '#A32929' },
  error: { color: '#A32929', fontSize: 14, lineHeight: 20 },
  visibility: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: '#173D3A', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  link: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 12 },
  linkText: { color: '#173D3A', fontSize: 15, textDecorationLine: 'underline', textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
