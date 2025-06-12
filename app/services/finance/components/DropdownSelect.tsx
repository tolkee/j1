import React, { useState, useRef, useEffect } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
} from "tamagui";
import { ChevronDown } from "@tamagui/lucide-icons";
import { TouchableWithoutFeedback, View, Pressable } from "react-native";

interface DropdownOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
}

interface DropdownSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: DropdownOption[];
  placeholder: string;
  allowClear?: boolean;
  clearLabel?: string;
}

export function DropdownSelect({
  value,
  onValueChange,
  options,
  placeholder,
  allowClear = false,
  clearLabel = "None",
}: DropdownSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const selectedOption = options.find(option => option.id === value);

  const handleSelect = (optionValue: string | null) => {
    onValueChange(optionValue);
    setShowDropdown(false);
  };

  // Close dropdown when value changes or when options change
  useEffect(() => {
    setShowDropdown(false);
  }, [value]);

  // For now, let's simplify without the outside click - users can click the button again to close
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <YStack position="relative">
        {/* Trigger Button */}
        <Button
          variant="outlined"
          justifyContent="space-between"
          onPress={toggleDropdown}
          height="$4"
          paddingHorizontal="$3"
        >
          <XStack alignItems="center" gap="$2" flex={1}>
            {selectedOption ? (
              <>
                {selectedOption.color && (
                  <YStack
                    width={24}
                    height={24}
                    backgroundColor={selectedOption.color as any}
                    borderRadius="$2"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$2">
                      {selectedOption.icon || "📁"}
                    </Text>
                  </YStack>
                )}
                {selectedOption.icon && !selectedOption.color && (
                  <Text fontSize="$4">{selectedOption.icon}</Text>
                )}
                <YStack flex={1} alignItems="flex-start">
                  <Text textAlign="left">
                    {selectedOption.label}
                  </Text>
                  {selectedOption.subtitle && (
                    <Text fontSize="$2" color="$color11" textAlign="left">
                      {selectedOption.subtitle}
                    </Text>
                  )}
                </YStack>
              </>
            ) : (
              <Text color="$color11">{placeholder}</Text>
            )}
          </XStack>
          <ChevronDown size="$1" color="$color11" />
        </Button>
        
        {/* Dropdown */}
        {showDropdown && (
          <Card
            position="absolute"
            top="100%"
            marginTop="$2"
            left={0}
            right={0}
            padding="$2"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$4"
            maxHeight={200}
            elevation={2}
            zIndex={1000}
          >
            <ScrollView>
              <YStack gap="$1">
                {/* Clear option */}
                {allowClear && (
                  <Button
                    chromeless
                    justifyContent="flex-start"
                    onPress={() => handleSelect(null)}
                    backgroundColor={!value ? "$blue3" : "transparent"}
                    borderRadius="$2"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                  >
                    <Text>{clearLabel}</Text>
                  </Button>
                )}
                
                {/* Options */}
                {options.map((option) => (
                  <Button
                    key={option.id}
                    chromeless
                    justifyContent="flex-start"
                    onPress={() => handleSelect(option.id)}
                    backgroundColor={value === option.id ? "$blue3" : "transparent"}
                    borderRadius="$2"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                  >
                    <XStack alignItems="center" gap="$2" flex={1}>
                      {option.color && (
                        <YStack
                          width={24}
                          height={24}
                          backgroundColor={option.color as any}
                          borderRadius="$2"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="$2">{option.icon || "📁"}</Text>
                        </YStack>
                      )}
                      {option.icon && !option.color && (
                        <Text fontSize="$4">{option.icon}</Text>
                      )}
                      <YStack flex={1} alignItems="flex-start">
                        <Text textAlign="left">{option.label}</Text>
                        {option.subtitle && (
                          <Text fontSize="$2" color="$color11" textAlign="left">
                            {option.subtitle}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                  </Button>
                ))}
              </YStack>
            </ScrollView>
          </Card>
        )}
    </YStack>
  );
}