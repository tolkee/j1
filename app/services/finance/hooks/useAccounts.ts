import { useMutation, useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";

// Account management hooks for finance service

/**
 * Hook to get all user accounts with loading and error states
 */
export function useGetAccounts() {
  const { user } = useAuth();

  const accounts = useQuery(
    api.finance.accounts.getUserAccounts,
    user ? { userId: user._id } : "skip"
  );

  return {
    accounts: accounts || [],
    isLoading: accounts === undefined && !!user,
    isError: false, // Convex handles errors differently
  };
}

/**
 * Hook to create a new account
 */
export function useCreateAccount() {
  const { user } = useAuth();
  const createAccountMutation = useMutation(api.finance.accounts.createAccount);

  const createAccount = async (accountData: {
    name: string;
    description?: string;
    icon: string;
    defaultValue: number;
    currency: "USD" | "EUR";
  }) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const result = await createAccountMutation({
        userId: user._id,
        name: accountData.name,
        description: accountData.description,
        icon: accountData.icon,
        defaultValue: accountData.defaultValue,
        currency: accountData.currency,
      });

      return {
        success: true,
        account: result,
        message: "Account created successfully",
      };
    } catch (error) {
      return {
        success: false,
        account: null,
        message:
          error instanceof Error ? error.message : "Failed to create account",
      };
    }
  };

  return { createAccount };
}

/**
 * Hook to update an existing account
 */
export function useUpdateAccount() {
  const { user } = useAuth();
  const updateAccountMutation = useMutation(api.finance.accounts.updateAccount);

  const updateAccount = async (
    accountId: Id<"bankAccounts">,
    updates: {
      name?: string;
      description?: string;
      icon?: string;
      displayOrder?: number;
    }
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const result = await updateAccountMutation({
        userId: user._id,
        accountId,
        ...updates,
      });

      return {
        success: true,
        account: result,
        message: "Account updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        account: null,
        message:
          error instanceof Error ? error.message : "Failed to update account",
      };
    }
  };

  return { updateAccount };
}

/**
 * Hook to set an account as default
 */
export function useSetDefaultAccount() {
  const { user } = useAuth();
  const setDefaultMutation = useMutation(
    api.finance.accounts.setDefaultAccount
  );

  const setDefaultAccount = async (accountId: Id<"bankAccounts">) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const result = await setDefaultMutation({
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

  return { setDefaultAccount };
}

/**
 * Hook to delete an account
 */
export function useDeleteAccount() {
  const { user } = useAuth();
  const deleteAccountMutation = useMutation(api.finance.accounts.deleteAccount);

  const deleteAccount = async (accountId: Id<"bankAccounts">) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const result = await deleteAccountMutation({
        userId: user._id,
        accountId,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete account",
      };
    }
  };

  return { deleteAccount };
}
