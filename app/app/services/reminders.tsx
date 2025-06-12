import React from "react";
import { View, YStack, Text } from "tamagui";
import { Bell } from "@tamagui/lucide-icons";

export default function RemindersScreen() {
  return (
    <View flex={1} backgroundColor="$background">
      {/* Header */}
      <View
        backgroundColor="$blue8"
        paddingHorizontal="$4"
        paddingVertical="$4"
        paddingTop="$8"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
      >
        <Text fontSize="$8" fontWeight="bold" color="white">
          Reminders & Routines
        </Text>
      </View>

      {/* Content */}
      <YStack
        flex={1}
        paddingHorizontal="$4"
        paddingVertical="$4"
        gap="$4"
        alignItems="center"
        justifyContent="center"
      >
        <View
          width={100}
          height={100}
          backgroundColor="$blue8"
          borderRadius={50}
          alignItems="center"
          justifyContent="center"
          marginBottom="$4"
        >
          <Bell size={50} color="white" strokeWidth={2} />
        </View>

        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          Reminders & Routines
        </Text>
        <Text fontSize="$4" color="$color" textAlign="center" maxWidth={300}>
          Flexible scheduling (cron-like, natural language, location-based).
          Smart notifications with snooze/skip logging.
        </Text>
      </YStack>
    </View>
  );
}
