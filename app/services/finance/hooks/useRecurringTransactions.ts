import { useMutation, useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";
import { useState, useCallback } from "react";

export type RecurringTransactionFrequency = "daily" | "weekly" | "monthly";

export interface CreateRecurringTransactionData {
  accountId: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
  amount: number;
  description: string;
  frequency: RecurringTransactionFrequency;
  nextExecutionDate: number;
  endDate?: number;
}

export interface UpdateRecurringTransactionData {
  recurringTransactionId: Id<"recurringTransactions">;
  accountId?: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
  amount?: number;
  description?: string;
  frequency?: RecurringTransactionFrequency;
  nextExecutionDate?: number;
  endDate?: number;
  isActive?: boolean;
}

/**
 * Hook to fetch recurring transactions for the current user
 */
export function useRecurringTransactions(options?: {
  accountId?: Id<"bankAccounts">;
  isActive?: boolean;
}) {
  const { user } = useAuth();

  const recurringTransactions = useQuery(
    api.finance.recurring.getUserRecurringTransactions,
    user
      ? {
          userId: user._id,
          accountId: options?.accountId,
          isActive: options?.isActive,
        }
      : "skip"
  );

  return {
    recurringTransactions: recurringTransactions || [],
    isLoading: recurringTransactions === undefined && !!user,
  };
}

/**
 * Hook to create new recurring transactions
 */
export function useCreateRecurringTransaction() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createRecurringTransactionMutation = useMutation(
    api.finance.recurring.createRecurringTransaction
  );

  const createRecurringTransaction = useCallback(
    async (data: CreateRecurringTransactionData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsCreating(true);
      setError(null);

      try {
        // Validate data
        if (data.amount === 0) {
          throw new Error("Amount cannot be zero");
        }

        if (!data.description.trim()) {
          throw new Error("Description is required");
        }

        if (data.nextExecutionDate <= Date.now()) {
          throw new Error("Next execution date must be in the future");
        }

        if (data.endDate && data.endDate <= data.nextExecutionDate) {
          throw new Error("End date must be after the next execution date");
        }

        const result = await createRecurringTransactionMutation({
          userId: user._id,
          ...data,
          description: data.description.trim(),
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create recurring transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [createRecurringTransactionMutation, user]
  );

  return {
    createRecurringTransaction,
    isCreating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook to update existing recurring transactions
 */
export function useUpdateRecurringTransaction() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateRecurringTransactionMutation = useMutation(
    api.finance.recurring.updateRecurringTransaction
  );

  const updateRecurringTransaction = useCallback(
    async (data: UpdateRecurringTransactionData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsUpdating(true);
      setError(null);

      try {
        // Validate data
        if (data.amount !== undefined && data.amount === 0) {
          throw new Error("Amount cannot be zero");
        }

        if (data.description !== undefined && !data.description.trim()) {
          throw new Error("Description cannot be empty");
        }

        if (data.nextExecutionDate && data.nextExecutionDate <= Date.now()) {
          throw new Error("Next execution date must be in the future");
        }

        if (
          data.endDate &&
          data.nextExecutionDate &&
          data.endDate <= data.nextExecutionDate
        ) {
          throw new Error("End date must be after the next execution date");
        }

        const result = await updateRecurringTransactionMutation({
          userId: user._id,
          ...data,
          description: data.description?.trim(),
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update recurring transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateRecurringTransactionMutation, user]
  );

  return {
    updateRecurringTransaction,
    isUpdating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook to delete recurring transactions
 */
export function useDeleteRecurringTransaction() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteRecurringTransactionMutation = useMutation(
    api.finance.recurring.deleteRecurringTransaction
  );

  const deleteRecurringTransaction = useCallback(
    async (
      recurringTransactionId: Id<"recurringTransactions">,
      deleteGeneratedTransactions: boolean = false
    ) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsDeleting(true);
      setError(null);

      try {
        const result = await deleteRecurringTransactionMutation({
          userId: user._id,
          recurringTransactionId,
          deleteGeneratedTransactions,
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete recurring transaction";
        setError(errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteRecurringTransactionMutation, user]
  );

  return {
    deleteRecurringTransaction,
    isDeleting,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for recurring transaction form management
 */
export function useRecurringTransactionForm(initialData?: {
  accountId?: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
}) {
  const [accountId, setAccountId] = useState<Id<"bankAccounts"> | null>(
    initialData?.accountId || null
  );
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(
    initialData?.categoryId || null
  );
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<RecurringTransactionFrequency>("monthly");
  const [nextExecutionDate, setNextExecutionDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  );
  const [endDate, setEndDate] = useState<Date | null>(null);

  const resetForm = useCallback(() => {
    setAccountId(initialData?.accountId || null);
    setCategoryId(initialData?.categoryId || null);
    setAmount("");
    setDescription("");
    setFrequency("monthly");
    setNextExecutionDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setEndDate(null);
  }, [initialData]);

  const validateForm = useCallback(() => {
    const errors: string[] = [];

    if (!accountId) {
      errors.push("Please select an account");
    }

    if (!amount || amount === "") {
      errors.push("Amount is required");
    } else if (parseFloat(amount) === 0) {
      errors.push("Amount cannot be zero");
    } else if (isNaN(parseFloat(amount))) {
      errors.push("Amount must be a valid number");
    }

    if (!description.trim()) {
      errors.push("Description is required");
    } else if (description.length > 100) {
      errors.push("Description cannot exceed 100 characters");
    }

    if (nextExecutionDate.getTime() <= Date.now()) {
      errors.push("Next execution date must be in the future");
    }

    if (endDate && endDate.getTime() <= nextExecutionDate.getTime()) {
      errors.push("End date must be after the next execution date");
    }

    return errors;
  }, [accountId, amount, description, nextExecutionDate, endDate]);

  const getFormData = useCallback((): CreateRecurringTransactionData | null => {
    const errors = validateForm();
    if (errors.length > 0 || !accountId) {
      return null;
    }

    return {
      accountId,
      categoryId: categoryId || undefined,
      amount: parseFloat(amount),
      description: description.trim(),
      frequency,
      nextExecutionDate: nextExecutionDate.getTime(),
      endDate: endDate ? endDate.getTime() : undefined,
    };
  }, [accountId, categoryId, amount, description, frequency, nextExecutionDate, endDate, validateForm]);

  const canSubmit = useCallback(() => {
    return validateForm().length === 0;
  }, [validateForm]);

  return {
    // Form state
    accountId,
    categoryId,
    amount,
    description,
    frequency,
    nextExecutionDate,
    endDate,

    // Form actions
    setAccountId,
    setCategoryId,
    setAmount,
    setDescription,
    setFrequency,
    setNextExecutionDate,
    setEndDate,

    // Form management
    resetForm,
    validateForm,
    getFormData,
    canSubmit: canSubmit(),
    validationErrors: validateForm(),
  };
}

/**
 * Utility functions for recurring transactions
 */
export const recurringTransactionUtils = {
  /**
   * Calculate the next execution date based on frequency
   */
  calculateNextExecution: (
    currentDate: Date,
    frequency: RecurringTransactionFrequency
  ): Date => {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  },

  /**
   * Format frequency for display
   */
  formatFrequency: (frequency: RecurringTransactionFrequency): string => {
    const frequencyLabels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return frequencyLabels[frequency];
  },

  /**
   * Format next execution info
   */
  formatNextExecution: (daysUntilNext: number): string => {
    if (daysUntilNext < 0) {
      return "Overdue";
    } else if (daysUntilNext === 0) {
      return "Today";
    } else if (daysUntilNext === 1) {
      return "Tomorrow";
    } else if (daysUntilNext <= 7) {
      return `In ${daysUntilNext} days`;
    } else if (daysUntilNext <= 30) {
      return `In ${Math.round(daysUntilNext / 7)} weeks`;
    } else {
      return `In ${Math.round(daysUntilNext / 30)} months`;
    }
  },

  /**
   * Get suggested default dates based on frequency
   */
  getSuggestedDates: (frequency: RecurringTransactionFrequency) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    switch (frequency) {
      case "daily":
        return {
          nextExecution: tomorrow,
          suggestedEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };
      case "weekly":
        return {
          nextExecution: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
          suggestedEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        };
      case "monthly":
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return {
          nextExecution: nextMonth,
          suggestedEnd: nextYear,
        };
    }
  },
};