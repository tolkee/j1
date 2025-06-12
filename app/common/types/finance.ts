import { GenericId as Id } from "convex/values";

export interface BankAccount {
  _id: Id<"bankAccounts">;
  name: string;
  description?: string;
  icon: string;
  currentAmount: number;
  isDefault: boolean;
  displayOrder: number;
}

export interface Transaction {
  _id: Id<"transactions">;
  accountId: Id<"bankAccounts">;
  categoryId: Id<"categories">;
  amount: number;
  description: string;
  date: number;
  isRecurring: boolean;
}

export interface Category {
  _id: Id<"categories">;
  name: string;
  icon: string;
  color: string;
}

export interface FinanceSetupStatus {
  isSetup: boolean;
  hasAccounts: boolean;
  hasCategories: boolean;
  hasTransactions: boolean;
  accountCount: number;
  categoryCount: number;
  transactionCount: number;
  totalBalance: number;
}
