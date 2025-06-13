import React, { ReactNode } from "react";
import { YStack, YStackProps, View, ViewProps } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeHeaderProps extends Omit<YStackProps, "backgroundColor" | "bg"> {
  children: ReactNode;
  extraTopPadding?: number;
  extraBottomPadding?: number;
  backgroundColor?: ViewProps["backgroundColor"];
  bg?: ViewProps["bg"];
}

export function SafeHeader({
  children,
  extraTopPadding = 16,
  extraBottomPadding = 16,
  backgroundColor,
  bg,
  ...stackProps
}: SafeHeaderProps) {
  const insets = useSafeAreaInsets();
  const bgColor = backgroundColor || bg || undefined;

  return (
    <YStack
      {...stackProps}
      backgroundColor={bgColor}
      paddingTop={insets.top + extraTopPadding}
      paddingBottom={extraBottomPadding}
      paddingHorizontal="$4"
    >
      {children}
    </YStack>
  );
}
