import { query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Calculate current balance for specific account
 * Include pending recurring transactions
 * Return balance with last updated timestamp
 */
export const getAccountBalance = query({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      accountId: v.id("bankAccounts"),
      currentAmount: v.number(),
      defaultValue: v.number(),
      transactionCount: v.number(),
      lastTransactionDate: v.optional(v.number()),
      lastUpdated: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      return null;
    }

    // Verify user ownership
    if (account.userId !== args.userId) {
      return null;
    }

    // Get all transactions for this account
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account_and_date", (q) =>
        q.eq("accountId", args.accountId)
      )
      .order("desc")
      .collect();

    // Calculate balance from scratch (verification)
    let calculatedBalance = account.defaultValue;
    for (const transaction of transactions) {
      calculatedBalance += transaction.amount;
    }

    // Get the most recent transaction date
    const lastTransactionDate =
      transactions.length > 0 ? transactions[0].date : undefined;

    return {
      accountId: args.accountId,
      currentAmount: calculatedBalance,
      defaultValue: account.defaultValue,
      transactionCount: transactions.length,
      lastTransactionDate,
      lastUpdated: Date.now(),
    };
  },
});

/**
 * Calculate total balance across all accounts
 * Support filtering by account types
 * Return aggregated balance information
 */
export const getUserTotalBalance = query({
  args: {
    userId: v.id("users"),
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.object({
    totalBalance: v.number(),
    accountCount: v.number(),
    balanceByAccount: v.array(
      v.object({
        accountId: v.id("bankAccounts"),
        accountName: v.string(),
        balance: v.number(),
        isDefault: v.boolean(),
      })
    ),
    lastUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all user accounts
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let totalBalance = 0;
    const balanceByAccount = [];

    for (const account of accounts) {
      // Get all transactions for this account
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .collect();

      // Calculate account balance
      let accountBalance = account.defaultValue;
      for (const transaction of transactions) {
        accountBalance += transaction.amount;
      }

      totalBalance += accountBalance;
      balanceByAccount.push({
        accountId: account._id,
        accountName: account.name,
        balance: accountBalance,
        isDefault: account.isDefault,
      });
    }

    return {
      totalBalance,
      accountCount: accounts.length,
      balanceByAccount,
      lastUpdated: Date.now(),
    };
  },
});

/**
 * Helper function to recalculate account balance
 * Sum all transactions for the account
 * Update account currentAmount field
 * Use in transaction mutations
 */
export const recalculateAccountBalance = internalMutation({
  args: {
    accountId: v.id("bankAccounts"),
  },
  returns: v.object({
    previousBalance: v.number(),
    newBalance: v.number(),
    transactionCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    const previousBalance = account.currentAmount;

    // Get all transactions for this account
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    // Calculate new balance from default value + all transactions
    let newBalance = account.defaultValue;
    for (const transaction of transactions) {
      newBalance += transaction.amount;
    }

    // Update the account with the recalculated balance
    await ctx.db.patch(args.accountId, {
      currentAmount: newBalance,
      updatedAt: Date.now(),
    });

    return {
      previousBalance,
      newBalance,
      transactionCount: transactions.length,
    };
  },
});

/**
 * Get balance summary for dashboard
 * Include income vs expenses breakdown
 * Show trends and projections
 */
export const getBalanceSummary = query({
  args: {
    userId: v.id("users"),
    periodInDays: v.optional(v.number()),
  },
  returns: v.object({
    totalBalance: v.number(),
    totalIncome: v.number(),
    totalExpenses: v.number(),
    netFlow: v.number(),
    accountCount: v.number(),
    transactionCount: v.number(),
    averageTransactionAmount: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
  }),
  handler: async (ctx, args) => {
    const periodDays = args.periodInDays || 30;
    const periodEnd = Date.now();
    const periodStart = periodEnd - periodDays * 24 * 60 * 60 * 1000;

    // Get user accounts
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get transactions in the period
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("date", periodStart)
          .lte("date", periodEnd)
      )
      .collect();

    // Calculate statistics
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalBalance = 0;

    for (const account of accounts) {
      // Calculate account balance
      const accountTransactions = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .collect();

      let accountBalance = account.defaultValue;
      for (const transaction of accountTransactions) {
        accountBalance += transaction.amount;
      }
      totalBalance += accountBalance;
    }

    // Categorize period transactions
    for (const transaction of allTransactions) {
      if (transaction.amount > 0) {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += Math.abs(transaction.amount);
      }
    }

    const netFlow = totalIncome - totalExpenses;
    const averageTransactionAmount =
      allTransactions.length > 0
        ? allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
          allTransactions.length
        : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      netFlow,
      accountCount: accounts.length,
      transactionCount: allTransactions.length,
      averageTransactionAmount,
      periodStart,
      periodEnd,
    };
  },
});
