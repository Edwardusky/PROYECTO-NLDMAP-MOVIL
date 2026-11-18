import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useHeaderHeight } from "expo-router/react-navigation";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  lightPalette,
  type Palette,
} from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";

function createFormStyles(c: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.surface,
    },
    content: {
      padding: 20,
      gap: 20,
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
    },
    heading: {
      fontSize: 19,
      fontWeight: "700",
      color: c.text,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: c.muted,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    field: {
      gap: 8,
    },
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surfaceAlt,
      gap: 16,
    },
    input: {
      minHeight: 48,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      color: c.text,
      backgroundColor: c.paper,
      fontSize: 16,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    invalid: {
      borderColor: c.error,
    },
    error: {
      color: c.error,
      fontSize: 15,
    },
    button: {
      minHeight: 48,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.action,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: c.onAction,
      fontWeight: "700",
      fontSize: 15,
      textAlign: "center",
    },
    secondary: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    secondaryText: {
      color: c.text,
    },
    choices: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    choice: {
      minHeight: 48,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: "center",
      flexShrink: 1,
    },
    chosen: {
      backgroundColor: c.action,
    },
    pressed: {
      opacity: 0.7,
    },
    stickyHeader: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
  });
}

/**
 * Estilos dinámicos para componentes que usan
 * la paleta activa de NLDMAP.
 */
export function useFormStyles() {
  const { colors } = useAppTheme();

  return useMemo(
    () => createFormStyles(colors),
    [colors],
  );
}

/**
 * Compatibilidad temporal con componentes que
 * aún importan formStyles de manera estática.
 */
export const formStyles = createFormStyles(lightPalette);


export type FormErrorRequest = {
  id: string;
  attempt: number;
};

type RegisterFormTarget = (
  id: string,
  node: View | null
) => void;

const FormTargetsContext =
  createContext<RegisterFormTarget | null>(null);

export function FormErrorTarget({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const register = useContext(FormTargetsContext);

  const setTarget = useCallback(
    (node: View | null) => {
      register?.(id, node);
    },
    [register, id]
  );

  return (
    <View ref={setTarget} collapsable={false}>
      {children}
    </View>
  );
}



export function FormScreen({
  children,
  header,
  errorRequest,
}: {
  children: ReactNode;
  header?: ReactNode;
  errorRequest?: FormErrorRequest | null;
}) {
  const s = useFormStyles();
  const headerHeight = useHeaderHeight();

  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const scrollOffset = useRef(0);

  const targets = useRef(
    new Map<string, View>()
  );

  const registerTarget = useCallback(
    (id: string, node: View | null) => {
      if (node) {
        targets.current.set(id, node);
      } else {
        targets.current.delete(id);
      }
    },
    []
  );


  useEffect(() => {
    if (!errorRequest) return;

    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      const scroll = scrollRef.current;
      const viewport = viewportRef.current;

      const target = targets.current.get(
        errorRequest.id
      );

      if (!scroll || !viewport || !target) {
        return;
      }

      viewport.measureInWindow(
        (_viewportX: number, viewportTop: number) => {
          target.measureInWindow(
            (_targetX: number, targetTop: number) => {
              if (cancelled) return;

              if (
                !Number.isFinite(viewportTop) ||
                !Number.isFinite(targetTop)
              ) {
                return;
              }

              const destination = Math.max(
                0,
                scrollOffset.current +
                targetTop -
                viewportTop -
                16
              );

              scroll.scrollTo({
                y: destination,
                animated: true,
              });
            }
          );
        }
      );
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [errorRequest]);


  return (
    <FormTargetsContext.Provider value={registerTarget}>
      <SafeAreaView
        style={s.screen}
        edges={["bottom", "left", "right"]}
      >
        {header && (
          <View style={s.stickyHeader}>
            <View
              style={{
                width: "100%",
                maxWidth: 680,
                alignSelf: "center",
              }}
            >
              {header}
            </View>
          </View>
        )}


        <KeyboardAvoidingView
          style={s.screen}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={headerHeight}
        >
          <View
            ref={viewportRef}
            collapsable={false}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={s.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              scrollEventThrottle={16}
              onScroll={(event) => {
                scrollOffset.current =
                  event.nativeEvent.contentOffset.y;
              }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </FormTargetsContext.Provider>
  );
}




export function Field({
  label,
  error,
  fieldId,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  fieldId?: string;
}) {
  const s = useFormStyles();
  const { colors: c } = useAppTheme();

  const content = (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={
          props.placeholderTextColor ?? c.muted
        }
        selectionColor={
          props.selectionColor ?? c.action
        }
        style={[
          s.input,
          props.multiline && s.multiline,
          error && s.invalid,
          props.style,
        ]}
      />

      {!!error && (
        <Text
          accessibilityRole="alert"
          style={s.error}
        >
          {error}
        </Text>
      )}
    </View>
  );

  return fieldId ? (
    <FormErrorTarget id={fieldId}>
      {content}
    </FormErrorTarget>
  ) : (
    content
  );
}


export function Action({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const s = useFormStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && s.pressed,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary && s.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


export function Choices({
  label,
  options,
  value,
  onChange,
  fieldId,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  fieldId?: string;
}) {
  const s = useFormStyles();

  const content = (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <View style={s.choices}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={
              `${label}: ${option}`
            }
            accessibilityState={{
              checked: value === option,
            }}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              s.choice,
              value === option && s.chosen,
              pressed && s.pressed,
            ]}
          >
            <Text
              style={[
                s.label,
                value === option &&
                s.buttonText,
              ]}
            >
              {value === option ? "✓ " : ""}
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return fieldId ? (
    <FormErrorTarget id={fieldId}>
      {content}
    </FormErrorTarget>
  ) : (
    content
  );
}

