import { useQuery, useMutation } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";

/**
 * Hook for managing default account functionality
 */
export function useDefaultAccount() {
  const { user } = useAuth();

  // Get the current default account
  const defaultAccount = useQuery(
    api.finance.accounts.getUserAccounts,
    user ? { userId: user._id } : "skip"
  )?.find((account) => account.isDefault);

  const setDefaultAccountMutation = useMutation(
    api.finance.accounts.setDefaultAccount
  );

  /**
   * Set a specific account as the default
   */
  const setDefaultAccount = async (accountId: Id<"bankAccounts">) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const result = await setDefaultAccountMutation({
        userId: user._id,
        accountId,
      });

      return {
        success: true,
        accounts: result,
        message: "Default account updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        accounts: [],
        message:
          error instanceof Error
            ? error.message
            : "Failed to set default account",
      };
    }
  };

  /**
   * Ensure there's always a default account
   * This should be called when accounts are loaded or modified
   */
  const ensureDefaultAccount = async (
    accounts: Array<{ _id: Id<"bankAccounts">; isDefault: boolean }>
  ) => {
    if (!user || accounts.length === 0) return;

    // Check if there's already a default account
    const hasDefault = accounts.some((account) => account.isDefault);

    if (!hasDefault) {
      // Set the first account as default
      const firstAccount = accounts[0];
      await setDefaultAccount(firstAccount._id);
    }
  };

  /**
   * Handle default account reassignment when an account is deleted
   */
  const handleAccountDeletion = async (
    deletedAccountId: Id<"bankAccounts">,
    remainingAccounts: Array<{ _id: Id<"bankAccounts">; isDefault: boolean }>
  ) => {
    if (!user || remainingAccounts.length === 0) return;

    // Check if the deleted account was the default
    const wasDefault = defaultAccount?._id === deletedAccountId;

    if (wasDefault && remainingAccounts.length > 0) {
      // Set the first remaining account as default
      const newDefaultAccount = remainingAccounts[0];
      await setDefaultAccount(newDefaultAccount._id);
    }
  };

  /**
   * Get the default account ID for use in forms
   */
  const getDefaultAccountId = (): Id<"bankAccounts"> | null => {
    return defaultAccount?._id || null;
  };

  /**
   * Check if a specific account is the default
   */
  const isDefaultAccount = (accountId: Id<"bankAccounts">): boolean => {
    return defaultAccount?._id === accountId;
  };

  return {
    defaultAccount,
    setDefaultAccount,
    ensureDefaultAccount,
    handleAccountDeletion,
    getDefaultAccountId,
    isDefaultAccount,
    hasDefaultAccount: !!defaultAccount,
  };
}

/**
 * Hook for getting the default account in forms and quick operations
 */
export function useDefaultAccountForForms() {
  const { defaultAccount, getDefaultAccountId } = useDefaultAccount();

  return {
    defaultAccountId: getDefaultAccountId(),
    defaultAccountName: defaultAccount?.name || "No default account",
    hasDefault: !!defaultAccount,
  };
}
