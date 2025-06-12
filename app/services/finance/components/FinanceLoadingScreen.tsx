import React from "react";
import { YStack, Text, Spinner } from "tamagui";

export function FinanceLoadingScreen() {
  return (
    <YStack
      flex={1}
      bg="$background"
      justifyContent="center"
      alignItems="center"
      gap="$4"
      p="$4"
    >
      <Spinner size="large" color="$green9" />
      <Text fontSize="$5" color="$color" textAlign="center">
        Loading Finance Service...
      </Text>
      <Text fontSize="$3" color="$color12" textAlign="center" maxWidth={250}>
        Checking your account setup and loading financial data
      </Text>
    </YStack>
  );
}
