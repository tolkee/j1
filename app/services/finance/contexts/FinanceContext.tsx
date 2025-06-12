import React, { createContext, useContext, ReactNode } from "react";
import { useFinanceAuth } from "../hooks/useFinanceAuth";
import { FinanceSetupStatus } from "../../../common/types/finance";

interface FinanceContextType {
  isAuthenticated: boolean;
  isFinanceSetup: boolean;
  setupStatus: FinanceSetupStatus | undefined;
  hasAccounts: boolean;
  hasCategories: boolean;
  hasTransactions: boolean;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const financeAuth = useFinanceAuth();

  const contextValue: FinanceContextType = {
    isAuthenticated: financeAuth.isAuthenticated,
    isFinanceSetup: financeAuth.isFinanceSetup,
    setupStatus: financeAuth.setupStatus,
    hasAccounts: financeAuth.hasAccounts,
    hasCategories: financeAuth.hasCategories,
    hasTransactions: financeAuth.hasTransactions,
    isLoading: financeAuth.isLoading,
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
