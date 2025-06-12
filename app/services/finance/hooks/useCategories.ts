import { useMutation, useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";
import { useState, useCallback, useMemo } from "react";

// Category management hooks for finance service

/**
 * Hook to get all user categories with usage statistics and smart ordering
 */
export function useGetCategories() {
  const { user } = useAuth();

  const userCategories = useQuery(
    api.finance.categories.getUserCategories,
    user ? { userId: user._id } : "skip"
  );

  const defaultCategories = useQuery(
    api.finance.categories.getDefaultCategories,
    {}
  );

  // Sort categories by usage frequency and name
  const sortedCategories = useMemo(() => {
    if (!userCategories) return [];

    return [...userCategories].sort((a, b) => {
      // First sort by usage count (descending)
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      // Then by name (ascending)
      return a.name.localeCompare(b.name);
    });
  }, [userCategories]);

  // Get recently used categories (used in last 30 days)
  const recentCategories = useMemo(() => {
    return sortedCategories.filter((cat) => cat.usageCount > 0).slice(0, 6);
  }, [sortedCategories]);

  return {
    categories: sortedCategories || [],
    recentCategories,
    defaultCategories: defaultCategories || [],
    isLoading: userCategories === undefined && !!user,
    isError: false, // Convex handles errors differently
  };
}

/**
 * Hook to create new categories with validation
 */
export function useCreateCategory() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Move useAuth to top level

  const createCategoryMutation = useMutation(
    api.finance.categories.createCategory
  );

  const createCategory = useCallback(
    async (data: { name: string; icon: string; color?: string }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsCreating(true);
      setError(null);

      try {
        // Validate category name
        if (!data.name || data.name.trim().length < 2) {
          throw new Error("Category name must be at least 2 characters");
        }

        if (data.name.length > 30) {
          throw new Error("Category name cannot exceed 30 characters");
        }

        const result = await createCategoryMutation({
          userId: user._id,
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create category";
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [createCategoryMutation, user]
  );

  return {
    createCategory,
    isCreating,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for category suggestions based on context
 */
export function useCategorySuggestions() {
  const { categories } = useGetCategories();
  const { user } = useAuth();

  // Get recent transactions for pattern analysis
  const recentTransactions = useQuery(
    api.finance.transactions.getUserTransactions,
    user
      ? {
          userId: user._id,
          paginationOpts: {
            cursor: null,
            numItems: 100, // More data for better pattern analysis
          },
        }
      : "skip"
  );

  const getSuggestedCategories = useCallback(
    (context?: {
      amount?: number;
      timeOfDay?: number;
      description?: string;
    }) => {
      if (!categories.length) return [];

      let suggestions = [...categories];
      const transactions = recentTransactions?.page || [];

      // Time-based suggestions with more sophisticated logic
      if (context?.timeOfDay) {
        const hour = new Date(context.timeOfDay).getHours();
        const dayOfWeek = new Date(context.timeOfDay).getDay();

        // Morning suggestions (6-11 AM)
        if (hour >= 6 && hour < 11) {
          const morningCategories = suggestions.filter((cat) =>
            [
              "coffee",
              "breakfast",
              "transport",
              "commute",
              "gas",
              "parking",
            ].some((keyword) => cat.name.toLowerCase().includes(keyword))
          );

          // Also check historical patterns for morning transactions
          const morningTransactions = transactions.filter((t) => {
            const transactionHour = new Date(
              t.date || t._creationTime
            ).getHours();
            return transactionHour >= 6 && transactionHour < 11;
          });

          const morningCategoryIds = morningTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalMorningCategories = suggestions.filter((cat) =>
            morningCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...morningCategories,
            ...historicalMorningCategories.filter(
              (cat) => !morningCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !morningCategories.includes(cat) &&
                !historicalMorningCategories.includes(cat)
            ),
          ];
        }

        // Lunch time suggestions (11 AM - 2 PM)
        else if (hour >= 11 && hour < 14) {
          const lunchCategories = suggestions.filter((cat) =>
            ["lunch", "food", "restaurant", "dining", "meal", "takeout"].some(
              (keyword) => cat.name.toLowerCase().includes(keyword)
            )
          );

          const lunchTransactions = transactions.filter((t) => {
            const transactionHour = new Date(
              t.date || t._creationTime
            ).getHours();
            return transactionHour >= 11 && transactionHour < 14;
          });

          const lunchCategoryIds = lunchTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalLunchCategories = suggestions.filter((cat) =>
            lunchCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...lunchCategories,
            ...historicalLunchCategories.filter(
              (cat) => !lunchCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !lunchCategories.includes(cat) &&
                !historicalLunchCategories.includes(cat)
            ),
          ];
        }

        // Evening suggestions (5-9 PM)
        else if (hour >= 17 && hour < 21) {
          const eveningCategories = suggestions.filter((cat) =>
            [
              "dinner",
              "groceries",
              "shopping",
              "entertainment",
              "movie",
              "drinks",
            ].some((keyword) => cat.name.toLowerCase().includes(keyword))
          );

          const eveningTransactions = transactions.filter((t) => {
            const transactionHour = new Date(
              t.date || t._creationTime
            ).getHours();
            return transactionHour >= 17 && transactionHour < 21;
          });

          const eveningCategoryIds = eveningTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalEveningCategories = suggestions.filter((cat) =>
            eveningCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...eveningCategories,
            ...historicalEveningCategories.filter(
              (cat) => !eveningCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !eveningCategories.includes(cat) &&
                !historicalEveningCategories.includes(cat)
            ),
          ];
        }

        // Weekend vs weekday patterns
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Weekend
          const weekendCategories = suggestions.filter((cat) =>
            [
              "entertainment",
              "leisure",
              "shopping",
              "dining",
              "travel",
              "hobby",
            ].some((keyword) => cat.name.toLowerCase().includes(keyword))
          );

          const weekendTransactions = transactions.filter((t) => {
            const transactionDay = new Date(t.date || t._creationTime).getDay();
            return transactionDay === 0 || transactionDay === 6;
          });

          const weekendCategoryIds = weekendTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalWeekendCategories = suggestions.filter((cat) =>
            weekendCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...weekendCategories,
            ...historicalWeekendCategories.filter(
              (cat) => !weekendCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !weekendCategories.includes(cat) &&
                !historicalWeekendCategories.includes(cat)
            ),
          ];
        }
      }

      // Enhanced amount-based suggestions
      if (context?.amount) {
        const amount = context.amount;

        // Small amounts (< $10) - coffee, snacks, transport
        if (amount < 10) {
          const smallAmountCategories = suggestions.filter((cat) =>
            ["coffee", "snack", "transport", "parking", "tip", "drink"].some(
              (keyword) => cat.name.toLowerCase().includes(keyword)
            )
          );

          // Historical small amount patterns
          const smallAmountTransactions = transactions.filter(
            (t) => Math.abs(t.amount) < 10
          );

          const smallAmountCategoryIds = smallAmountTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalSmallCategories = suggestions.filter((cat) =>
            smallAmountCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...smallAmountCategories,
            ...historicalSmallCategories.filter(
              (cat) => !smallAmountCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !smallAmountCategories.includes(cat) &&
                !historicalSmallCategories.includes(cat)
            ),
          ];
        }

        // Medium amounts ($10-$100) - meals, shopping, services
        else if (amount >= 10 && amount <= 100) {
          const mediumAmountCategories = suggestions.filter((cat) =>
            [
              "food",
              "restaurant",
              "shopping",
              "service",
              "health",
              "beauty",
              "entertainment",
            ].some((keyword) => cat.name.toLowerCase().includes(keyword))
          );

          const mediumAmountTransactions = transactions.filter(
            (t) => Math.abs(t.amount) >= 10 && Math.abs(t.amount) <= 100
          );

          const mediumAmountCategoryIds = mediumAmountTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalMediumCategories = suggestions.filter((cat) =>
            mediumAmountCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...mediumAmountCategories,
            ...historicalMediumCategories.filter(
              (cat) => !mediumAmountCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !mediumAmountCategories.includes(cat) &&
                !historicalMediumCategories.includes(cat)
            ),
          ];
        }

        // Large amounts (> $100) - bills, rent, major purchases
        else if (amount > 100) {
          const largeAmountCategories = suggestions.filter((cat) =>
            [
              "bills",
              "rent",
              "mortgage",
              "insurance",
              "utilities",
              "groceries",
              "shopping",
              "travel",
              "medical",
            ].some((keyword) => cat.name.toLowerCase().includes(keyword))
          );

          const largeAmountTransactions = transactions.filter(
            (t) => Math.abs(t.amount) > 100
          );

          const largeAmountCategoryIds = largeAmountTransactions
            .filter((t) => t.categoryId)
            .map((t) => t.categoryId);

          const historicalLargeCategories = suggestions.filter((cat) =>
            largeAmountCategoryIds.includes(cat._id)
          );

          suggestions = [
            ...largeAmountCategories,
            ...historicalLargeCategories.filter(
              (cat) => !largeAmountCategories.includes(cat)
            ),
            ...suggestions.filter(
              (cat) =>
                !largeAmountCategories.includes(cat) &&
                !historicalLargeCategories.includes(cat)
            ),
          ];
        }
      }

      // Description-based suggestions
      if (context?.description) {
        const description = context.description.toLowerCase();
        const descriptionCategories = suggestions.filter((cat) => {
          const categoryName = cat.name.toLowerCase();
          // Check if category name is mentioned in description
          return (
            description.includes(categoryName) ||
            categoryName.includes(description)
          );
        });

        if (descriptionCategories.length > 0) {
          suggestions = [
            ...descriptionCategories,
            ...suggestions.filter(
              (cat) => !descriptionCategories.includes(cat)
            ),
          ];
        }
      }

      // Return top 8 suggestions with usage-based final sorting
      return suggestions
        .sort((a, b) => {
          // First by usage count (descending)
          if (a.usageCount !== b.usageCount) {
            return b.usageCount - a.usageCount;
          }
          // Then by name (ascending)
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);
    },
    [categories, recentTransactions]
  );

  return {
    getSuggestedCategories,
  };
}

/**
 * Hook to initialize default categories for new users
 */
export function useInitializeCategories() {
  const initializeMutation = useMutation(
    api.finance.categories.initializeDefaultCategories
  );

  const initializeCategories = useCallback(async () => {
    const { user } = useAuth();
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await initializeMutation({ userId: user._id });
  }, [initializeMutation]);

  return {
    initializeCategories,
  };
}
