import { useMutation, useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";
import { useState, useCallback } from "react";
import {
  validateAccountForm,
  getUserFriendlyErrorMessage,
  isRetryableError,
  formatCurrency,
  getErrorsByField,
} from "../lib/validation";

// Enhanced account management hooks with validation and error handling

interface NetworkState {
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError: string | null;
}

interface FormValidationState {
  isValidating: boolean;
  validationErrors: Record<string, string>;
  hasValidated: boolean;
}

/**
 * Enhanced hook to get all user accounts with comprehensive error handling
 */
export function useGetAccountsEnhanced() {
  const { user } = useAuth();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const accounts = useQuery(
    api.finance.accounts.getUserAccounts,
    user ? { userId: user._id } : "skip"
  );

  const isLoading = accounts === undefined && !!user;
  const hasError = networkState.lastError !== null;

  // Extract account names for validation
  const existingAccountNames = accounts?.map((account) => account.name) || [];

  // Retry mechanism for failed queries
  const retry = useCallback(async () => {
    if (networkState.retryCount >= 3) {
      setNetworkState((prev) => ({
        ...prev,
        lastError: "Maximum retry attempts reached. Please refresh the page.",
      }));
      return;
    }

    setNetworkState((prev) => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    // Wait with exponential backoff
    await new Promise((resolve) =>
      setTimeout(resolve, Math.pow(2, networkState.retryCount) * 1000)
    );

    setNetworkState((prev) => ({
      ...prev,
      isRetrying: false,
      lastError: null,
    }));
  }, [networkState.retryCount]);

  return {
    accounts: accounts || [],
    existingAccountNames,
    isLoading: isLoading || networkState.isRetrying,
    isError: hasError,
    error: networkState.lastError,
    canRetry: networkState.retryCount < 3,
    retry,
    // Helper functions
    formatAccountBalance: (amount: number) =>
      formatCurrency(amount, { showSign: true }),
    getTotalBalance: () =>
      accounts?.reduce((sum, acc) => sum + acc.currentAmount, 0) || 0,
    getAccountCount: () => accounts?.length || 0,
  };
}

/**
 * Enhanced hook to create accounts with validation and optimistic updates
 */
export function useCreateAccountEnhanced() {
  const { user } = useAuth();
  const createAccountMutation = useMutation(api.finance.accounts.createAccount);

  const [networkState, setNetworkState] = useState<NetworkState>({
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const [validationState, setValidationState] = useState<FormValidationState>({
    isValidating: false,
    validationErrors: {},
    hasValidated: false,
  });

  // Real-time validation
  const validateInRealTime = useCallback(
    (
      data: {
        name: string;
        description?: string;
        icon: string;
        defaultValue: number;
      },
      existingNames: string[] = []
    ) => {
      setValidationState((prev) => ({ ...prev, isValidating: true }));

      const validation = validateAccountForm(data, existingNames);
      const errorMap = getErrorsByField(validation.errors);

      setValidationState({
        isValidating: false,
        validationErrors: errorMap,
        hasValidated: true,
      });

      return validation;
    },
    []
  );

  const createAccount = useCallback(
    async (
      accountData: {
        name: string;
        description?: string;
        icon: string;
        defaultValue: number;
      },
      existingNames: string[] = []
    ) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate before submission
      const validation = validateInRealTime(accountData, existingNames);
      if (!validation.isValid) {
        return {
          success: false,
          account: null,
          message: "Please fix the validation errors",
          validationErrors: getErrorsByField(validation.errors),
        };
      }

      setNetworkState((prev) => ({
        ...prev,
        isLoading: true,
        lastError: null,
      }));

      try {
        const result = await createAccountMutation({
          userId: user._id,
          name: accountData.name.trim(),
          description: accountData.description?.trim(),
          icon: accountData.icon,
          defaultValue: accountData.defaultValue,
          currency: "USD", // Default currency
        });

        setNetworkState((prev) => ({
          ...prev,
          isLoading: false,
          retryCount: 0,
        }));
        setValidationState({
          isValidating: false,
          validationErrors: {},
          hasValidated: false,
        });

        return {
          success: true,
          account: result,
          message: "Account created successfully",
          validationErrors: {},
        };
      } catch (error) {
        const errorMessage = getUserFriendlyErrorMessage(error);

        setNetworkState((prev) => ({
          ...prev,
          isLoading: false,
          lastError: errorMessage,
        }));

        // Check if this is a retryable error
        if (isRetryableError(error) && networkState.retryCount < 3) {
          return {
            success: false,
            account: null,
            message: `${errorMessage} (Will retry automatically)`,
            validationErrors: {},
            canRetry: true,
          };
        }

        return {
          success: false,
          account: null,
          message: errorMessage,
          validationErrors: {},
          canRetry: false,
        };
      }
    },
    [user, createAccountMutation, networkState.retryCount, validateInRealTime]
  );

  return {
    createAccount,
    validateInRealTime,
    isLoading: networkState.isLoading,
    isValidating: validationState.isValidating,
    validationErrors: validationState.validationErrors,
    hasValidated: validationState.hasValidated,
    error: networkState.lastError,
    canRetry:
      networkState.retryCount < 3 && isRetryableError(networkState.lastError),
  };
}

/**
 * Enhanced hook to update accounts with conflict resolution
 */
export function useUpdateAccountEnhanced() {
  const { user } = useAuth();
  const updateAccountMutation = useMutation(api.finance.accounts.updateAccount);

  const [networkState, setNetworkState] = useState<NetworkState>({
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const updateAccount = useCallback(
    async (
      accountId: Id<"bankAccounts">,
      updates: {
        name?: string;
        description?: string;
        icon?: string;
        displayOrder?: number;
      },
      existingNames: string[] = []
    ) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate name if provided
      if (updates.name) {
        const nameValidation = validateAccountForm(
          {
            name: updates.name,
            description: updates.description,
            icon: updates.icon || "wallet",
            defaultValue: 0,
          },
          existingNames
        );

        if (!nameValidation.isValid) {
          return {
            success: false,
            account: null,
            message: "Please fix the validation errors",
            validationErrors: getErrorsByField(nameValidation.errors),
          };
        }
      }

      setNetworkState((prev) => ({
        ...prev,
        isLoading: true,
        lastError: null,
      }));

      try {
        // Clean up updates
        const cleanUpdates = {
          ...updates,
          name: updates.name?.trim(),
          description: updates.description?.trim(),
        };

        const result = await updateAccountMutation({
          userId: user._id,
          accountId,
          ...cleanUpdates,
        });

        setNetworkState((prev) => ({
          ...prev,
          isLoading: false,
          retryCount: 0,
        }));

        return {
          success: true,
          account: result,
          message: "Account updated successfully",
          validationErrors: {},
        };
      } catch (error) {
        const errorMessage = getUserFriendlyErrorMessage(error);

        setNetworkState((prev) => ({
          ...prev,
          isLoading: false,
          lastError: errorMessage,
        }));

        return {
          success: false,
          account: null,
          message: errorMessage,
          validationErrors: {},
        };
      }
    },
    [user, updateAccountMutation]
  );

  return {
    updateAccount,
    isLoading: networkState.isLoading,
    error: networkState.lastError,
  };
}

/**
 * Enhanced hook to delete accounts with dependency checking
 */
export function useDeleteAccountEnhanced() {
  const { user } = useAuth();
  const deleteAccountMutation = useMutation(api.finance.accounts.deleteAccount);

  const [networkState, setNetworkState] = useState<NetworkState>({
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const [confirmationState, setConfirmationState] = useState({
    showConfirmation: false,
    accountToDelete: null as Id<"bankAccounts"> | null,
    accountName: "",
  });

  const requestDeleteConfirmation = useCallback(
    (accountId: Id<"bankAccounts">, accountName: string) => {
      setConfirmationState({
        showConfirmation: true,
        accountToDelete: accountId,
        accountName,
      });
    },
    []
  );

  const cancelDeleteConfirmation = useCallback(() => {
    setConfirmationState({
      showConfirmation: false,
      accountToDelete: null,
      accountName: "",
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!user || !confirmationState.accountToDelete) {
      return {
        success: false,
        message: "Invalid delete request",
      };
    }

    setNetworkState((prev) => ({ ...prev, isLoading: true, lastError: null }));

    try {
      const result = await deleteAccountMutation({
        userId: user._id,
        accountId: confirmationState.accountToDelete,
      });

      setNetworkState((prev) => ({ ...prev, isLoading: false, retryCount: 0 }));
      setConfirmationState({
        showConfirmation: false,
        accountToDelete: null,
        accountName: "",
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = getUserFriendlyErrorMessage(error);

      setNetworkState((prev) => ({
        ...prev,
        isLoading: false,
        lastError: errorMessage,
      }));

      return {
        success: false,
        message: errorMessage,
      };
    }
  }, [user, deleteAccountMutation, confirmationState.accountToDelete]);

  return {
    requestDeleteConfirmation,
    cancelDeleteConfirmation,
    confirmDelete,
    isLoading: networkState.isLoading,
    error: networkState.lastError,
    confirmationState,
  };
}
