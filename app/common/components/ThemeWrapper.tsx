import React from "react";
import { useTheme } from "tamagui";
import { View } from "tamagui";

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const theme = useTheme();

  // Don't render children until theme is available
  if (!theme) {
    return (
      <View flex={1} background="#ffffff">
        {/* Loading placeholder */}
      </View>
    );
  }

  return <>{children}</>;
}
