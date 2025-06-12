import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  TextArea,
  ScrollView,
  Card,
  H3,
  Separator,
  Label,
  Spinner,
  AnimatePresence,
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
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { GenericId as Id } from "convex/values";
import { Animated, TextInput } from "react-native";
import { ACCOUNT_ICONS } from "./AccountForm";
import {
  useCreateAccountEnhanced,
  useUpdateAccountEnhanced,
  useGetAccountsEnhanced,
} from "../hooks/useAccountsWithValidation";
import {
  formatCurrency,
  parseCurrencyInput,
  validateAccountForm,
  getErrorsByField,
} from "../lib/validation";

interface AccountData {
  _id?: Id<"bankAccounts">;
  name: string;
  description?: string;
  icon: string;
  currentAmount?: number;
  defaultValue: number;
  isDefault?: boolean;
}

interface EnhancedAccountFormProps {
  mode: "create" | "edit";
  initialData?: AccountData;
  onComplete: () => void;
  onCancel: () => void;
}

export function EnhancedAccountForm({
  mode,
  initialData,
  onComplete,
  onCancel,
}: EnhancedAccountFormProps) {
  const { existingAccountNames } = useGetAccountsEnhanced();
  const {
    createAccount,
    validateInRealTime,
    isLoading: isCreating,
    isValidating,
    validationErrors,
    hasValidated,
  } = useCreateAccountEnhanced();
  const { updateAccount, isLoading: isUpdating } = useUpdateAccountEnhanced();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "wallet",
    defaultValue: initialData?.defaultValue || 0,
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Refs for accessibility
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const balanceInputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Real-time validation with debouncing
  const validationTimerRef = useRef<number | null>(null);

  const debouncedValidation = useCallback(
    (data: typeof formData) => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }

      validationTimerRef.current = setTimeout(() => {
        if (mode === "create") {
          const validation = validateInRealTime(data, existingAccountNames);
          setIsFormValid(validation.isValid);
        } else {
          // For edit mode, filter out current account name
          const filteredNames = existingAccountNames.filter(
            (name) => name !== initialData?.name
          );
          const validation = validateAccountForm(data, filteredNames);
          const errorMap = getErrorsByField(validation.errors);
          setLocalErrors(errorMap);
          setIsFormValid(validation.isValid);
        }
      }, 300);
    },
    [mode, existingAccountNames, initialData?.name, validateInRealTime]
  );

  // Effect for animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [fadeAnim, slideAnim]);

  // Real-time validation trigger
  useEffect(() => {
    if (formData.name.length > 0) {
      debouncedValidation(formData);
    }
  }, [formData, debouncedValidation]);

  const currentErrors = mode === "create" ? validationErrors : localErrors;

  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear success state when user makes changes
      if (showSuccess) {
        setShowSuccess(false);
      }
    },
    [showSuccess]
  );

  const handleBalanceChange = useCallback(
    (text: string) => {
      const parsed = parseCurrencyInput(text);
      handleFieldChange("defaultValue", parsed);
    },
    [handleFieldChange]
  );

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      // Focus on first error field
      if (currentErrors.name) {
        nameInputRef.current?.focus();
      } else if (currentErrors.balance) {
        balanceInputRef.current?.focus();
      }
      return;
    }

    const isLoading = isCreating || isUpdating;
    if (isLoading) return;

    try {
      let result;

      if (mode === "create") {
        result = await createAccount(formData, existingAccountNames);
      } else if (initialData?._id) {
        const filteredNames = existingAccountNames.filter(
          (name) => name !== initialData.name
        );
        result = await updateAccount(initialData._id, formData, filteredNames);
      } else {
        throw new Error("No account ID provided for update");
      }

      if (result.success) {
        setShowSuccess(true);
        // Auto-close after success animation
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }, [
    isFormValid,
    currentErrors,
    isCreating,
    isUpdating,
    mode,
    formData,
    existingAccountNames,
    createAccount,
    updateAccount,
    initialData,
    onComplete,
  ]);

  const selectedIcon = ACCOUNT_ICONS.find((icon) => icon.id === formData.icon);
  const isLoading = isCreating || isUpdating;

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ScrollView
        flex={1}
        padding="$4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4">
          {/* Header */}
          <YStack gap="$2">
            <H3 accessibilityRole="header">
              {mode === "create" ? "Create New Account" : "Edit Account"}
            </H3>
            <Text color="$color11" fontSize="$3">
              {mode === "create"
                ? "Add a new account to track your finances"
                : "Update your account details"}
            </Text>
          </YStack>

          <Separator />

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <Card
                animation="bouncy"
                enterStyle={{ opacity: 0, scale: 0.8 }}
                exitStyle={{ opacity: 0, scale: 0.8 }}
                backgroundColor="$green2"
                borderColor="$green8"
                padding="$3"
              >
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size="$1" color="$green10" />
                  <Text color="$green11" fontWeight="600">
                    {mode === "create"
                      ? "Account created successfully!"
                      : "Account updated successfully!"}
                  </Text>
                </XStack>
              </Card>
            )}
          </AnimatePresence>

          {/* Account Name */}
          <YStack gap="$2">
            <Label
              htmlFor="account-name"
              fontSize="$3"
              fontWeight="600"
              accessibilityLabel="Account name, required field"
            >
              Account Name *
            </Label>
            <Input
              ref={nameInputRef}
              id="account-name"
              value={formData.name}
              onChangeText={(text) => handleFieldChange("name", text)}
              placeholder="e.g., Main Checking, Savings Account"
              borderColor={
                currentErrors.name
                  ? "$red8"
                  : isFormValid && hasValidated
                    ? "$green8"
                    : "$borderColor"
              }
              accessible={true}
              accessibilityLabel="Account name input"
              accessibilityHint="Enter a unique name for your account"
              returnKeyType="next"
              onSubmitEditing={() => descriptionInputRef.current?.focus()}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {currentErrors.name && (
              <XStack alignItems="center" gap="$2">
                <AlertCircle size="$0.75" color="$red10" />
                <Text
                  color="$red10"
                  fontSize="$2"
                  accessible={true}
                  accessibilityRole="alert"
                >
                  {currentErrors.name}
                </Text>
              </XStack>
            )}
            {!currentErrors.name &&
              isFormValid &&
              hasValidated &&
              formData.name.length > 0 && (
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size="$0.75" color="$green10" />
                  <Text color="$green10" fontSize="$2">
                    Account name is available
                  </Text>
                </XStack>
              )}
          </YStack>

          {/* Account Description */}
          <YStack gap="$2">
            <Label htmlFor="account-description" fontSize="$3" fontWeight="600">
              Description (Optional)
            </Label>
            <TextArea
              ref={descriptionInputRef}
              id="account-description"
              value={formData.description}
              onChangeText={(text) => handleFieldChange("description", text)}
              placeholder="Brief description of this account"
              numberOfLines={3}
              accessible={true}
              accessibilityLabel="Account description input"
              accessibilityHint="Enter an optional description for your account"
              returnKeyType="next"
              onSubmitEditing={() => balanceInputRef.current?.focus()}
            />
            {currentErrors.description && (
              <XStack alignItems="center" gap="$2">
                <AlertCircle size="$0.75" color="$red10" />
                <Text color="$red10" fontSize="$2">
                  {currentErrors.description}
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Icon Selection */}
          <YStack gap="$3">
            <Label fontSize="$3" fontWeight="600">
              Account Icon
            </Label>
            <Text
              fontSize="$2"
              color="$color11"
              accessibilityLabel="Choose an icon for your account"
            >
              Choose an icon that represents your account type
            </Text>
            <XStack flexWrap="wrap" gap="$2" accessibilityRole="radiogroup">
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
                    onPress={() => handleFieldChange("icon", iconOption.id)}
                    width={100}
                    alignItems="center"
                    gap="$2"
                    accessible={true}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${iconOption.name} icon${isSelected ? ", selected" : ""}`}
                    accessibilityHint={`Select ${iconOption.name} as your account icon`}
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
            <Label htmlFor="initial-balance" fontSize="$3" fontWeight="600">
              {mode === "create" ? "Initial Balance" : "Current Balance"}
            </Label>
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$4" color="$color11">
                $
              </Text>
              <Input
                ref={balanceInputRef}
                id="initial-balance"
                flex={1}
                value={formatCurrency(formData.defaultValue).replace("$", "")}
                onChangeText={handleBalanceChange}
                placeholder="0.00"
                keyboardType="numeric"
                borderColor={currentErrors.balance ? "$red8" : "$borderColor"}
                accessible={true}
                accessibilityLabel={`${mode === "create" ? "Initial" : "Current"} balance input`}
                accessibilityHint="Enter the monetary amount for this account"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </XStack>
            {currentErrors.balance && (
              <XStack alignItems="center" gap="$2">
                <AlertCircle size="$0.75" color="$red10" />
                <Text color="$red10" fontSize="$2">
                  {currentErrors.balance}
                </Text>
              </XStack>
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
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Cancel account form"
              accessibilityHint="Cancel creating or editing this account"
            >
              Cancel
            </Button>
            <Button
              backgroundColor="$green9"
              color="white"
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              icon={isLoading ? undefined : selectedIcon?.icon}
              accessible={true}
              accessibilityLabel={
                mode === "create" ? "Create account" : "Update account"
              }
              accessibilityHint={
                isFormValid
                  ? `${mode === "create" ? "Create" : "Update"} this account with the entered information`
                  : "Please fix form errors before submitting"
              }
            >
              {isLoading ? (
                <XStack alignItems="center" gap="$2">
                  <Spinner color="white" size="small" />
                  <Text color="white">
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </Text>
                </XStack>
              ) : mode === "create" ? (
                "Create Account"
              ) : (
                "Update Account"
              )}
            </Button>
          </XStack>

          {/* Validation Status */}
          {isValidating && (
            <XStack
              alignItems="center"
              justifyContent="center"
              gap="$2"
              padding="$2"
            >
              <Spinner size="small" />
              <Text fontSize="$2" color="$color11">
                Validating...
              </Text>
            </XStack>
          )}
        </YStack>
      </ScrollView>
    </Animated.View>
  );
}
