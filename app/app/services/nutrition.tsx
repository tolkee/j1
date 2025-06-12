import React from "react";
import { View, YStack, Text } from "tamagui";
import { ChefHat } from "@tamagui/lucide-icons";

export default function NutritionScreen() {
  return (
    <View flex={1} backgroundColor="$background">
      {/* Header */}
      <View
        backgroundColor="$yellow9"
        paddingHorizontal="$4"
        paddingVertical="$4"
        paddingTop="$8"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
      >
        <Text fontSize="$8" fontWeight="bold" color="black">
          Nutrition & Meals
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
          backgroundColor="$yellow9"
          borderRadius={50}
          alignItems="center"
          justifyContent="center"
          marginBottom="$4"
        >
          <ChefHat size={50} color="black" strokeWidth={2} />
        </View>

        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          Nutrition & Meals
        </Text>
        <Text fontSize="$4" color="$color" textAlign="center" maxWidth={300}>
          Store recipes with nutritional metadata. AI-assisted weekly meal plans
          based on dietary goals & pantry inventory. Auto-generated shopping
          lists.
        </Text>
      </YStack>
    </View>
  );
}
