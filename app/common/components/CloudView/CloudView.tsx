import React, { useCallback } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { View } from "tamagui";
import { useEqualSpacedLayout } from "../../hooks/useEqualSpacedLayout";
import { ServiceNode } from "../ServiceNode/ServiceNode";
import {
  JarvisService,
  ServiceNode as ServiceNodeType,
} from "../../types/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CloudViewProps {
  services: JarvisService[];
  onServicePress: (service: ServiceNodeType) => void;
}

export function CloudView({ services, onServicePress }: CloudViewProps) {
  // Gesture values with initial closer zoom
  const scale = useSharedValue(0.9); // Start closer
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(0.9); // Save initial scale
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Gesture state tracking
  const isGesturing = useSharedValue(false);

  // Equal spaced layout
  const { nodes } = useEqualSpacedLayout(SCREEN_WIDTH, SCREEN_HEIGHT, services);

  // Reset function
  const resetZoomAndPosition = () => {
    scale.value = withTiming(0.9, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    savedScale.value = 0.9;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isGesturing.value = true;
    })
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(0.3, Math.min(0.9, newScale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      isGesturing.value = false;
    });

  // Pan gesture with boundary constraints
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGesturing.value = true;
    })
    .onUpdate((event) => {
      const newTranslateX = savedTranslateX.value + event.translationX;
      const newTranslateY = savedTranslateY.value + event.translationY;

      // Calculate how many icons would be visible with this translation
      const currentScale = scale.value;
      const iconSize = 70;
      const iconRadius = iconSize / 2;

      // Calculate the center of the screen for scaling calculations
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;

      // Count visible icons with the new translation
      let visibleCount = 0;
      for (const node of nodes) {
        // Calculate position after scaling (around screen center) and translation
        // First apply scaling around center, then translation
        const scaledX = centerX + (node.x - centerX) * currentScale;
        const scaledY = centerY + (node.y - centerY) * currentScale;

        // Then apply translation
        const finalX = scaledX + newTranslateX;
        const finalY = scaledY + newTranslateY;

        // Calculate the actual icon radius after scaling
        const scaledIconRadius = iconRadius * currentScale;

        // Check if icon is FULLY visible within screen bounds
        const leftEdge = finalX - scaledIconRadius;
        const rightEdge = finalX + scaledIconRadius;
        const topEdge = finalY - scaledIconRadius;
        const bottomEdge = finalY + scaledIconRadius;

        const isFullyVisible =
          leftEdge >= 0 &&
          rightEdge <= SCREEN_WIDTH &&
          topEdge >= 0 &&
          bottomEdge <= SCREEN_HEIGHT;

        if (isFullyVisible) {
          visibleCount++;
        }
      }

      // Adjust minimum visible icons based on zoom level
      // At higher zoom, allow fewer icons; at lower zoom, require more
      const minVisibleIcons = Math.max(
        1,
        Math.min(3, Math.round(2 / currentScale))
      );

      // Only allow the translation if it would keep enough icons visible
      if (visibleCount >= minVisibleIcons) {
        translateX.value = newTranslateX;
        translateY.value = newTranslateY;
      }
      // If not enough icons would be visible, keep current translation
    })
    .onEnd((event) => {
      // Save final values
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      isGesturing.value = false;
    });

  // Double tap gesture to reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(resetZoomAndPosition)();
    });

  // Combine gestures
  const composedGestures = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Animated style for the cloud container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleServicePress = useCallback(
    (node: ServiceNodeType) => {
      // Prevent service press during gestures
      if (!isGesturing.value) {
        onServicePress(node);
      }
    },
    [onServicePress]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composedGestures}>
        <View flex={1} backgroundColor="$background">
          <Animated.View
            style={[
              {
                flex: 1,
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              },
              animatedStyle,
            ]}
          >
            {nodes.map((node) => (
              <ServiceNode
                key={node.id}
                node={node}
                onPress={handleServicePress}
                isGesturing={isGesturing}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
