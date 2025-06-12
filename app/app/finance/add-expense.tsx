import React, { useState, useEffect, useMemo } from "react";
import {
  YStack,
  XStack,
  Button,
  Text,
  TextArea,
  ScrollView,
  Input,
} from "tamagui";
import { ArrowLeft, Check, AlertCircle, Plus } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Import our custom components and hooks
import { DropdownSelect } from "../../services/finance/components/DropdownSelect";
import { CategoryCreationModal } from "../../services/finance/components/CategoryCreationModal";
import { useQuickExpense } from "../../services/finance/hooks/useTransactions";
import { useGetCategories } from "../../services/finance/hooks/useCategories";
import { useSmartDefaults } from "../../services/finance/hooks/useTransactions";
import { useGetAccounts } from "../../services/finance/hooks/useAccounts";
import { getCurrencySymbol } from "../../services/finance/lib/formatCurrency";
import { GenericId as Id } from "convex/values";

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Get the accountId from route parameters (passed from finance home)
  const contextAccountId = useMemo(
    () => params.accountId as Id<"bankAccounts"> | undefined,
    [params.accountId]
  );

  // Quick expense flow state
  const {
    amount,
    selectedAccountId,
    selectedCategoryId,
    description,
    setAmount,
    setSelectedAccountId,
    setSelectedCategoryId,
    setDescription,
    submitExpense,
    isSubmitting,
    canProceed,
    validationErrors,
    error,
    retryCount,
    maxRetries,
    resetForm,
  } = useQuickExpense();

  // Data hooks
  const {
    categories,
    recentCategories,
    isLoading: categoriesLoading,
  } = useGetCategories();
  const { getSmartDefaults, getDescriptionSuggestions, defaultAccount } =
    useSmartDefaults();
  const { accounts } = useGetAccounts();

  // Get the current account
  const currentAccount = accounts.find((acc) => acc._id === selectedAccountId);

  // Set smart defaults when component mounts
  useEffect(() => {
    // Set account from context or default
    if (!selectedAccountId && (contextAccountId || defaultAccount)) {
      const targetAccountId = contextAccountId || defaultAccount?._id;
      if (targetAccountId) {
        setSelectedAccountId(targetAccountId);
      }
    }

    // Set smart category suggestion if available
    if (!selectedCategoryId) {
      const defaults = getSmartDefaults({
        timeOfDay: Date.now(),
        amount: amount ? parseFloat(amount) : undefined,
      });

      if (defaults.categoryId) {
        setSelectedCategoryId(defaults.categoryId);
      }
    }
  }, [
    contextAccountId,
    defaultAccount,
    selectedAccountId,
    selectedCategoryId,
    amount,
    getSmartDefaults,
    setSelectedAccountId,
    setSelectedCategoryId,
  ]);

  // Reset form when component unmounts
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const handleSave = async () => {
    try {
      await submitExpense();
      router.back(); // Return to finance home
    } catch (err) {
      console.error("Failed to save expense:", err);
    }
  };

  const handleCategoryCreated = (categoryId: string) => {
    setSelectedCategoryId(categoryId as Id<"categories">);
  };

  // No need for full page loading - we'll show nested loading for categories only

  return (
    <YStack
      flex={1}
      bg="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4">
        <Button
          size="$3"
          chromeless
          icon={ArrowLeft}
          onPress={() => router.back()}
        />
        <Text fontSize="$6" fontWeight="600" color="$color">
          Add Expense
        </Text>
        <YStack width="$5" />
      </XStack>

      {/* Single Screen with Amount Input */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Amount Input */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Amount
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$8" fontWeight="bold" color="$color">
                {getCurrencySymbol(currentAccount?.currency)}
              </Text>
              <Input
                size="$8"
                fontSize="$8"
                fontWeight="bold"
                borderWidth={0}
                backgroundColor="transparent"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
                selectTextOnFocus
                autoFocus
                flex={1}
                textAlign="left"
                color="$color"
                placeholderTextColor="$color11"
                accessibilityLabel="Expense amount"
                accessibilityHint="Enter the amount of the expense"
              />
            </XStack>
          </YStack>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <YStack gap="$2">
              {validationErrors.map((error, index) => (
                <Text key={index} fontSize="$3" color="$red10">
                  {error}
                </Text>
              ))}
            </YStack>
          )}

          {/* Category Selection */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Category (Optional)
            </Text>
            <DropdownSelect
              value={selectedCategoryId}
              onValueChange={(value) => setSelectedCategoryId(value as Id<"categories"> | null)}
              options={categories?.map(category => ({
                id: category._id,
                label: category.name,
                icon: category.icon,
                color: category.color
              })) || []}
              placeholder={categoriesLoading ? "Loading categories..." : "Select category"}
              allowClear
              clearLabel="None"
            />

            {/* Create New Category Button - Ghost Link */}
            <Button
              chromeless
              size="$2"
              color="$blue10"
              onPress={() => setShowCategoryModal(true)}
              alignSelf="flex-start"
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center" gap="$1.5">
                <Plus size="$0.5" color="$blue10" />
                <Text fontSize="$2" color="$blue10">
                  Create Category
                </Text>
              </XStack>
            </Button>
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Description (optional)
            </Text>
            <Input
              size="$4"
              placeholder="What was this expense for?"
              value={description}
              onChangeText={setDescription}
              backgroundColor="$background"
              borderColor="$borderColor"
              borderRadius="$4"
              maxLength={100}
              accessibilityLabel="Expense description"
              accessibilityHint="Optional description for this expense"
            />
            <Text fontSize="$2" color="$color11" textAlign="right">
              {description.length}/100
            </Text>
          </YStack>

          {/* Error Display */}
          {error && (
            <YStack padding="$3" backgroundColor="$red2" borderRadius="$4">
              <Text fontSize="$3" color="$red11">
                {error}
              </Text>
              {retryCount > 0 && (
                <Text fontSize="$2" color="$red10" marginTop="$1">
                  Retry attempt {retryCount} of {maxRetries}
                </Text>
              )}
            </YStack>
          )}

          {/* Save Button */}
          <Button
            size="$5"
            backgroundColor="$green9"
            color="white"
            disabled={!canProceed || isSubmitting}
            opacity={canProceed && !isSubmitting ? 1 : 0.5}
            onPress={handleSave}
            marginTop="$4"
          >
            <XStack alignItems="center" gap="$2">
              <Check size="$1" color="white" />
              <Text fontSize="$4" fontWeight="600" color="white">
                {isSubmitting ? "Saving..." : "Save Expense"}
              </Text>
            </XStack>
          </Button>
        </YStack>
      </ScrollView>

      {/* Category Creation Modal */}
      <CategoryCreationModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </YStack>
  );
}
