import { type ReactNode } from 'react';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette as c } from '@/shared/constants/palette';

export function FormScreen({ children }: { children: ReactNode }) {
  const headerHeight = useHeaderHeight();
  return <SafeAreaView style={formStyles.screen} edges={['bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={formStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={formStyles.field}>
    <Text style={formStyles.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} accessibilityHint={error} style={[formStyles.input, props.multiline && formStyles.multiline, error && formStyles.invalid]} />
    {error && <Text accessibilityRole="alert" style={formStyles.error}>{error}</Text>}
  </View>;
}
export function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [formStyles.button, secondary && formStyles.secondary, (pressed || disabled) && formStyles.pressed]}>
    <Text style={[formStyles.buttonText, secondary && formStyles.secondaryText]}>{label}</Text>
  </Pressable>;
}
export function Choices({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) {
  return <View style={formStyles.field}>
    <Text style={formStyles.label}>{label}</Text>
    <View style={formStyles.choices}>
      {options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={`${label}: ${option}`}
        accessibilityState={{ checked: value === option }} onPress={() => onChange(option)}
        style={({ pressed }) => [formStyles.choice, value === option && formStyles.chosen, pressed && formStyles.pressed]}>
        <Text style={[formStyles.label, value === option && formStyles.buttonText]}>{value === option ? '✓ ' : ''}{option}</Text>
      </Pressable>)}
    </View>
  </View>;
}
export const formStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  content: { padding: 20, gap: 20, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: c.text },
  heading: { fontSize: 19, fontWeight: '700', color: c.text },
  body: { fontSize: 15, lineHeight: 23, color: c.muted },
  label: { fontSize: 15, fontWeight: '600', color: c.text },
  field: { gap: 8 }, card: { padding: 16, borderRadius: 16, backgroundColor: c.surfaceAlt, gap: 16 },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 10, color: c.text, backgroundColor: c.paper, fontSize: 16 },
  multiline: { minHeight: 96, textAlignVertical: 'top' }, invalid: { borderColor: c.error }, error: { color: c.error, fontSize: 15 },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: c.action, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: c.onAction, fontWeight: '700', fontSize: 15, textAlign: 'center' },
  secondary: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border }, secondaryText: { color: c.text },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 48, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, justifyContent: 'center', flexShrink: 1 },
  chosen: { backgroundColor: c.action }, pressed: { opacity: 0.7 },
});
