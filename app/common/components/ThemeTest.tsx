import React from "react";
import { View, Text } from "tamagui";

export function ThemeTest() {
  return (
    <View background="$background" style={{ padding: 16 }}>
      <Text color="$color" fontSize="$5" fontWeight="bold">
        Theme Test Component
      </Text>
      <Text color="$color" fontSize="$3" opacity={0.7}>
        Current theme values
      </Text>
      <View background="$gray4" style={{ padding: 8, margin: 8 }}>
        <Text color="$color">Theme background test</Text>
      </View>
    </View>
  );
}
