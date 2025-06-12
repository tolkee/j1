import React, { useState } from "react";
import { YStack, XStack, Text, Button, Card, ScrollView, Sheet } from "tamagui";
import { ChevronDown, Plus, Check } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GenericId as Id } from "convex/values";
import { DEFAULT_CATEGORY_COLORS } from "services/finance/constants";

interface Category {
  _id: Id<"categories">;
  name: string;
  icon: string;
  color?: string;
  usageCount: number;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: Id<"categories"> | null;
  onCategorySelect: (categoryId: Id<"categories"> | null) => void;
  onCreateNew: () => void;
  recentCategories?: Category[];
  isLoading?: boolean;
}

export const CategorySelector = React.memo(function CategorySelector({
  categories,
  selectedCategory,
  onCategorySelect,
  onCreateNew,
  recentCategories = [],
  isLoading = false,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedCategoryData = categories.find(
    (cat) => cat._id === selectedCategory
  );

  const renderCategoryItem = (category: Category, isSmall = false) => {
    // Ensure icon is a string and fallback to default if undefined/null
    const iconDisplay =
      category.icon && typeof category.icon === "string" ? category.icon : "📁";
    const color = category.color || DEFAULT_CATEGORY_COLORS[0];

    return (
      <XStack alignItems="center" gap="$2" flex={1}>
        <YStack
          width={isSmall ? 32 : 40}
          height={isSmall ? 32 : 40}
          backgroundColor={color as any}
          borderRadius="$2"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={isSmall ? "$3" : "$4"}>{iconDisplay}</Text>
        </YStack>
        <Text
          fontSize={isSmall ? "$3" : "$4"}
          fontWeight="500"
          color="$color"
          flex={1}
        >
          {category.name}
        </Text>
      </XStack>
    );
  };

  const handleCategorySelect = (categoryId: Id<"categories"> | null) => {
    onCategorySelect(categoryId);
    setOpen(false);
  };

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="600" color="$color">
        Category
      </Text>

      {/* Main Category Selector Button */}
      <Button
        width="100%"
        justifyContent="space-between"
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
        height="$5"
        paddingHorizontal="$3"
        onPress={() => setOpen(true)}
        iconAfter={ChevronDown}
        disabled={isLoading}
      >
        {isLoading ? (
          <Text color="$color11">Loading categories...</Text>
        ) : selectedCategoryData ? (
          renderCategoryItem(selectedCategoryData)
        ) : (
          <Text color="$color11">Select category</Text>
        )}
      </Button>

      {/* Category Selection Sheet */}
      <Sheet
        modal
        open={open}
        onOpenChange={setOpen}
        snapPointsMode="fit"
        dismissOnSnapToBottom
        disableDrag
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.3)"
        />
        <Sheet.Handle />
        <Sheet.Frame
          padding="$4"
          paddingBottom={Math.max(insets.bottom, 16)}
          backgroundColor="$background"
        >
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600" textAlign="center">
              Select Category
            </Text>

            <ScrollView maxHeight={400} showsVerticalScrollIndicator={false}>
              <YStack gap="$3">
                {/* No Category Option */}
                <Button
                  backgroundColor={
                    selectedCategory === null ? "$blue2" : "$background"
                  }
                  borderColor={
                    selectedCategory === null ? "$blue8" : "$borderColor"
                  }
                  borderWidth={1}
                  justifyContent="space-between"
                  onPress={() => handleCategorySelect(null)}
                  height="$5"
                >
                  <XStack alignItems="center" gap="$3" flex={1}>
                    <YStack
                      width={40}
                      height={40}
                      backgroundColor="$color3"
                      borderRadius="$2"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="$4" color="$color10">
                        —
                      </Text>
                    </YStack>
                    <Text fontSize="$4" fontWeight="500" color="$color11">
                      No Category
                    </Text>
                  </XStack>
                  {selectedCategory === null && (
                    <Check size="$1" color="$blue10" />
                  )}
                </Button>

                {/* Category Options */}
                {categories.map((category) => (
                  <Button
                    key={category._id}
                    backgroundColor={
                      selectedCategory === category._id
                        ? "$blue2"
                        : "$background"
                    }
                    borderColor={
                      selectedCategory === category._id
                        ? "$blue8"
                        : "$borderColor"
                    }
                    borderWidth={1}
                    justifyContent="space-between"
                    onPress={() => handleCategorySelect(category._id)}
                    height="$5"
                  >
                    <YStack flex={1}>{renderCategoryItem(category)}</YStack>
                    {selectedCategory === category._id && (
                      <Check size="$1" color="$blue10" />
                    )}
                  </Button>
                ))}
              </YStack>
            </ScrollView>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
});
