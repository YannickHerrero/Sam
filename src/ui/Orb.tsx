import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

const COLORS: Record<OrbState, [string, string]> = {
  idle: ["#3a86ff", "#1a3a7a"],
  listening: ["#ff5e8a", "#7a1a3a"],
  thinking: ["#bd5cff", "#3a1a6a"],
  speaking: ["#ffb45e", "#7a4a1a"],
};

const PULSE: Record<OrbState, { duration: number; amplitude: number }> = {
  idle: { duration: 2400, amplitude: 0.04 },
  listening: { duration: 700, amplitude: 0.12 },
  thinking: { duration: 1600, amplitude: 0.06 },
  speaking: { duration: 380, amplitude: 0.18 },
};

interface OrbProps {
  state: OrbState;
  size?: number;
}

export function Orb({ state, size = 160 }: OrbProps) {
  const pulse = useSharedValue(0);
  const colorMix = useSharedValue(0);

  useEffect(() => {
    const cfg = PULSE[state];
    pulse.value = withRepeat(
      withTiming(1, { duration: cfg.duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    colorMix.value = withTiming(1, { duration: 600 });
    return () => {
      colorMix.value = 0;
    };
  }, [state, pulse, colorMix]);

  const innerStyle = useAnimatedStyle(() => {
    const cfg = PULSE[state];
    const scale = 1 + pulse.value * cfg.amplitude;
    const bg = interpolateColor(colorMix.value, [0, 1], [COLORS.idle[0], COLORS[state][0]]);
    return { transform: [{ scale }], backgroundColor: bg };
  });

  const outerStyle = useAnimatedStyle(() => {
    const cfg = PULSE[state];
    const scale = 1 + pulse.value * cfg.amplitude * 1.6;
    const bg = interpolateColor(colorMix.value, [0, 1], [COLORS.idle[1], COLORS[state][1]]);
    return { transform: [{ scale }], backgroundColor: bg };
  });

  return (
    <View style={[styles.wrap, { width: size * 1.6, height: size * 1.6 }]}>
      <Animated.View
        style={[
          styles.outer,
          { width: size * 1.4, height: size * 1.4, borderRadius: size * 0.7 },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.inner,
          { width: size, height: size, borderRadius: size / 2 },
          innerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  outer: {
    position: "absolute",
    opacity: 0.35,
  },
  inner: {
    shadowColor: "#fff",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
});
