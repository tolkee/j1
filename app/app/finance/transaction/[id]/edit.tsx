import React, { useState, useEffect, useMemo } from "react";
import { YStack, XStack, Button, Text, ScrollView, Input } from "tamagui";
import { ArrowLeft, Check, X } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";

// Import our custom components and hooks
import { DropdownSelect } from "../../../../services/finance/components/DropdownSelect";
import { CategoryCreationModal } from "../../../../services/finance/components/CategoryCreationModal";
import { useUpdateTransaction } from "../../../../services/finance/hooks/useTransactions";
import { useGetCategories } from "../../../../services/finance/hooks/useCategories";
import { useGetAccounts } from "../../../../services/finance/hooks/useAccounts";
import { formatCurrency } from "../../../../services/finance/lib/formatCurrency";
import { api } from "../../../../common/lib/api";
import { useAuth } from "../../../../services/auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";

export default function TransactionEditScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const transactionId = params.id as Id<"transactions">;

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] =
    useState<Id<"bankAccounts"> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"categories"> | null>(null);
  const [description, setDescription] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // Data hooks
  const { categories } = useGetCategories();
  const { accounts } = useGetAccounts();
  const { updateTransaction, isUpdating, error } = useUpdateTransaction();

  // Get transaction details
  const transaction = useQuery(
    api.finance.transactions.getTransactionById,
    user && transactionId
      ? {
          transactionId: transactionId,
          userId: user._id,
        }
      : "skip"
  );

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction && !hasChanges) {
      setAmount(Math.abs(transaction.amount).toString());
      setSelectedAccountId(transaction.accountId);
      setSelectedCategoryId(transaction.categoryId || null);
      setDescription(transaction.description || "");
    }
  }, [transaction, hasChanges]);

  // Track if form has changes
  useEffect(() => {
    if (transaction) {
      const amountChanged = Math.abs(transaction.amount).toString() !== amount;
      const accountChanged = transaction.accountId !== selectedAccountId;
      const categoryChanged = transaction.categoryId !== selectedCategoryId;
      const descriptionChanged =
        (transaction.description || "") !== description;

      setHasChanges(
        amountChanged || accountChanged || categoryChanged || descriptionChanged
      );
    }
  }, [transaction, amount, selectedAccountId, selectedCategoryId, description]);

  const isIncome = useMemo(() => {
    return transaction ? transaction.amount > 0 : false;
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    try {
      // Calculate the correct amount (positive for income, negative for expense)
      const numAmount = parseFloat(amount);
      const finalAmount = isIncome ? numAmount : -numAmount;

      await updateTransaction({
        transactionId: transaction._id,
        amount: finalAmount,
        accountId: selectedAccountId || undefined,
        categoryId: selectedCategoryId || undefined,
        description: description.trim(),
      });

      router.back(); // Return to transaction details
    } catch (err) {
      console.error("Failed to update transaction:", err);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleCategoryCreated = (categoryId: string) => {
    setSelectedCategoryId(categoryId as Id<"categories">);
  };

  const canSave = useMemo(() => {
    return (
      hasChanges &&
      amount &&
      amount !== "" &&
      parseFloat(amount) > 0 &&
      selectedAccountId
    );
  }, [hasChanges, amount, selectedAccountId]);

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!amount || amount === "") {
      errors.push("Amount is required");
    } else if (parseFloat(amount) <= 0) {
      errors.push("Amount must be greater than zero");
    } else if (parseFloat(amount) > 999999) {
      errors.push("Amount is too large");
    }

    if (!selectedAccountId) {
      errors.push("Account is required");
    }

    if (description && description.length > 100) {
      errors.push("Description cannot exceed 100 characters");
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

  if (!transaction) {
    return (
      <YStack
        flex={1}
        bg="$background"
        paddingTop={insets.top}
        justifyContent="center"
        alignItems="center"
        gap="$4"
      >
        <Text fontSize="$5" fontWeight="600">
          Transaction not found
        </Text>
        <Button
          onPress={() => router.back()}
          backgroundColor="$blue9"
          color="white"
        >
          Go Back
        </Button>
      </YStack>
    );
  }

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
        <Button size="$3" chromeless icon={ArrowLeft} onPress={handleCancel} />
        <Text fontSize="$6" fontWeight="600" color="$color">
          Edit {isIncome ? "Income" : "Expense"}
        </Text>
        <Button
          size="$3"
          chromeless
          icon={hasChanges ? Check : X}
          color={hasChanges ? "$green10" : "$color9"}
          onPress={hasChanges ? handleSave : handleCancel}
          disabled={!canSave || isUpdating}
        />
      </XStack>

      {/* Form */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Amount Input */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Amount
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text
                fontSize="$8"
                fontWeight="bold"
                color={isIncome ? "$green10" : "$red10"}
              >
                {isIncome ? "+" : "-"}$
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
                color={isIncome ? "$green10" : "$red10"}
                placeholderTextColor={isIncome ? "$green8" : "$red8"}
                accessibilityLabel="Transaction amount"
                accessibilityHint="Enter the transaction amount"
              />
            </XStack>
          </YStack>

          {/* Account Selection */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Account
            </Text>
            <DropdownSelect
              value={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value as Id<"bankAccounts">)}
              options={accounts?.map(account => ({
                id: account._id,
                label: account.name,
                icon: account.icon,
                subtitle: formatCurrency(account.currentAmount, account.currency || "USD")
              })) || []}
              placeholder="Select account"
            />
          </YStack>

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
              placeholder="Select category"
              allowClear
              clearLabel="None"
            />
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Description (optional)
            </Text>
            <Input
              size="$4"
              placeholder="What was this transaction for?"
              value={description}
              onChangeText={setDescription}
              backgroundColor="$background"
              borderColor="$borderColor"
              borderRadius="$4"
              maxLength={100}
              accessibilityLabel="Transaction description"
              accessibilityHint="Optional description for this transaction"
            />
            <Text fontSize="$2" color="$color11" textAlign="right">
              {description.length}/100
            </Text>
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

          {/* Error Display */}
          {error && (
            <YStack padding="$3" backgroundColor="$red2" borderRadius="$4">
              <Text fontSize="$3" color="$red11">
                {error}
              </Text>
            </YStack>
          )}

          {/* Changed Preview */}
          {hasChanges && (
            <YStack padding="$3" backgroundColor="$blue2" borderRadius="$4">
              <Text fontSize="$3" color="$blue11" fontWeight="500">
                Changes will be saved:
              </Text>
              <Text fontSize="$2" color="$blue10" marginTop="$1">
                Amount: {isIncome ? "+" : "-"}$
                {parseFloat(amount || "0").toFixed(2)}
              </Text>
              {selectedAccountId && accounts && (
                <Text fontSize="$2" color="$blue10">
                  Account:{" "}
                  {accounts.find((a) => a._id === selectedAccountId)?.name}
                </Text>
              )}
              {selectedCategoryId && categories && (
                <Text fontSize="$2" color="$blue10">
                  Category:{" "}
                  {categories.find((c) => c._id === selectedCategoryId)?.name}
                </Text>
              )}
              {description && (
                <Text fontSize="$2" color="$blue10">
                  Description: {description}
                </Text>
              )}
            </YStack>
          )}

          {/* Save Button */}
          <Button
            size="$5"
            backgroundColor={isIncome ? "$green9" : "$red9"}
            color="white"
            disabled={!canSave || isUpdating}
            opacity={canSave && !isUpdating ? 1 : 0.5}
            onPress={handleSave}
            marginTop="$4"
          >
            <XStack alignItems="center" gap="$2">
              <Check size="$1" color="white" />
              <Text fontSize="$4" fontWeight="600" color="white">
                {isUpdating ? "Saving..." : "Save Changes"}
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
