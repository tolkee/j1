import React, { ReactNode } from "react";
import { View, ViewProps } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeAreaViewProps extends ViewProps {
  children: ReactNode;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  customTopPadding?: number;
  customBottomPadding?: number;
}

export function SafeAreaView({
  children,
  edges = ["top", "bottom", "left", "right"],
  customTopPadding,
  customBottomPadding,
  ...viewProps
}: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes("top")
    ? customTopPadding !== undefined
      ? insets.top + customTopPadding
      : insets.top
    : undefined;

  const paddingBottom = edges.includes("bottom")
    ? customBottomPadding !== undefined
      ? insets.bottom + customBottomPadding
      : insets.bottom
    : undefined;

  const paddingLeft = edges.includes("left") ? insets.left : undefined;
  const paddingRight = edges.includes("right") ? insets.right : undefined;

  return (
    <View
      {...viewProps}
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      paddingLeft={paddingLeft}
      paddingRight={paddingRight}
    >
      {children}
    </View>
  );
}
