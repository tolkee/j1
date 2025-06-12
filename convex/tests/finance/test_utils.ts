import { convexTest } from "convex-test";
import { api } from "../../src/_generated/api";
import { Id } from "../../src/_generated/dataModel";
import schema from "../../src/schema";
import { modules } from "./test_setup";

/**
 * Create a test instance with our schema
 */
export const createTestInstance = () => {
  return convexTest(schema, modules);
};

/**
 * Create a test user with identity
 */
export const createTestUser = async (
  t: ReturnType<typeof convexTest>,
  name = "Test User",
  email?: string
) => {
  const userId = await t.run(async (ctx: any) => {
    const currentTime = Date.now();
    return await ctx.db.insert("users", {
      name,
      email: email || `${name.toLowerCase().replace(" ", "")}@test.com`,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  });

  const userHelper = t.withIdentity({ subject: userId });
  // Store the userId on the helper for easy access
  (userHelper as any).userId = userId;
  return userHelper;
};

/**
 * Create a test account for a user with sensible defaults
 */
export const createTestAccount = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  overrides: Partial<{
    name: string;
    description: string;
    icon: string;
    defaultValue: number;
    currency: "USD" | "EUR";
  }> = {}
) => {
  return await userHelper.mutation(api.finance.accounts.createAccount, {
    userId: getUserId(userHelper),
    name: overrides.name || "Test Account",
    description: overrides.description || "Test account description",
    icon: overrides.icon || "💳",
    defaultValue: overrides.defaultValue ?? 1000,
    currency: overrides.currency || "USD",
  });
};

/**
 * Create a test category for a user
 */
export const createTestCategory = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  overrides: Partial<{
    name: string;
    icon: string;
    color: string;
  }> = {}
) => {
  return await userHelper.mutation(api.finance.categories.createCategory, {
    userId: getUserId(userHelper),
    name: overrides.name || "Test Category",
    icon: overrides.icon || "🍽️",
    color: overrides.color || "#FF6B6B",
  });
};

/**
 * Create a test transaction
 */
export const createTestTransaction = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  accountId: Id<"bankAccounts">,
  overrides: Partial<{
    categoryId: Id<"categories">;
    amount: number;
    description: string;
    date: number;
    isRecurring: boolean;
    recurringTransactionId: Id<"recurringTransactions">;
  }> = {}
) => {
  return await userHelper.mutation(api.finance.transactions.createTransaction, {
    userId: getUserId(userHelper),
    accountId,
    categoryId: overrides.categoryId,
    amount: overrides.amount ?? -50,
    description: overrides.description || "Test Transaction",
    date: overrides.date,
    isRecurring: overrides.isRecurring,
    recurringTransactionId: overrides.recurringTransactionId,
  });
};

/**
 * Create a test recurring transaction
 */
export const createTestRecurringTransaction = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  accountId: Id<"bankAccounts">,
  overrides: Partial<{
    categoryId: Id<"categories">;
    amount: number;
    description: string;
    frequency: "daily" | "weekly" | "monthly";
    nextExecutionDate: number;
    endDate: number;
  }> = {}
) => {
  const nextExecutionDate =
    overrides.nextExecutionDate || Date.now() + 24 * 60 * 60 * 1000; // Tomorrow

  return await userHelper.mutation(
    api.finance.recurring.createRecurringTransaction,
    {
      userId: getUserId(userHelper),
      accountId,
      categoryId: overrides.categoryId,
      amount: overrides.amount ?? -500,
      description: overrides.description || "Test Recurring Transaction",
      frequency: overrides.frequency || "monthly",
      nextExecutionDate,
      endDate: overrides.endDate,
    }
  );
};

/**
 * Initialize complete finance setup for a user (account + categories)
 */
export const initializeTestFinanceSetup = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  accountOverrides: Parameters<typeof createTestAccount>[1] = {},
  initialBalance = 1000
) => {
  // Initialize finance service with default categories
  const setupResult = await userHelper.mutation(
    api.finance.setup.initializeUserFinance,
    {
      userId: getUserId(userHelper),
      defaultAccountName: accountOverrides.name || "Main Account",
      defaultAccountIcon: accountOverrides.icon || "💳",
      initialBalance,
    }
  );

  // Get the created account and categories
  const accounts = await userHelper.query(
    api.finance.accounts.getUserAccounts,
    {
      userId: getUserId(userHelper),
    }
  );

  const categories = await userHelper.query(
    api.finance.categories.getUserCategories,
    {
      userId: getUserId(userHelper),
    }
  );

  return {
    setupResult,
    defaultAccount: accounts.find((acc: any) => acc.isDefault) || accounts[0],
    accounts,
    categories,
  };
};

/**
 * Create multiple test transactions for testing pagination and aggregation
 */
export const createMultipleTestTransactions = async (
  userHelper: Awaited<ReturnType<typeof createTestUser>>,
  accountId: Id<"bankAccounts">,
  count: number,
  overrides: Partial<{
    baseAmount: number;
    description: string;
    categoryId: Id<"categories">;
    dateSpreadDays: number; // Spread transactions over X days
  }> = {}
) => {
  const transactions = [];
  const baseAmount = overrides.baseAmount || -50;
  const dateSpreadDays = overrides.dateSpreadDays || 30;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const amount = baseAmount + (Math.random() - 0.5) * baseAmount; // Vary amount
    const date = now - Math.random() * dateSpreadDays * 24 * 60 * 60 * 1000; // Random date within spread

    const transaction = await createTestTransaction(userHelper, accountId, {
      amount,
      description: overrides.description
        ? `${overrides.description} ${i + 1}`
        : `Transaction ${i + 1}`,
      date,
      categoryId: overrides.categoryId,
    });

    transactions.push(transaction);
  }

  return transactions;
};

/**
 * Get user ID from user helper
 */
export function getUserId(
  userHelper: Awaited<ReturnType<typeof createTestUser>>
): Id<"users"> {
  if ((userHelper as any).userId) {
    return (userHelper as any).userId as Id<"users">;
  }
  throw new Error("Cannot find user ID in userHelper");
}

/**
 * Wait for a specific amount of time (useful for testing time-based operations)
 */
export const waitForTime = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Assert that two numbers are approximately equal (useful for balance calculations with floating point)
 */
export const assertApproximatelyEqual = (
  actual: number,
  expected: number,
  tolerance = 0.01
) => {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `Expected ${actual} to be approximately ${expected} (tolerance: ${tolerance}), but difference was ${diff}`
    );
  }
};

/**
 * Generate random transaction data for testing
 */
export const generateRandomTransactionData = (count: number) => {
  const categories = [
    "Food",
    "Transport",
    "Entertainment",
    "Shopping",
    "Bills",
  ];
  const descriptions = [
    "Coffee",
    "Lunch",
    "Dinner",
    "Groceries",
    "Gas",
    "Bus ticket",
    "Movie",
    "Concert",
    "Book",
    "Clothes",
    "Electricity",
    "Internet",
  ];

  return Array.from({ length: count }, (_, i) => ({
    amount: Math.random() > 0.8 ? Math.random() * 1000 : -(Math.random() * 200), // 20% income, 80% expenses
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    date: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000, // Random date in last 90 days
  }));
};

/**
 * Performance measurement utility
 */
export const measurePerformance = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;

  console.log(`${name} took ${duration}ms`);

  return { result, duration };
};
