
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const INITIAL_SCALE_FACTOR = Dimensions.get("screen").height / 90;
const DURATION = 600;

// Tiempo de presentación y desaparición del splash personalizado.
const SPLASH_HOLD_MS = 900;
const SPLASH_FADE_MS = 650;

export function AnimatedSplashOverlay() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [visible, setVisible] = useState(true);

  const started = useRef(false);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!imageLoaded || !layoutReady || started.current) {
      return;
    }

    started.current = true;

    async function startTransition() {
      try {
        // Ocultar splash nativo cuando la imagen ya esté preparada.
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn("No se pudo ocultar el splash nativo:", error);
      }

      opacity.value = withDelay(
        SPLASH_HOLD_MS,
        withTiming(
          0,
          {
            duration: SPLASH_FADE_MS,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            "worklet";

            if (finished) {
              scheduleOnRN(setVisible, false);
            }
          },
        ),
      );
    }

    void startTransition();
  }, [imageLoaded, layoutReady, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.splashOverlay, animatedStyle]}
      onLayout={() => setLayoutReady(true)}
    >
      <Image
        source={require("@/assets/images/splash-full.png")}
        style={styles.splashFullImage}
        contentFit="cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          console.warn("No se pudo cargar splash-full.png");
          setImageLoaded(true);
        }}
      />
    </Animated.View>
  );
}

// Componente animado existente.
// Se conserva para mantener compatibilidad con el proyecto.

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: "0deg" }],
  },
  100: {
    transform: [{ rotateZ: "7200deg" }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View
        entering={glowKeyframe.duration(60 * 1000 * 4)}
        style={styles.glow}
      >
        <Image
          style={styles.glow}
          source={require("@/assets/images/logo-glow.png")}
        />
      </Animated.View>

      <Animated.View
        entering={keyframe.duration(DURATION)}
        style={styles.background}
      />

      <Animated.View
        style={styles.imageContainer}
        entering={logoKeyframe.duration(DURATION)}
      >
        <Image
          style={styles.image}
          source={require("@/assets/images/expo-logo.png")}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#ECE5D2",
    zIndex: 1000,
    elevation: 1000,
  },
  splashFullImage: {
    ...StyleSheet.absoluteFill,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    width: 201,
    height: 201,
    position: "absolute",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage:
      "linear-gradient(180deg, #3C9FFE, #0274DF)",
    width: 128,
    height: 128,
    position: "absolute",
  },
});
