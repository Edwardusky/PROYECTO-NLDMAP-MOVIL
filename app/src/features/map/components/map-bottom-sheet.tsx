
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { scheduleOnRN } from "react-native-worklets";

import { useAppTheme } from "@/shared/theme/app-theme-context";
import type { Palette } from "@/shared/constants/palette";

import {
  getMapSheetSnapPoints,
  type MapSheetIndex,
} from "../utils/map-sheet-layout";

type Props = {
  viewportHeight: number;
  visibleCount: number;

  selecting: boolean;
  reportStarted: boolean;

  canConfirmLocation: boolean;
  confirming: boolean;

  onStartReport: () => void;
  onContinueReport: () => void;
  onConfirmLocation: () => void;
  onCancelSelection: () => void;

  onIndexChange?: (index: MapSheetIndex) => void;

  children: ReactNode;
};

export function MapBottomSheet({
  viewportHeight,
  visibleCount,
  selecting,
  reportStarted,
  canConfirmLocation,
  confirming,
  onStartReport,
  onContinueReport,
  onConfirmLocation,
  onCancelSelection,
  onIndexChange,
  children,
}: Props) {
  const { colors: c } = useAppTheme();

  const styles = useMemo(
    () => createStyles(c),
    [c]
  );

  const points = useMemo(
    () => getMapSheetSnapPoints(viewportHeight),
    [viewportHeight]
  );

  const [index, setIndex] =
    useState<MapSheetIndex>(0);

  const sheetHeight = useSharedValue(points[0]);
  const gestureStart = useSharedValue(points[0]);

  const updateIndex = useCallback(
    (next: MapSheetIndex) => {
      setIndex(next);
      onIndexChange?.(next);
    },
    [onIndexChange]
  );

  const snapTo = useCallback(
    (next: MapSheetIndex) => {
      sheetHeight.value = withTiming(
        points[next],
        { duration: 240 }
      );

      updateIndex(next);
    },
    [points, sheetHeight, updateIndex]
  );

  // Ajustar la altura al cambiar las
  // dimensiones de la pantalla.
  useEffect(() => {
    sheetHeight.value = withTiming(
      points[index],
      { duration: 180 }
    );
  }, [points]);

  // Al elegir la ubicación de un reporte,
  // mantener el mapa despejado.
  useEffect(() => {
    if (selecting) {
      snapTo(0);
    }
  }, [selecting, snapTo]);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-28, 28])
    .onStart(() => {
      gestureStart.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      const next =
        gestureStart.value - event.translationY;

      sheetHeight.value = Math.max(
        points[0],
        Math.min(points[2], next)
      );
    })
    .onEnd((event) => {
      // Considerar la velocidad al soltar
      // para determinar el siguiente anclaje.
      const projected =
        sheetHeight.value - event.velocityY * 0.12;

      let nearest: MapSheetIndex = 0;
      let distance = Math.abs(
        points[0] - projected
      );

      for (let i = 1; i < 3; i++) {
        const candidate = Math.abs(
          points[i] - projected
        );

        if (candidate < distance) {
          distance = candidate;
          nearest = i as MapSheetIndex;
        }
      }

      sheetHeight.value = withSpring(
        points[nearest],
        {
          damping: 22,
          stiffness: 240,
          overshootClamping: true,
        }
      );

      // Actualizar React al finalizar el gesto.
      scheduleOnRN(updateIndex, nearest);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  function cycleHeight() {
    const next =
      ((index + 1) % 3) as MapSheetIndex;

    snapTo(next);
  }

  const stateName =
    index === 0
      ? "Compacto"
      : index === 1
        ? "Intermedio"
        : "Expandido";

  if (viewportHeight <= 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.sheet, animatedStyle]}
    >
      {/* Zona exclusiva para arrastrar */}
      <GestureDetector gesture={pan}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
      </GestureDetector>


      {/* Resumen permanente */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          `Cambiar altura del panel. ` +
          `Estado actual: ${stateName}`
        }
        accessibilityHint={
          "Toca para alternar entre compacto, intermedio y expandido"
        }
        onPress={cycleHeight}
        style={({ pressed }) => [
          styles.summaryRow,
          pressed && { opacity: 0.75 },
        ]}
      >
        <View style={styles.summaryText}>
          <Text
            numberOfLines={1}
            style={styles.title}
          >
            {selecting
              ? "Seleccionar ubicación"
              : "Consultar mapa"}
          </Text>

          <Text style={styles.subtitle}>
            {visibleCount} reportes visibles
          </Text>
        </View>
      </Pressable>


      {/* Acciones rápidas del modo compacto */}
      {index === 0 && (
        <View style={styles.quickActions}>
          {selecting ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmar ubicación"
                disabled={!canConfirmLocation}
                accessibilityState={{
                  disabled: !canConfirmLocation,
                  busy: confirming,
                }}
                onPress={onConfirmLocation}
                style={[
                  styles.quickButton,
                  styles.flex,
                  !canConfirmLocation &&
                  styles.disabled,
                ]}
              >
                <Text
                  style={styles.quickButtonText}
                >
                  {confirming
                    ? "Confirmando..."
                    : "Confirmar"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={onCancelSelection}
                style={[
                  styles.secondaryButton,
                  styles.flex,
                ]}
              >
                <Text style={styles.secondaryText}>
                  Cancelar
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={
                reportStarted
                  ? onContinueReport
                  : onStartReport
              }
              style={[
                styles.quickButton,
                styles.flex,
              ]}
            >
              <Text style={styles.quickButtonText}>
                {reportStarted
                  ? "Continuar borrador"
                  : "Crear reporte"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Contenido completo del footer */}
      {index > 0 && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </Animated.View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,

      backgroundColor: c.surface,

      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,

      borderWidth: 1,
      borderColor: c.divider,

      overflow: "hidden",

      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: -3,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 12,
    },

    handleArea: {
      minHeight: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    handle: {
      width: 42,
      height: 5,
      borderRadius: 10,
      backgroundColor: c.border,
    },

    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      minHeight: 44,
      gap: 8,
    },

    summaryText: {
      flex: 1,
    },

    title: {
      color: c.text,
      fontSize: 15,
      fontWeight: "700",
    },

    subtitle: {
      color: c.muted,
      fontSize: 12,
    },


    quickActions: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
    },

    flex: {
      flex: 1,
    },

    quickButton: {
      minHeight: 44,
      backgroundColor: c.action,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
    },

    quickButtonText: {
      color: c.onAction,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },

    secondaryButton: {
      minHeight: 44,
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
    },

    secondaryText: {
      color: c.text,
      fontSize: 13,
      fontWeight: "700",
    },

    disabled: {
      opacity: 0.5,
    },

    content: {
      flex: 1,
      minHeight: 0,
    },
  });
}
