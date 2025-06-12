import React from "react";
import { View } from "tamagui";
import { CloudView } from "../common/components/CloudView/CloudView";
import { FloatingUserControls } from "../common/components/FloatingUserControls/FloatingUserControls";
import { useHomeScreen } from "../common/hooks/useHomeScreen";

export default function HomeScreen() {
  const { services: cloudServices, handleServicePress } = useHomeScreen();

  return (
    <View flex={1} background="$background">
      {/* Cloud interface with services */}
      <CloudView services={cloudServices} onServicePress={handleServicePress} />

      {/* Floating user controls */}
      <FloatingUserControls />
    </View>
  );
}
