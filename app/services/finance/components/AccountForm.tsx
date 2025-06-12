import React, { useState, useEffect } from "react";
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  Switch,
  TextArea,
  ScrollView,
  Card,
  H3,
  Separator,
  Label,
} from "tamagui";
import {
  Wallet,
  Building,
  CreditCard,
  PiggyBank,
  Coins,
  DollarSign,
  Landmark,
  Smartphone,
} from "@tamagui/lucide-icons";
import { GenericId as Id } from "convex/values";
import { CURRENCY_OPTIONS, getCurrencySymbol } from "../lib/formatCurrency";

// Account icon options
export const ACCOUNT_ICONS = [
  { id: "wallet", name: "Wallet", icon: Wallet },
  { id: "bank", name: "Bank Account", icon: Building },
  { id: "credit-card", name: "Credit Card", icon: CreditCard },
  { id: "savings", name: "Savings", icon: PiggyBank },
  { id: "cash", name: "Cash", icon: Coins },
  { id: "investment", name: "Investment", icon: DollarSign },
  { id: "loan", name: "Loan Account", icon: Landmark },
  { id: "digital", name: "Digital Wallet", icon: Smartphone },
];

interface AccountData {
  _id?: Id<"bankAccounts">;
  name: string;
  description?: string;
  icon: string;
  currentAmount?: number;
  defaultValue: number;
  currency?: "USD" | "EUR";
  isDefault?: boolean;
}

interface AccountFormProps {
  mode: "create" | "edit";
  initialData?: AccountData;
  onSubmit: (data: {
    name: string;
    description?: string;
    icon: string;
    defaultValue: number;
    currency: "USD" | "EUR";
  }) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AccountForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "wallet",
    defaultValue: initialData?.defaultValue || 0,
    currency: (initialData?.currency || "USD") as "USD" | "EUR",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Account name must be at least 2 characters";
    }

    if (isNaN(formData.defaultValue)) {
      newErrors.defaultValue = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        defaultValue: formData.defaultValue,
        currency: formData.currency,
      });

      if (result.success) {
        // Form will be closed by parent component
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIcon = ACCOUNT_ICONS.find((icon) => icon.id === formData.icon);
  const currencySymbol = getCurrencySymbol(formData.currency);

  return (
    <ScrollView flex={1} padding="$4">
      <YStack gap="$4">
        <YStack gap="$2">
          <H3>{mode === "create" ? "Create New Account" : "Edit Account"}</H3>
          <Text color="$color11" fontSize="$3">
            {mode === "create"
              ? "Add a new account to track your finances"
              : "Update your account details"}
          </Text>
        </YStack>

        <Separator />

        {/* Account Name */}
        <YStack gap="$2">
          <Label htmlFor="account-name">Account Name *</Label>
          <Input
            id="account-name"
            value={formData.name}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, name: text }))
            }
            placeholder="e.g., Main Checking, Savings Account"
            borderColor={errors.name ? "$red8" : "$borderColor"}
          />
          {errors.name && (
            <Text color="$red10" fontSize="$2">
              {errors.name}
            </Text>
          )}
        </YStack>

        {/* Account Description */}
        <YStack gap="$2">
          <Label htmlFor="account-description">Description (Optional)</Label>
          <TextArea
            id="account-description"
            value={formData.description}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, description: text }))
            }
            placeholder="Brief description of this account"
            numberOfLines={3}
          />
        </YStack>

        {/* Currency Selection */}
        <YStack gap="$2">
          <Label>Currency</Label>
          <XStack gap="$3">
            {CURRENCY_OPTIONS.map((option) => {
              const isSelected = formData.currency === option.value;

              return (
                <Card
                  key={option.value}
                  padding="$3"
                  backgroundColor={isSelected ? "$blue3" : "$background"}
                  borderColor={isSelected ? "$blue8" : "$borderColor"}
                  borderWidth={2}
                  pressStyle={{ scale: 0.95 }}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: option.value,
                    }))
                  }
                  flex={1}
                  alignItems="center"
                  gap="$2"
                >
                  <Text
                    fontSize="$6"
                    fontWeight="bold"
                    color={isSelected ? "$blue10" : "$color"}
                  >
                    {option.symbol}
                  </Text>
                  <Text
                    fontSize="$3"
                    textAlign="center"
                    color={isSelected ? "$blue10" : "$color"}
                    fontWeight={isSelected ? "600" : "400"}
                  >
                    {option.label}
                  </Text>
                </Card>
              );
            })}
          </XStack>
        </YStack>

        {/* Icon Selection */}
        <YStack gap="$3">
          <Label>Account Icon</Label>
          <XStack flexWrap="wrap" gap="$2">
            {ACCOUNT_ICONS.map((iconOption) => {
              const IconComponent = iconOption.icon;
              const isSelected = formData.icon === iconOption.id;

              return (
                <Card
                  key={iconOption.id}
                  padding="$3"
                  backgroundColor={isSelected ? "$blue3" : "$background"}
                  borderColor={isSelected ? "$blue8" : "$borderColor"}
                  borderWidth={2}
                  pressStyle={{ scale: 0.95 }}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, icon: iconOption.id }))
                  }
                  width={100}
                  alignItems="center"
                  gap="$2"
                >
                  <IconComponent
                    size="$1.5"
                    color={isSelected ? "$blue10" : "$color"}
                  />
                  <Text
                    fontSize="$2"
                    textAlign="center"
                    color={isSelected ? "$blue10" : "$color"}
                    numberOfLines={2}
                  >
                    {iconOption.name}
                  </Text>
                </Card>
              );
            })}
          </XStack>
        </YStack>

        {/* Initial Balance */}
        <YStack gap="$2">
          <Label htmlFor="initial-balance">
            {mode === "create" ? "Initial Balance" : "Current Balance"}
          </Label>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$4" color="$color11">
              {currencySymbol}
            </Text>
            <Input
              id="initial-balance"
              flex={1}
              value={formData.defaultValue.toString()}
              onChangeText={(text) => {
                const numValue = parseFloat(text) || 0;
                setFormData((prev) => ({ ...prev, defaultValue: numValue }));
              }}
              placeholder="0.00"
              keyboardType="numeric"
              borderColor={errors.defaultValue ? "$red8" : "$borderColor"}
            />
          </XStack>
          {errors.defaultValue && (
            <Text color="$red10" fontSize="$2">
              {errors.defaultValue}
            </Text>
          )}
          {mode === "create" && (
            <Text color="$color11" fontSize="$2">
              Enter the current balance for this account
            </Text>
          )}
        </YStack>

        <Separator />

        {/* Action Buttons */}
        <XStack gap="$3" justifyContent="flex-end">
          <Button
            variant="outlined"
            onPress={onCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            backgroundColor="$green9"
            color="white"
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
            icon={isSubmitting ? undefined : selectedIcon?.icon}
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Account"
                : "Update Account"}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}
