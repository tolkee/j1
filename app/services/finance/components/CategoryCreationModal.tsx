import React, { useState, useCallback } from "react";
import {
  YStack,
  XStack,
  Button,
  Text,
  Input,
  Sheet,
  ScrollView,
} from "tamagui";
import { X } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmojiPicker, { type EmojiType } from "rn-emoji-keyboard";
import { useCreateCategory } from "../hooks/useCategories";
import { DEFAULT_CATEGORY_COLORS } from "services/finance/constants";

interface CategoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (categoryId: string) => void;
}

export const CategoryCreationModal = React.memo(function CategoryCreationModal({
  isOpen,
  onClose,
  onCategoryCreated,
}: CategoryCreationModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🍔");
  const [selectedColor, setSelectedColor] = useState(
    DEFAULT_CATEGORY_COLORS[0]
  );
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const { createCategory, isCreating, error } = useCreateCategory();

  const handleEmojiSelect = (emojiObject: EmojiType) => {
    setSelectedIcon(emojiObject.emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;

    try {
      const result = await createCategory({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });

      onCategoryCreated(result._id);

      // Reset form
      setName("");
      setSelectedIcon("🍔");
      setSelectedColor(DEFAULT_CATEGORY_COLORS[0]);
      setIsEmojiPickerOpen(false);
      onClose();
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to create category:", err);
    }
  }, [
    name,
    selectedIcon,
    selectedColor,
    createCategory,
    onCategoryCreated,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    // Reset form when closing
    setName("");
    setSelectedIcon("🍔");
    setSelectedColor(DEFAULT_CATEGORY_COLORS[0]);
    setIsEmojiPickerOpen(false);
    onClose();
  }, [onClose]);

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      snapPoints={[80]}
      dismissOnSnapToBottom
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
        gap="$4"
      >
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$6" fontWeight="600" color="$color">
            Create Category
          </Text>
          <Button
            size="$3"
            circular
            backgroundColor="transparent"
            onPress={handleClose}
          >
            <X size="$1" color="$color" />
          </Button>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4">
            {/* Category Name Input */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Category Name
              </Text>
              <Input
                size="$4"
                placeholder="Enter category name"
                value={name}
                onChangeText={setName}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderRadius="$4"
                maxLength={30}
              />
              {error && (
                <Text fontSize="$3" color="$red10">
                  {error}
                </Text>
              )}
            </YStack>

            {/* Emoji Selection */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Choose Icon
              </Text>
              <Button
                height={60}
                width={60}
                padding={0}
                backgroundColor={selectedColor as any}
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$4"
                onPress={() => setIsEmojiPickerOpen(true)}
                alignItems="center"
                justifyContent="center"
                pressStyle={{ scale: 0.95 }}
              >
                <Text fontSize="$8">{selectedIcon}</Text>
              </Button>
            </YStack>

            {/* Color Selection */}
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="500" color="$color">
                Choose Color
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {DEFAULT_CATEGORY_COLORS.map((color) => (
                  <Button
                    key={color}
                    size="$4"
                    width={40}
                    height={40}
                    backgroundColor={color as any}
                    borderColor={
                      selectedColor === color ? "$color" : "transparent"
                    }
                    borderWidth={selectedColor === color ? 3 : 0}
                    borderRadius="$12"
                    pressStyle={{
                      scale: 0.9,
                    }}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Create Button */}
        <Button
          size="$5"
          backgroundColor="$green9"
          color="white"
          borderRadius="$4"
          disabled={!name.trim() || isCreating}
          opacity={!name.trim() || isCreating ? 0.5 : 1}
          onPress={handleCreate}
        >
          <Text fontSize="$4" fontWeight="600" color="white">
            {isCreating ? "Creating..." : "Create Category"}
          </Text>
        </Button>
      </Sheet.Frame>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        open={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelected={handleEmojiSelect}
        enableRecentlyUsed
        enableSearchBar
        categoryPosition="top"
      />
    </Sheet>
  );
});
