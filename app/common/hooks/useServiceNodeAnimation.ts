import {
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useCallback } from "react";

export function useServiceNodeAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatePress = useCallback(() => {
    "worklet";
    scale.value = withSpring(0.9, {
      damping: 20,
      stiffness: 200,
    });
  }, [scale]);

  const animateRelease = useCallback(() => {
    "worklet";
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 200,
    });
  }, [scale]);

  const animateBounce = useCallback(() => {
    "worklet";
    scale.value = withSpring(
      1.1,
      {
        damping: 15,
        stiffness: 300,
      },
      () => {
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 200,
        });
      }
    );
  }, [scale]);

  const animateNavigation = useCallback(
    (onComplete?: () => void) => {
      "worklet";
      scale.value = withSpring(1.2, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(
        0.8,
        {
          duration: 200,
        },
        () => {
          // Reset after navigation
          scale.value = withSpring(1);
          opacity.value = withTiming(1);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      );
    },
    [scale, opacity]
  );

  const reset = useCallback(() => {
    "worklet";
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  }, [scale, opacity]);

  return {
    scale,
    opacity,
    animatePress,
    animateRelease,
    animateBounce,
    animateNavigation,
    reset,
  };
}
