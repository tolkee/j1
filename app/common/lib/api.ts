import { FunctionReference, anyApi } from "convex/server";
import { GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  auth: {
    isAuthenticated: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    signIn: FunctionReference<
      "action",
      "public",
      {
        calledBy?: string;
        params?: any;
        provider?: string;
        refreshToken?: string;
        verifier?: string;
      },
      any
    >;
    signOut: FunctionReference<"action", "public", Record<string, never>, any>;
  };
  messages: {
    getWelcomeMessage: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      { isPersonalized: boolean; message: string }
    >;
    updateWelcomeMessagePreference: FunctionReference<
      "mutation",
      "public",
      {
        customMessage?: string;
        preference:
          | "personalized"
          | "formal"
          | "casual"
          | "motivational"
          | "custom";
        userId: Id<"users">;
      },
      { message: string; success: boolean }
    >;
    setCustomWelcomeMessage: FunctionReference<
      "mutation",
      "public",
      { customMessage: string; userId: Id<"users"> },
      { message: string; success: boolean }
    >;
  };
  users: {
    getAllUsers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"users">;
        createdAt?: number;
        email?: string;
        emailVerified?: number;
        image?: string;
        name?: string;
        preferredName?: string;
        timezone?: string;
        updatedAt?: number;
        welcomeMessagePreference?: string;
      }>
    >;
    getUserSettings: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      {
        _creationTime: number;
        _id: Id<"userSettings">;
        language?: string;
        notificationsEnabled?: boolean;
        theme?: "light" | "dark";
        userId: Id<"users">;
      } | null
    >;
    updateUserSettings: FunctionReference<
      "mutation",
      "public",
      {
        language?: string;
        notificationsEnabled?: boolean;
        theme?: "light" | "dark";
        userId: Id<"users">;
      },
      { message: string; success: boolean }
    >;
    deleteUser: FunctionReference<
      "mutation",
      "public",
      { userId: Id<"users"> },
      { message: string; success: boolean }
    >;
    getCurrentUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      {
        _creationTime: number;
        _id: Id<"users">;
        createdAt?: number;
        email?: string;
        emailVerified?: number;
        image?: string;
        name?: string;
        preferredName?: string;
        timezone?: string;
        updatedAt?: number;
        welcomeMessagePreference?: string;
      } | null
    >;
    updateProfile: FunctionReference<
      "mutation",
      "public",
      {
        name?: string;
        preferredName?: string;
        timezone?: string;
        welcomeMessagePreference?: string;
      },
      any
    >;
    initializeUserData: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
  finance: {
    accounts: {
      getUserAccounts: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        Array<{
          _creationTime: number;
          _id: Id<"bankAccounts">;
          createdAt: number;
          currency?: "USD" | "EUR";
          currentAmount: number;
          defaultValue: number;
          description?: string;
          displayOrder: number;
          icon: string;
          isDefault: boolean;
          name: string;
          updatedAt: number;
          userId: Id<"users">;
        }>
      >;
      getAccountById: FunctionReference<
        "query",
        "public",
        { accountId: Id<"bankAccounts">; userId: Id<"users"> },
        {
          _creationTime: number;
          _id: Id<"bankAccounts">;
          createdAt: number;
          currency?: "USD" | "EUR";
          currentAmount: number;
          defaultValue: number;
          description?: string;
          displayOrder: number;
          icon: string;
          isDefault: boolean;
          name: string;
          transactionCount: number;
          updatedAt: number;
          userId: Id<"users">;
        } | null
      >;
      createAccount: FunctionReference<
        "mutation",
        "public",
        {
          currency: "USD" | "EUR";
          defaultValue: number;
          description?: string;
          icon: string;
          name: string;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"bankAccounts">;
          createdAt: number;
          currency?: "USD" | "EUR";
          currentAmount: number;
          defaultValue: number;
          description?: string;
          displayOrder: number;
          icon: string;
          isDefault: boolean;
          name: string;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      updateAccount: FunctionReference<
        "mutation",
        "public",
        {
          accountId: Id<"bankAccounts">;
          description?: string;
          displayOrder?: number;
          icon?: string;
          name?: string;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"bankAccounts">;
          createdAt: number;
          currency?: "USD" | "EUR";
          currentAmount: number;
          defaultValue: number;
          description?: string;
          displayOrder: number;
          icon: string;
          isDefault: boolean;
          name: string;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      setDefaultAccount: FunctionReference<
        "mutation",
        "public",
        { accountId: Id<"bankAccounts">; userId: Id<"users"> },
        Array<{
          _creationTime: number;
          _id: Id<"bankAccounts">;
          createdAt: number;
          currency?: "USD" | "EUR";
          currentAmount: number;
          defaultValue: number;
          description?: string;
          displayOrder: number;
          icon: string;
          isDefault: boolean;
          name: string;
          updatedAt: number;
          userId: Id<"users">;
        }>
      >;
      deleteAccount: FunctionReference<
        "mutation",
        "public",
        { accountId: Id<"bankAccounts">; userId: Id<"users"> },
        {
          deletedCounts: {
            recurringTransactions: number;
            transactions: number;
          };
          message: string;
          success: boolean;
        }
      >;
    };
    balances: {
      getAccountBalance: FunctionReference<
        "query",
        "public",
        { accountId: Id<"bankAccounts">; userId: Id<"users"> },
        {
          accountId: Id<"bankAccounts">;
          currentAmount: number;
          defaultValue: number;
          lastTransactionDate?: number;
          lastUpdated: number;
          transactionCount: number;
        } | null
      >;
      getUserTotalBalance: FunctionReference<
        "query",
        "public",
        { includeInactive?: boolean; userId: Id<"users"> },
        {
          accountCount: number;
          balanceByAccount: Array<{
            accountId: Id<"bankAccounts">;
            accountName: string;
            balance: number;
            isDefault: boolean;
          }>;
          lastUpdated: number;
          totalBalance: number;
        }
      >;
      getBalanceSummary: FunctionReference<
        "query",
        "public",
        { periodInDays?: number; userId: Id<"users"> },
        {
          accountCount: number;
          averageTransactionAmount: number;
          netFlow: number;
          periodEnd: number;
          periodStart: number;
          totalBalance: number;
          totalExpenses: number;
          totalIncome: number;
          transactionCount: number;
        }
      >;
    };
    categories: {
      getUserCategories: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        Array<{
          _creationTime: number;
          _id: Id<"categories">;
          color: string;
          createdAt: number;
          icon: string;
          isDefault: boolean;
          name: string;
          usageCount: number;
          userId: Id<"users">;
        }>
      >;
      getDefaultCategories: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        Array<{ color: string; icon: string; name: string }>
      >;
      createCategory: FunctionReference<
        "mutation",
        "public",
        { color?: string; icon: string; name: string; userId: Id<"users"> },
        {
          _creationTime: number;
          _id: Id<"categories">;
          color: string;
          createdAt: number;
          icon: string;
          isDefault: boolean;
          name: string;
          userId: Id<"users">;
        }
      >;
      updateCategory: FunctionReference<
        "mutation",
        "public",
        {
          categoryId: Id<"categories">;
          color?: string;
          icon?: string;
          name?: string;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"categories">;
          color: string;
          createdAt: number;
          icon: string;
          isDefault: boolean;
          name: string;
          userId: Id<"users">;
        }
      >;
      deleteCategory: FunctionReference<
        "mutation",
        "public",
        {
          categoryId: Id<"categories">;
          reassignToCategory?: Id<"categories">;
          userId: Id<"users">;
        },
        { message: string; reassignedTransactions: number; success: boolean }
      >;
      initializeDefaultCategories: FunctionReference<
        "mutation",
        "public",
        { userId: Id<"users"> },
        Array<Id<"categories">>
      >;
    };
    transactions: {
      getAccountTransactions: FunctionReference<
        "query",
        "public",
        {
          accountId: Id<"bankAccounts">;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId: Id<"users">;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: Id<"transactions">;
            accountId: Id<"bankAccounts">;
            amount: number;
            categoryColor?: string;
            categoryIcon?: string;
            categoryId?: Id<"categories">;
            categoryName?: string;
            createdAt: number;
            date: number;
            description?: string;
            isRecurring: boolean;
            recurringTransactionId?: Id<"recurringTransactions">;
            updatedAt: number;
            userId: Id<"users">;
          }>;
        }
      >;
      getUserTransactions: FunctionReference<
        "query",
        "public",
        {
          accountId?: Id<"bankAccounts">;
          categoryId?: Id<"categories">;
          endDate?: number;
          maxAmount?: number;
          minAmount?: number;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startDate?: number;
          userId: Id<"users">;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: Id<"transactions">;
            accountId: Id<"bankAccounts">;
            accountName: string;
            amount: number;
            categoryColor?: string;
            categoryIcon?: string;
            categoryId?: Id<"categories">;
            categoryName?: string;
            createdAt: number;
            date: number;
            description?: string;
            isRecurring: boolean;
            recurringTransactionId?: Id<"recurringTransactions">;
            updatedAt: number;
            userId: Id<"users">;
          }>;
        }
      >;
      getTransactionById: FunctionReference<
        "query",
        "public",
        { transactionId: Id<"transactions">; userId: Id<"users"> },
        {
          _creationTime: number;
          _id: Id<"transactions">;
          accountId: Id<"bankAccounts">;
          accountName: string;
          amount: number;
          categoryColor?: string;
          categoryIcon?: string;
          categoryId?: Id<"categories">;
          categoryName?: string;
          createdAt: number;
          date: number;
          description?: string;
          isRecurring: boolean;
          recurringTransactionId?: Id<"recurringTransactions">;
          updatedAt: number;
          userId: Id<"users">;
        } | null
      >;
      createTransaction: FunctionReference<
        "mutation",
        "public",
        {
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          date?: number;
          description?: string;
          isRecurring?: boolean;
          recurringTransactionId?: Id<"recurringTransactions">;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"transactions">;
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          createdAt: number;
          date: number;
          description?: string;
          isRecurring: boolean;
          newAccountBalance: number;
          recurringTransactionId?: Id<"recurringTransactions">;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      updateTransaction: FunctionReference<
        "mutation",
        "public",
        {
          accountId?: Id<"bankAccounts">;
          amount?: number;
          categoryId?: Id<"categories">;
          date?: number;
          description?: string;
          transactionId: Id<"transactions">;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"transactions">;
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          createdAt: number;
          date: number;
          description?: string;
          isRecurring: boolean;
          newAccountBalance: number;
          oldAccountBalance?: number;
          recurringTransactionId?: Id<"recurringTransactions">;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      deleteTransaction: FunctionReference<
        "mutation",
        "public",
        { transactionId: Id<"transactions">; userId: Id<"users"> },
        {
          deletedAmount: number;
          message: string;
          newAccountBalance: number;
          success: boolean;
        }
      >;
    };
    recurring: {
      getUserRecurringTransactions: FunctionReference<
        "query",
        "public",
        {
          accountId?: Id<"bankAccounts">;
          isActive?: boolean;
          userId: Id<"users">;
        },
        Array<{
          _creationTime: number;
          _id: Id<"recurringTransactions">;
          accountId: Id<"bankAccounts">;
          accountName: string;
          amount: number;
          categoryColor?: string;
          categoryIcon?: string;
          categoryId?: Id<"categories">;
          categoryName?: string;
          createdAt: number;
          daysUntilNext: number;
          description: string;
          endDate?: number;
          frequency: "daily" | "weekly" | "monthly";
          isActive: boolean;
          nextExecutionDate: number;
          updatedAt: number;
          userId: Id<"users">;
        }>
      >;
      createRecurringTransaction: FunctionReference<
        "mutation",
        "public",
        {
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          description: string;
          endDate?: number;
          frequency: "daily" | "weekly" | "monthly";
          nextExecutionDate: number;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"recurringTransactions">;
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          createdAt: number;
          description: string;
          endDate?: number;
          frequency: "daily" | "weekly" | "monthly";
          isActive: boolean;
          nextExecutionDate: number;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      updateRecurringTransaction: FunctionReference<
        "mutation",
        "public",
        {
          accountId?: Id<"bankAccounts">;
          amount?: number;
          categoryId?: Id<"categories">;
          description?: string;
          endDate?: number;
          frequency?: "daily" | "weekly" | "monthly";
          isActive?: boolean;
          nextExecutionDate?: number;
          recurringTransactionId: Id<"recurringTransactions">;
          userId: Id<"users">;
        },
        {
          _creationTime: number;
          _id: Id<"recurringTransactions">;
          accountId: Id<"bankAccounts">;
          amount: number;
          categoryId?: Id<"categories">;
          createdAt: number;
          description: string;
          endDate?: number;
          frequency: "daily" | "weekly" | "monthly";
          isActive: boolean;
          nextExecutionDate: number;
          updatedAt: number;
          userId: Id<"users">;
        }
      >;
      deleteRecurringTransaction: FunctionReference<
        "mutation",
        "public",
        {
          deleteGeneratedTransactions?: boolean;
          recurringTransactionId: Id<"recurringTransactions">;
          userId: Id<"users">;
        },
        { deletedTransactionsCount: number; message: string; success: boolean }
      >;
      processRecurringTransactions: FunctionReference<
        "action",
        "public",
        Record<string, never>,
        {
          createdTransactions: number;
          errors: Array<string>;
          processedCount: number;
        }
      >;
    };
    setup: {
      initializeUserFinance: FunctionReference<
        "mutation",
        "public",
        {
          defaultAccountIcon?: string;
          defaultAccountName?: string;
          initialBalance?: number;
          userId: Id<"users">;
        },
        {
          categoriesCreated: number;
          defaultAccountId: Id<"bankAccounts">;
          message: string;
          success: boolean;
        }
      >;
      getFinanceSetupStatus: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        {
          accountCount: number;
          categoryCount: number;
          hasAccounts: boolean;
          hasCategories: boolean;
          hasTransactions: boolean;
          isSetup: boolean;
          totalBalance: number;
          transactionCount: number;
        }
      >;
      resetUserFinance: FunctionReference<
        "mutation",
        "public",
        { confirmationText: string; userId: Id<"users"> },
        {
          deletedCounts: {
            accounts: number;
            categories: number;
            recurringTransactions: number;
            transactions: number;
          };
          message: string;
          success: boolean;
        }
      >;
      getFinanceDashboard: FunctionReference<
        "query",
        "public",
        { recentTransactionLimit?: number; userId: Id<"users"> },
        {
          accountSummaries: Array<{
            _id: Id<"bankAccounts">;
            currentAmount: number;
            icon: string;
            isDefault: boolean;
            name: string;
          }>;
          monthlyStats: {
            expenses: number;
            income: number;
            net: number;
            transactionCount: number;
          };
          recentTransactions: Array<{
            _id: Id<"transactions">;
            accountName: string;
            amount: number;
            categoryColor?: string;
            categoryIcon?: string;
            categoryName?: string;
            date: number;
            description?: string;
            isRecurring: boolean;
          }>;
          totalBalance: number;
          upcomingRecurring: Array<{
            _id: Id<"recurringTransactions">;
            accountName: string;
            amount: number;
            categoryName?: string;
            daysUntilNext: number;
            description?: string;
            frequency: "daily" | "weekly" | "monthly";
            nextExecutionDate: number;
          }>;
        }
      >;
    };
  };
};
export type InternalApiType = {};
