import React from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { XStack, YStack, Text, View } from "tamagui";
import * as Icons from "@tamagui/lucide-icons";
import { ServiceNode as ServiceNodeType } from "../../types/types";
import { useServiceNodeAnimation } from "../../hooks/useServiceNodeAnimation";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ServiceNodeProps {
  node: ServiceNodeType;
  onPress: (service: ServiceNodeType) => void;
  isPressed?: boolean;
  isGesturing?: SharedValue<boolean>;
}

export function ServiceNode({
  node,
  onPress,
  isPressed = false,
  isGesturing,
}: ServiceNodeProps) {
  const { scale, opacity, animatePress, animateRelease, animateNavigation } =
    useServiceNodeAnimation();

  // Get the icon component dynamically
  const IconComponent = (Icons as any)[node.service.icon] || Icons.Circle;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePress = () => {
    // Prevent press if gesturing
    if (isGesturing?.value) {
      return;
    }
    animateNavigation(() => {
      onPress(node);
    });
  };

  const handlePressIn = () => {
    // Prevent press animation if gesturing
    if (isGesturing?.value) {
      return;
    }
    animatePress();
  };

  const handlePressOut = () => {
    // Always release the press animation, even if gesturing
    // This prevents icons from getting stuck in pressed state
    animateRelease();
  };

  return (
    <AnimatedPressable
      style={[
        {
          position: "absolute",
          left: node.x - 35, // Center the 70px circle
          top: node.y - 35,
          width: 70,
          height: 70,
        },
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        width={70}
        height={70}
        borderRadius={35}
        backgroundColor={node.service.color as any}
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.3}
        shadowRadius={8}
        style={{
          elevation: 8,
        }}
        alignItems="center"
        justifyContent="center"
      >
        <IconComponent size={30} color="white" strokeWidth={2} />
      </View>
    </AnimatedPressable>
  );
}
