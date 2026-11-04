import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { palette as c } from '@/constants/palette';

export function CloseButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <Ionicons name="close-outline" size={28} color={c.text} accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6, backgroundColor: c.surfaceAlt, borderRadius: 24 },
});
