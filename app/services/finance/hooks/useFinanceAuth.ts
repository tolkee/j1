import { useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../auth/contexts/AuthContext";

export function useFinanceAuth() {
  const { user } = useAuth();

  const setupStatus = useQuery(
    api.finance.setup.getFinanceSetupStatus,
    user ? { userId: user._id } : "skip"
  );

  return {
    isAuthenticated: !!user,
    user,
    setupStatus,
    isFinanceSetup: setupStatus?.isSetup ?? false,
    hasAccounts: setupStatus?.hasAccounts ?? false,
    hasCategories: setupStatus?.hasCategories ?? false,
    hasTransactions: setupStatus?.hasTransactions ?? false,
    isLoading: setupStatus === undefined && !!user,
  };
}
