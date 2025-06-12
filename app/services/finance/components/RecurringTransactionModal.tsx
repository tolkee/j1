import React, { useState, useEffect } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  Separator,
  Card,
  ScrollView,
  Switch,
} from "tamagui";
import {
  Calendar,
  Repeat,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
  Minus,
  ChevronDown,
} from "@tamagui/lucide-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modal, Platform, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GenericId as Id } from "convex/values";
import {
  useRecurringTransactionForm,
  useCreateRecurringTransaction,
  RecurringTransactionFrequency,
  recurringTransactionUtils,
} from "../hooks/useRecurringTransactions";
import { useGetAccounts } from "../hooks/useAccounts";
import { useGetCategories } from "../hooks/useCategories";
import { DropdownSelect } from "./DropdownSelect";
import { formatCurrency } from "../lib/formatCurrency";

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: Id<"bankAccounts">;
  onSuccess?: () => void;
}

export function RecurringTransactionModal({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}: RecurringTransactionModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const {
    accountId: selectedAccountId,
    categoryId,
    amount,
    description,
    frequency,
    nextExecutionDate,
    endDate,
    setAccountId,
    setCategoryId,
    setAmount,
    setDescription,
    setFrequency,
    setNextExecutionDate,
    setEndDate,
    resetForm,
    canSubmit,
    validationErrors,
    getFormData,
  } = useRecurringTransactionForm({ accountId });

  const { createRecurringTransaction, isCreating, error } =
    useCreateRecurringTransaction();
  const { accounts } = useGetAccounts();
  const { categories } = useGetCategories();

  // Set default dates to today on mount
  useEffect(() => {
    if (!nextExecutionDate) {
      setNextExecutionDate(new Date());
    }
  }, [nextExecutionDate, setNextExecutionDate]);

  // Update form when suggested dates change based on frequency
  useEffect(() => {
    const suggested = recurringTransactionUtils.getSuggestedDates(frequency);
    if (!nextExecutionDate || nextExecutionDate <= new Date()) {
      setNextExecutionDate(suggested.nextExecution);
    }
  }, [frequency, nextExecutionDate, setNextExecutionDate]);

  const handleClose = () => {
    resetForm();
    setShowAdvanced(false);
    setIsSubmitting(false);
    setTransactionType("expense");
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    onClose();
  };

  const handleSubmit = async () => {
    const formData = getFormData();
    if (!formData) return;

    // Apply transaction type to amount
    const adjustedAmount =
      transactionType === "income"
        ? Math.abs(parseFloat(amount || "0"))
        : -Math.abs(parseFloat(amount || "0"));

    const finalFormData = {
      ...formData,
      amount: adjustedAmount,
    };

    setIsSubmitting(true);
    try {
      await createRecurringTransaction(finalFormData);
      onSuccess?.();
      handleClose();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((acc) => acc._id === selectedAccountId);

  const frequencyOptions: {
    value: RecurringTransactionFrequency;
    label: string;
  }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <YStack
          flex={1}
          backgroundColor="$background"
          paddingTop={insets.top}
          paddingBottom={insets.bottom}
        >
          {/* Header */}
          <XStack
            alignItems="center"
            justifyContent="center"
            padding="$3"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <H4>Add Recurring Transaction</H4>
          </XStack>

          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$4" padding="$4">
              {/* Error Display */}
              {error && (
                <Card
                  padding="$3"
                  backgroundColor="$red2"
                  borderColor="$red8"
                  borderWidth={1}
                >
                  <XStack alignItems="center" gap="$2">
                    <AlertCircle size="$1" color="$red10" />
                    <Text color="$red10" fontSize="$3">
                      {error}
                    </Text>
                  </XStack>
                </Card>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Card
                  padding="$3"
                  backgroundColor="$yellow2"
                  borderColor="$yellow8"
                  borderWidth={1}
                >
                  <YStack gap="$2">
                    <XStack alignItems="center" gap="$2">
                      <AlertCircle size="$1" color="$yellow10" />
                      <Text color="$yellow10" fontSize="$3" fontWeight="600">
                        Please fix the following issues:
                      </Text>
                    </XStack>
                    {validationErrors.map((error, index) => (
                      <Text
                        key={index}
                        color="$yellow10"
                        fontSize="$3"
                        marginLeft="$4"
                      >
                        • {error}
                      </Text>
                    ))}
                  </YStack>
                </Card>
              )}

              {/* Account Selection */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Account
                </Text>
                <DropdownSelect
                  value={selectedAccountId}
                  onValueChange={(value) =>
                    setAccountId(value as Id<"bankAccounts">)
                  }
                  options={accounts.map((account) => ({
                    id: account._id,
                    label: account.name,
                    icon: account.icon,
                    subtitle: formatCurrency(
                      account.currentAmount,
                      account.currency || "USD"
                    ),
                  }))}
                  placeholder="Select account"
                />
              </YStack>

              {/* Transaction Type Toggle */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Transaction Type
                </Text>
                <XStack gap="$2">
                  <Button
                    flex={1}
                    variant={
                      transactionType === "expense" ? undefined : "outlined"
                    }
                    backgroundColor={
                      transactionType === "expense" ? "$red9" : "transparent"
                    }
                    color={transactionType === "expense" ? "white" : "$color"}
                    onPress={() => setTransactionType("expense")}
                    icon={Minus}
                  >
                    Expense
                  </Button>
                  <Button
                    flex={1}
                    variant={
                      transactionType === "income" ? undefined : "outlined"
                    }
                    backgroundColor={
                      transactionType === "income" ? "$green9" : "transparent"
                    }
                    color={transactionType === "income" ? "white" : "$color"}
                    onPress={() => setTransactionType("income")}
                    icon={Plus}
                  >
                    Income
                  </Button>
                </XStack>
              </YStack>

              {/* Amount Input */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Amount
                </Text>
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$4" color="$color11" minWidth={20}>
                    {selectedAccount?.currency === "EUR" ? "€" : "$"}
                  </Text>
                  <Input
                    flex={1}
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    fontSize="$4"
                  />
                </XStack>
                <Text fontSize="$2" color="$color11">
                  Enter the amount as a positive number
                </Text>
              </YStack>

              {/* Description */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Description
                </Text>
                <Input
                  placeholder="e.g., Monthly salary, Weekly groceries"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={100}
                />
                <Text fontSize="$2" color="$color11">
                  {description.length}/100 characters
                </Text>
              </YStack>

              {/* Category Selection */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Category (Optional)
                </Text>
                <DropdownSelect
                  value={categoryId}
                  onValueChange={(value) =>
                    setCategoryId(value as Id<"categories"> | null)
                  }
                  options={categories.map((category) => ({
                    id: category._id,
                    label: category.name,
                    icon: category.icon,
                    color: category.color,
                  }))}
                  placeholder="Select category"
                  allowClear
                  clearLabel="None"
                />
              </YStack>

              {/* Frequency Selection */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Frequency
                </Text>
                <XStack gap="$2">
                  {frequencyOptions.map((option) => (
                    <Button
                      key={option.value}
                      flex={1}
                      variant={
                        frequency === option.value ? undefined : "outlined"
                      }
                      backgroundColor={
                        frequency === option.value ? "$blue9" : "transparent"
                      }
                      color={frequency === option.value ? "white" : "$color"}
                      onPress={() => setFrequency(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </XStack>
              </YStack>

              {/* Next Execution Date */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">
                  Start Date
                </Text>
                <Button
                  variant="outlined"
                  onPress={() => setShowStartDatePicker(true)}
                  justifyContent="flex-start"
                  icon={Calendar}
                >
                  <Text fontSize="$3">
                    {nextExecutionDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </Button>
                <Text fontSize="$2" color="$color11">
                  The first transaction will be created on this date
                </Text>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={nextExecutionDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setNextExecutionDate(selectedDate);
                      }
                    }}
                  />
                )}
              </YStack>

              {/* Advanced Options Toggle */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$4" fontWeight="600">
                  Advanced Options
                </Text>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </XStack>

              {/* Advanced Options */}
              {showAdvanced && (
                <Card padding="$3" backgroundColor="$color2">
                  <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600">
                      End Date (Optional)
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      Set an end date for this recurring transaction
                    </Text>

                    {endDate ? (
                      <YStack gap="$2">
                        <Button
                          variant="outlined"
                          onPress={() => setShowEndDatePicker(true)}
                          justifyContent="flex-start"
                          icon={Calendar}
                        >
                          <Text fontSize="$3">
                            Ends on{" "}
                            {endDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </Button>
                        <Button
                          size="$3"
                          variant="outlined"
                          color="$red10"
                          onPress={() => setEndDate(null)}
                        >
                          Remove End Date
                        </Button>
                      </YStack>
                    ) : (
                      <Button
                        variant="outlined"
                        onPress={() => {
                          const oneYearFromNow = new Date();
                          oneYearFromNow.setFullYear(
                            oneYearFromNow.getFullYear() + 1
                          );
                          setEndDate(oneYearFromNow);
                        }}
                        icon={Calendar}
                      >
                        Set End Date
                      </Button>
                    )}

                    {showEndDatePicker && endDate && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        minimumDate={nextExecutionDate}
                        onChange={(event, selectedDate) => {
                          setShowEndDatePicker(false);
                          if (selectedDate) {
                            setEndDate(selectedDate);
                          }
                        }}
                      />
                    )}
                  </YStack>
                </Card>
              )}

              <Separator />

              {/* Preview */}
              <Card
                padding="$3"
                backgroundColor="$blue2"
                borderColor="$blue8"
                borderWidth={1}
              >
                <YStack gap="$2">
                  <XStack alignItems="center" gap="$2">
                    <Repeat size="$1" color="$blue10" />
                    <Text fontSize="$4" fontWeight="600" color="$blue10">
                      Transaction Preview
                    </Text>
                  </XStack>

                  {canSubmit ? (
                    <YStack gap="$1">
                      <Text fontSize="$3">
                        <Text
                          fontWeight="600"
                          color={
                            transactionType === "income" ? "$green10" : "$red10"
                          }
                        >
                          {transactionType === "income" ? "+" : "-"}
                          {amount && selectedAccount
                            ? `${selectedAccount.currency === "EUR" ? "€" : "$"}${parseFloat(amount || "0").toFixed(2)}`
                            : `${selectedAccount?.currency === "EUR" ? "€" : "$"}0.00`}
                        </Text>{" "}
                        will be{" "}
                        {transactionType === "income"
                          ? "added to"
                          : "deducted from"}{" "}
                        <Text fontWeight="600">
                          {selectedAccount?.name || "selected account"}
                        </Text>
                      </Text>

                      <Text fontSize="$3">
                        <Text fontWeight="600">
                          {recurringTransactionUtils.formatFrequency(frequency)}
                        </Text>{" "}
                        starting {nextExecutionDate.toLocaleDateString()}
                        {endDate && ` until ${endDate.toLocaleDateString()}`}
                      </Text>

                      {description && (
                        <Text fontSize="$3" color="$color11">
                          "{description}"
                        </Text>
                      )}
                    </YStack>
                  ) : (
                    <Text fontSize="$3" color="$color11">
                      Complete the form to see a preview
                    </Text>
                  )}
                </YStack>
              </Card>
            </YStack>
          </ScrollView>

          {/* Action Buttons */}
          <XStack
            gap="$3"
            padding="$4"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <Button
              flex={1}
              variant="outlined"
              onPress={handleClose}
              disabled={isSubmitting || isCreating}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              backgroundColor="$blue9"
              color="white"
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting || isCreating}
            >
              {isSubmitting || isCreating ? "Creating..." : "Create"}
            </Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}
