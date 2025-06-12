import { useMutation, useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";
import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Transaction management hooks for finance service

/**
 * Hook to create new transactions with optimistic updates
 */
export function useCreateTransaction() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Move useAuth to top level

  const createTransactionMutation = useMutation(
    api.finance.transactions.createTransaction
  );

  const createTransaction = useCallback(
    async (data: {
      accountId: Id<"bankAccounts">;
      amount: number;
      categoryId?: Id<"categories">;
      description?: string;
      date?: number;
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsCreating(true);
      setError(null);

      try {
        // Validate transaction data
        if (data.amount === 0) {
          throw new Error("Amount cannot be zero");
        }

        // Description is optional - allow empty descriptions
        if (data.description) {
          data.description = data.description.trim();
          if (data.description.length > 100) {
            throw new Error("Description cannot exceed 100 characters");
          }
        }

        const result = await createTransactionMutation({
          userId: user._id,
          accountId: data.accountId,
          amount: data.amount, // Use amount as provided (let caller control sign)
          categoryId: data.categoryId,
          description: data.description?.trim() || "",
          date: data.date || Date.now(),
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [createTransactionMutation, user]
  );

  return {
    createTransaction,
    isCreating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook to manage quick expense entry flow state with persistence and optimizations
 */
export function useQuickExpense() {
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] =
    useState<Id<"bankAccounts"> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"categories"> | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const { createTransaction, isCreating, error } = useCreateTransaction();
  const formStateKey = useRef("quick-expense-form-state");
  const maxRetries = 3;

  // Load persisted form state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await AsyncStorage.getItem(formStateKey.current);
        if (persistedState) {
          const state = JSON.parse(persistedState);
          // Only restore if the state is recent (within 24 hours)
          const stateAge = Date.now() - (state.timestamp || 0);
          if (stateAge < 24 * 60 * 60 * 1000) {
            setAmount(state.amount || "");
            setSelectedAccountId(state.selectedAccountId || null);
            setSelectedCategoryId(state.selectedCategoryId || null);
            setDescription(state.description || "");
            setIsFormDirty(true);
          } else {
            // Clear old state
            await AsyncStorage.removeItem(formStateKey.current);
          }
        }
      } catch (error) {
        console.warn("Failed to load persisted form state:", error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist form state when it changes
  useEffect(() => {
    const persistFormState = async () => {
      if (isFormDirty) {
        try {
          const state = {
            amount,
            selectedAccountId,
            selectedCategoryId,
            description,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(
            formStateKey.current,
            JSON.stringify(state)
          );
        } catch (error) {
          console.warn("Failed to persist form state:", error);
        }
      }
    };

    // Debounce persistence to avoid excessive writes
    const timeoutId = setTimeout(persistFormState, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, selectedAccountId, selectedCategoryId, description, isFormDirty]);

  // Clear persisted state when form is reset or submitted successfully
  const clearPersistedState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(formStateKey.current);
      setIsFormDirty(false);
    } catch (error) {
      console.warn("Failed to clear persisted form state:", error);
    }
  }, []);

  // Enhanced setters that mark form as dirty
  const setAmountWithPersistence = useCallback((value: string) => {
    setAmount(value);
    setIsFormDirty(true);
  }, []);

  const setSelectedAccountIdWithPersistence = useCallback(
    (value: Id<"bankAccounts"> | null) => {
      setSelectedAccountId(value);
      setIsFormDirty(true);
    },
    []
  );

  const setSelectedCategoryIdWithPersistence = useCallback(
    (value: Id<"categories"> | null) => {
      setSelectedCategoryId(value);
      setIsFormDirty(true);
    },
    []
  );

  const setDescriptionWithPersistence = useCallback((value: string) => {
    setDescription(value);
    setIsFormDirty(true);
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(async () => {
    setAmount("");
    setSelectedAccountId(null);
    setSelectedCategoryId(null);
    setDescription("");
    setIsSubmitting(false);
    setRetryCount(0);
    await clearPersistedState();
  }, [clearPersistedState]);

  // Submit the expense with retry logic
  const submitExpense = useCallback(async () => {
    if (!selectedAccountId || !amount) {
      throw new Error("Missing required fields");
    }

    setIsSubmitting(true);

    const attemptSubmission = async (attempt: number): Promise<any> => {
      try {
        const result = await createTransaction({
          accountId: selectedAccountId,
          amount: -Math.abs(parseFloat(amount)), // Expenses are negative
          categoryId: selectedCategoryId || undefined,
          description: description.trim(), // Don't use default description
        });

        // Reset form on success
        await resetForm();
        return result;
      } catch (err) {
        if (attempt < maxRetries) {
          setRetryCount(attempt);
          // Exponential backoff: wait 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return attemptSubmission(attempt + 1);
        } else {
          setIsSubmitting(false);
          throw err;
        }
      }
    };

    return attemptSubmission(retryCount);
  }, [
    selectedAccountId,
    amount,
    selectedCategoryId,
    description,
    createTransaction,
    resetForm,
    retryCount,
    maxRetries,
  ]);

  // Validate form
  const canProceed = useCallback(() => {
    return (
      selectedAccountId && amount && amount !== "" && parseFloat(amount) > 0
    );
  }, [amount, selectedAccountId]);

  // Get form validation errors
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];

    if (!amount || amount === "") {
      errors.push("Amount is required");
    } else if (parseFloat(amount) <= 0) {
      errors.push("Amount must be greater than zero");
    } else if (parseFloat(amount) > 999999) {
      errors.push("Amount is too large");
    }

    if (!selectedAccountId) {
      errors.push("Please select an account");
    }

    if (description && description.length > 100) {
      errors.push("Description cannot exceed 100 characters");
    }

    return errors;
  }, [amount, selectedAccountId, description]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (
      isFormDirty &&
      (amount || selectedAccountId || selectedCategoryId || description)
    );
  }, [isFormDirty, amount, selectedAccountId, selectedCategoryId, description]);

  return {
    // Form state
    amount,
    selectedAccountId,
    selectedCategoryId,
    description,

    // Form actions with persistence
    setAmount: setAmountWithPersistence,
    setSelectedAccountId: setSelectedAccountIdWithPersistence,
    setSelectedCategoryId: setSelectedCategoryIdWithPersistence,
    setDescription: setDescriptionWithPersistence,

    // Form management
    resetForm,

    // Submission
    submitExpense,
    isSubmitting: isSubmitting || isCreating,

    // Validation
    canProceed: canProceed(),
    validationErrors: getValidationErrors(),
    error,

    // State management
    hasUnsavedChanges: hasUnsavedChanges(),
    retryCount,
    maxRetries,
    clearPersistedState,
  };
}

/**
 * Hook to get recent transactions for display
 */
export function useRecentTransactions(limit: number = 10) {
  const { user } = useAuth();

  const recentTransactions = useQuery(
    api.finance.transactions.getUserTransactions,
    user
      ? {
          userId: user._id,
          paginationOpts: {
            cursor: null,
            numItems: limit,
          },
        }
      : "skip"
  );

  return {
    transactions: recentTransactions?.page || [],
    isLoading: recentTransactions === undefined && !!user,
    hasMore: recentTransactions ? !recentTransactions.isDone : false,
  };
}

/**
 * Hook to get comprehensive transaction history with filtering and pagination
 */
export function useGetTransactions(options?: {
  accountId?: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
  dateStart?: number;
  dateEnd?: number;
  minAmount?: number;
  maxAmount?: number;
  type?: "all" | "income" | "expense";
  limit?: number;
  cursor?: string | null;
}) {
  const { user } = useAuth();
  const [cursor, setCursor] = useState<string | null>(options?.cursor || null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const transactions = useQuery(
    api.finance.transactions.getUserTransactions,
    user
      ? {
          userId: user._id,
          paginationOpts: {
            cursor: cursor,
            numItems: options?.limit || 50,
          },
        }
      : "skip"
  );

  // Filter transactions based on criteria
  const filteredTransactions = (transactions?.page || []).filter(
    (transaction) => {
      // Account filter
      if (options?.accountId && transaction.accountId !== options.accountId) {
        return false;
      }

      // Category filter
      if (
        options?.categoryId &&
        transaction.categoryId !== options.categoryId
      ) {
        return false;
      }

      // Date range filter
      const transactionDate = transaction.date || transaction._creationTime;
      if (options?.dateStart && transactionDate < options.dateStart) {
        return false;
      }
      if (options?.dateEnd && transactionDate > options.dateEnd) {
        return false;
      }

      // Amount filter
      const amount = Math.abs(transaction.amount);
      if (options?.minAmount && amount < options.minAmount) {
        return false;
      }
      if (options?.maxAmount && amount > options.maxAmount) {
        return false;
      }

      // Type filter
      if (options?.type && options.type !== "all") {
        if (options.type === "income" && transaction.amount <= 0) {
          return false;
        }
        if (options.type === "expense" && transaction.amount >= 0) {
          return false;
        }
      }

      return true;
    }
  );

  const loadMore = useCallback(async () => {
    if (
      transactions?.continueCursor &&
      !transactions.isDone &&
      !isLoadingMore
    ) {
      setIsLoadingMore(true);
      setCursor(transactions.continueCursor);
      // The query will automatically update with the new cursor
      setIsLoadingMore(false);
    }
  }, [transactions, isLoadingMore]);

  const refresh = useCallback(() => {
    setCursor(null);
    setAllTransactions([]);
  }, []);

  return {
    transactions: filteredTransactions,
    isLoading: transactions === undefined && !!user,
    hasMore: transactions ? !transactions.isDone : false,
    loadMore,
    refresh,
    isLoadingMore,
  };
}

/**
 * Hook to update existing transactions
 */
export function useUpdateTransaction() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateTransactionMutation = useMutation(
    api.finance.transactions.updateTransaction
  );

  const updateTransaction = useCallback(
    async (data: {
      transactionId: Id<"transactions">;
      amount?: number;
      categoryId?: Id<"categories">;
      description?: string;
      date?: number;
      accountId?: Id<"bankAccounts">;
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsUpdating(true);
      setError(null);

      try {
        // Validate transaction data
        if (data.amount !== undefined && data.amount === 0) {
          throw new Error("Amount cannot be zero");
        }

        if (data.description && data.description.length > 100) {
          throw new Error("Description cannot exceed 100 characters");
        }

        const { transactionId, ...updateData } = data;
        const result = await updateTransactionMutation({
          userId: user._id,
          transactionId,
          ...updateData,
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateTransactionMutation, user]
  );

  return {
    updateTransaction,
    isUpdating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook to delete transactions
 */
export function useDeleteTransaction() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteTransactionMutation = useMutation(
    api.finance.transactions.deleteTransaction
  );

  const deleteTransaction = useCallback(
    async (transactionId: Id<"transactions">) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsDeleting(true);
      setError(null);

      try {
        const result = await deleteTransactionMutation({
          userId: user._id,
          transactionId,
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTransactionMutation, user]
  );

  return {
    deleteTransaction,
    isDeleting,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook to manage income entry flow state (similar to useQuickExpense but for income)
 */
export function useQuickIncome() {
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] =
    useState<Id<"bankAccounts"> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"categories"> | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const { createTransaction, isCreating, error } = useCreateTransaction();
  const formStateKey = useRef("quick-income-form-state");
  const maxRetries = 3;

  // Load persisted form state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await AsyncStorage.getItem(formStateKey.current);
        if (persistedState) {
          const state = JSON.parse(persistedState);
          // Only restore if the state is recent (within 24 hours)
          const stateAge = Date.now() - (state.timestamp || 0);
          if (stateAge < 24 * 60 * 60 * 1000) {
            setAmount(state.amount || "");
            setSelectedAccountId(state.selectedAccountId || null);
            setSelectedCategoryId(state.selectedCategoryId || null);
            setDescription(state.description || "");
            setIsFormDirty(true);
          } else {
            await AsyncStorage.removeItem(formStateKey.current);
          }
        }
      } catch (error) {
        console.warn("Failed to load persisted form state:", error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist form state when it changes
  useEffect(() => {
    const persistFormState = async () => {
      if (isFormDirty) {
        try {
          const state = {
            amount,
            selectedAccountId,
            selectedCategoryId,
            description,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(
            formStateKey.current,
            JSON.stringify(state)
          );
        } catch (error) {
          console.warn("Failed to persist form state:", error);
        }
      }
    };

    const timeoutId = setTimeout(persistFormState, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, selectedAccountId, selectedCategoryId, description, isFormDirty]);

  // Clear persisted state
  const clearPersistedState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(formStateKey.current);
      setIsFormDirty(false);
    } catch (error) {
      console.warn("Failed to clear persisted form state:", error);
    }
  }, []);

  // Enhanced setters that mark form as dirty
  const setAmountWithPersistence = useCallback((value: string) => {
    setAmount(value);
    setIsFormDirty(true);
  }, []);

  const setSelectedAccountIdWithPersistence = useCallback(
    (value: Id<"bankAccounts"> | null) => {
      setSelectedAccountId(value);
      setIsFormDirty(true);
    },
    []
  );

  const setSelectedCategoryIdWithPersistence = useCallback(
    (value: Id<"categories"> | null) => {
      setSelectedCategoryId(value);
      setIsFormDirty(true);
    },
    []
  );

  const setDescriptionWithPersistence = useCallback((value: string) => {
    setDescription(value);
    setIsFormDirty(true);
  }, []);

  // Reset form
  const resetForm = useCallback(async () => {
    setAmount("");
    setSelectedAccountId(null);
    setSelectedCategoryId(null);
    setDescription("");
    setIsSubmitting(false);
    setRetryCount(0);
    await clearPersistedState();
  }, [clearPersistedState]);

  // Submit income (positive amount)
  const submitIncome = useCallback(async () => {
    if (!selectedAccountId || !amount) {
      throw new Error("Missing required fields");
    }

    setIsSubmitting(true);

    const attemptSubmission = async (attempt: number): Promise<any> => {
      try {
        const result = await createTransaction({
          accountId: selectedAccountId,
          amount: Math.abs(parseFloat(amount)), // Income is positive
          categoryId: selectedCategoryId || undefined,
          description: description.trim(),
        });

        await resetForm();
        return result;
      } catch (err) {
        if (attempt < maxRetries) {
          setRetryCount(attempt);
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return attemptSubmission(attempt + 1);
        } else {
          setIsSubmitting(false);
          throw err;
        }
      }
    };

    return attemptSubmission(retryCount);
  }, [
    selectedAccountId,
    amount,
    selectedCategoryId,
    description,
    createTransaction,
    resetForm,
    retryCount,
    maxRetries,
  ]);

  // Validate form
  const canProceed = useCallback(() => {
    return (
      selectedAccountId && amount && amount !== "" && parseFloat(amount) > 0
    );
  }, [amount, selectedAccountId]);

  // Get form validation errors
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];

    if (!amount || amount === "") {
      errors.push("Amount is required");
    } else if (parseFloat(amount) <= 0) {
      errors.push("Amount must be greater than zero");
    } else if (parseFloat(amount) > 999999) {
      errors.push("Amount is too large");
    }

    if (!selectedAccountId) {
      errors.push("Please select an account");
    }

    if (description && description.length > 100) {
      errors.push("Description cannot exceed 100 characters");
    }

    return errors;
  }, [amount, selectedAccountId, description]);

  return {
    // Form state
    amount,
    selectedAccountId,
    selectedCategoryId,
    description,

    // Form actions with persistence
    setAmount: setAmountWithPersistence,
    setSelectedAccountId: setSelectedAccountIdWithPersistence,
    setSelectedCategoryId: setSelectedCategoryIdWithPersistence,
    setDescription: setDescriptionWithPersistence,

    // Form management
    resetForm,

    // Submission
    submitIncome,
    isSubmitting: isSubmitting || isCreating,

    // Validation
    canProceed: canProceed(),
    validationErrors: getValidationErrors(),
    error,

    // State management
    retryCount,
    maxRetries,
    clearPersistedState,
  };
}

/**
 * Hook for smart defaults based on user behavior
 */
export function useSmartDefaults() {
  const { user } = useAuth();

  // Get user's default account
  const accounts = useQuery(
    api.finance.accounts.getUserAccounts,
    user ? { userId: user._id } : "skip"
  );

  const defaultAccount =
    accounts?.find((account) => account.isDefault) || accounts?.[0];

  // Get recently used categories for suggestions
  const recentTransactions = useQuery(
    api.finance.transactions.getUserTransactions,
    user
      ? {
          userId: user._id,
          paginationOpts: {
            cursor: null,
            numItems: 50, // Increased for better pattern analysis
          },
        }
      : "skip"
  );

  const getSmartDefaults = useCallback(
    (context?: { amount?: number; timeOfDay?: number }) => {
      const defaults = {
        accountId: defaultAccount?._id || null,
        categoryId: null as Id<"categories"> | null,
        description: "",
      };

      if (!recentTransactions?.page) {
        return defaults;
      }

      const transactions = recentTransactions.page;

      // Time-based suggestions
      if (context?.timeOfDay) {
        const hour = new Date(context.timeOfDay).getHours();
        const timeBasedTransactions = transactions.filter((t) => {
          const transactionHour = new Date(
            t.date || t._creationTime
          ).getHours();
          // Match transactions within 2 hours of current time
          return Math.abs(transactionHour - hour) <= 2;
        });

        if (timeBasedTransactions.length > 0) {
          // Get most frequent category for this time
          const categoryFrequency = timeBasedTransactions.reduce(
            (acc, t) => {
              if (t.categoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + 1;
              }
              return acc;
            },
            {} as Record<string, number>
          );

          const mostFrequentCategory = Object.entries(categoryFrequency).sort(
            ([, a], [, b]) => b - a
          )[0];

          if (mostFrequentCategory) {
            defaults.categoryId = mostFrequentCategory[0] as Id<"categories">;
          }
        }
      }

      // Amount-based suggestions
      if (context?.amount && !defaults.categoryId) {
        const amount = context.amount;
        const similarAmountTransactions = transactions.filter((t) => {
          const transactionAmount = Math.abs(t.amount);
          // Find transactions within 20% of the current amount
          const difference = Math.abs(transactionAmount - amount);
          return difference <= amount * 0.2;
        });

        if (similarAmountTransactions.length > 0) {
          // Get most frequent category for similar amounts
          const categoryFrequency = similarAmountTransactions.reduce(
            (acc, t) => {
              if (t.categoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + 1;
              }
              return acc;
            },
            {} as Record<string, number>
          );

          const mostFrequentCategory = Object.entries(categoryFrequency).sort(
            ([, a], [, b]) => b - a
          )[0];

          if (mostFrequentCategory) {
            defaults.categoryId = mostFrequentCategory[0] as Id<"categories">;
          }
        }
      }

      // Fallback to most recent category if no smart match
      if (!defaults.categoryId) {
        const recentCategories = transactions
          .filter((t) => t.categoryId)
          .map((t) => t.categoryId)
          .filter((id, index, arr) => arr.indexOf(id) === index) // unique
          .slice(0, 3);

        if (recentCategories.length > 0) {
          defaults.categoryId = recentCategories[0]!;
        }
      }

      return defaults;
    },
    [defaultAccount, recentTransactions]
  );

  // Get smart description suggestions based on category
  const getDescriptionSuggestions = useCallback(
    (categoryId?: Id<"categories">) => {
      if (!categoryId || !recentTransactions?.page) {
        return [];
      }

      const categoryTransactions = recentTransactions.page
        .filter((t) => t.categoryId === categoryId && t.description)
        .map((t) => t.description)
        .filter((desc, index, arr) => arr.indexOf(desc) === index) // unique
        .slice(0, 5);

      return categoryTransactions;
    },
    [recentTransactions]
  );

  // Get last used account for quick switching
  const getLastUsedAccount = useCallback(() => {
    if (!recentTransactions?.page || recentTransactions.page.length === 0) {
      return defaultAccount?._id || null;
    }

    const lastTransaction = recentTransactions.page[0];
    return lastTransaction.accountId;
  }, [recentTransactions, defaultAccount]);

  return {
    getSmartDefaults,
    getDescriptionSuggestions,
    getLastUsedAccount,
    defaultAccount,
  };
}
