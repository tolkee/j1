import React from "react";
import { View, YStack, Text } from "tamagui";
import { Brain } from "@tamagui/lucide-icons";

export default function KnowledgeScreen() {
  return (
    <View flex={1} backgroundColor="$background">
      {/* Header */}
      <View
        backgroundColor="$blue10"
        paddingHorizontal="$4"
        paddingVertical="$4"
        paddingTop="$8"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
      >
        <Text fontSize="$8" fontWeight="bold" color="white">
          Knowledge Base
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
          backgroundColor="$blue10"
          borderRadius={50}
          alignItems="center"
          justifyContent="center"
          marginBottom="$4"
        >
          <Brain size={50} color="white" strokeWidth={2} />
        </View>

        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          Knowledge Base
        </Text>
        <Text fontSize="$4" color="$color" textAlign="center" maxWidth={300}>
          Quick capture (voice/text) of ideas, questions, todos. Semantic search
          & spaced-repetition resurfacing.
        </Text>
      </YStack>
    </View>
  );
}
