import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Initialize complete finance system for new user
 * Create default account and categories
 */
export const initializeUserFinance = mutation({
  args: {
    userId: v.id("users"),
    defaultAccountName: v.optional(v.string()),
    defaultAccountIcon: v.optional(v.string()),
    initialBalance: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    defaultAccountId: v.id("bankAccounts"),
    categoriesCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has finance setup
    const existingAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingAccounts) {
      throw new Error("User finance system already initialized");
    }

    const currentTime = Date.now();

    // Create default account
    const defaultAccountId = await ctx.db.insert("bankAccounts", {
      userId: args.userId,
      name: args.defaultAccountName || "Main Account",
      description: "Your primary account",
      icon: args.defaultAccountIcon || "💳",
      currentAmount: args.initialBalance || 0,
      defaultValue: args.initialBalance || 0,
      currency: "USD", // Default currency for setup
      isDefault: true,
      displayOrder: 1,
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    // Create default categories
    const defaultCategories = [
      { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B" },
      { name: "Transportation", icon: "🚗", color: "#4ECDC4" },
      { name: "Shopping", icon: "🛍️", color: "#45B7D1" },
      { name: "Entertainment", icon: "🎬", color: "#96CEB4" },
      { name: "Bills & Utilities", icon: "⚡", color: "#FFEAA7" },
      { name: "Healthcare", icon: "🏥", color: "#FD79A8" },
      { name: "Education", icon: "📚", color: "#A29BFE" },
      { name: "Travel", icon: "✈️", color: "#E17055" },
      { name: "Income", icon: "💰", color: "#00B894" },
      { name: "Other", icon: "📦", color: "#95A5A6" },
    ];

    let categoriesCreated = 0;
    for (const category of defaultCategories) {
      await ctx.db.insert("categories", {
        userId: args.userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isDefault: true,
        createdAt: currentTime,
      });
      categoriesCreated++;
    }

    return {
      success: true,
      message: `Finance system initialized successfully with ${categoriesCreated} default categories`,
      defaultAccountId,
      categoriesCreated,
    };
  },
});

/**
 * Check if user has finance system set up
 * Return setup status and basic statistics
 */
export const getFinanceSetupStatus = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    isSetup: v.boolean(),
    hasAccounts: v.boolean(),
    hasCategories: v.boolean(),
    hasTransactions: v.boolean(),
    accountCount: v.number(),
    categoryCount: v.number(),
    transactionCount: v.number(),
    totalBalance: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check accounts
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Check categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Check transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate total balance
    let totalBalance = 0;
    for (const account of accounts) {
      totalBalance += account.currentAmount;
    }

    const hasAccounts = accounts.length > 0;
    const hasCategories = categories.length > 0;
    const hasTransactions = transactions.length > 0;

    return {
      isSetup: hasAccounts && hasCategories,
      hasAccounts,
      hasCategories,
      hasTransactions,
      accountCount: accounts.length,
      categoryCount: categories.length,
      transactionCount: transactions.length,
      totalBalance,
    };
  },
});

/**
 * Reset user finance data
 * WARNING: This will delete ALL financial data for the user
 */
export const resetUserFinance = mutation({
  args: {
    userId: v.id("users"),
    confirmationText: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedCounts: v.object({
      accounts: v.number(),
      categories: v.number(),
      transactions: v.number(),
      recurringTransactions: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // Safety check - user must type exactly "DELETE ALL MY FINANCE DATA"
    if (args.confirmationText !== "DELETE ALL MY FINANCE DATA") {
      throw new Error("Invalid confirmation text. Operation cancelled.");
    }

    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const deletedCounts = {
      accounts: 0,
      categories: 0,
      transactions: 0,
      recurringTransactions: 0,
    };

    // Delete recurring transactions
    const recurringTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const recurringTx of recurringTransactions) {
      await ctx.db.delete(recurringTx._id);
      deletedCounts.recurringTransactions++;
    }

    // Delete transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
      deletedCounts.transactions++;
    }

    // Delete categories (except default ones)
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const category of categories) {
      await ctx.db.delete(category._id);
      deletedCounts.categories++;
    }

    // Delete accounts
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
      deletedCounts.accounts++;
    }

    return {
      success: true,
      message: `All finance data deleted successfully. ${deletedCounts.accounts} accounts, ${deletedCounts.categories} categories, ${deletedCounts.transactions} transactions, and ${deletedCounts.recurringTransactions} recurring transactions removed.`,
      deletedCounts,
    };
  },
});

/**
 * Get finance system overview for user dashboard
 * Include account summaries, recent transactions, and upcoming recurring transactions
 */
export const getFinanceDashboard = query({
  args: {
    userId: v.id("users"),
    recentTransactionLimit: v.optional(v.number()),
  },
  returns: v.object({
    totalBalance: v.number(),
    accountSummaries: v.array(
      v.object({
        _id: v.id("bankAccounts"),
        name: v.string(),
        icon: v.string(),
        currentAmount: v.number(),
        isDefault: v.boolean(),
      })
    ),
    recentTransactions: v.array(
      v.object({
        _id: v.id("transactions"),
        amount: v.number(),
        description: v.optional(v.string()),
        date: v.number(),
        accountName: v.string(),
        categoryName: v.optional(v.string()),
        categoryIcon: v.optional(v.string()),
        categoryColor: v.optional(v.string()),
        isRecurring: v.boolean(),
      })
    ),
    upcomingRecurring: v.array(
      v.object({
        _id: v.id("recurringTransactions"),
        amount: v.number(),
        description: v.optional(v.string()),
        nextExecutionDate: v.number(),
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly")
        ),
        accountName: v.string(),
        categoryName: v.optional(v.string()),
        daysUntilNext: v.number(),
      })
    ),
    monthlyStats: v.object({
      income: v.number(),
      expenses: v.number(),
      net: v.number(),
      transactionCount: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const limit = args.recentTransactionLimit || 10;

    // Get all user accounts
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate total balance and create account summaries
    let totalBalance = 0;
    const accountSummaries = accounts.map((account) => {
      totalBalance += account.currentAmount;
      return {
        _id: account._id,
        name: account.name,
        icon: account.icon,
        currentAmount: account.currentAmount,
        isDefault: account.isDefault,
      };
    });

    // Get recent transactions
    const recentTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich recent transactions with account and category info
    const enrichedRecentTransactions = await Promise.all(
      recentTransactions.map(async (transaction) => {
        const account = await ctx.db.get(transaction.accountId);
        const accountName = account?.name || "Unknown Account";

        let categoryName: string | undefined;
        let categoryIcon: string | undefined;
        let categoryColor: string | undefined;

        if (transaction.categoryId) {
          const category = await ctx.db.get(transaction.categoryId);
          if (category) {
            categoryName = category.name;
            categoryIcon = category.icon;
            categoryColor = category.color;
          }
        }

        return {
          _id: transaction._id,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          accountName,
          categoryName,
          categoryIcon,
          categoryColor,
          isRecurring: transaction.isRecurring,
        };
      })
    );

    // Get upcoming recurring transactions (next 7 days)
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const recurringTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("nextExecutionDate"), nextWeek)
        )
      )
      .collect();

    // Enrich upcoming recurring transactions
    const upcomingRecurring = await Promise.all(
      recurringTransactions.map(async (recurringTx) => {
        const account = await ctx.db.get(recurringTx.accountId);
        const accountName = account?.name || "Unknown Account";

        let categoryName: string | undefined;
        if (recurringTx.categoryId) {
          const category = await ctx.db.get(recurringTx.categoryId);
          categoryName = category?.name;
        }

        const now = Date.now();
        const daysUntilNext = Math.ceil(
          (recurringTx.nextExecutionDate - now) / (24 * 60 * 60 * 1000)
        );

        return {
          _id: recurringTx._id,
          amount: recurringTx.amount,
          description: recurringTx.description,
          nextExecutionDate: recurringTx.nextExecutionDate,
          frequency: recurringTx.frequency,
          accountName,
          categoryName,
          daysUntilNext,
        };
      })
    );

    // Calculate monthly statistics (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    const monthlyTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), monthStart),
          q.lte(q.field("date"), monthEnd)
        )
      )
      .collect();

    let income = 0;
    let expenses = 0;
    for (const transaction of monthlyTransactions) {
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
      }
    }

    const monthlyStats = {
      income,
      expenses,
      net: income - expenses,
      transactionCount: monthlyTransactions.length,
    };

    return {
      totalBalance,
      accountSummaries: accountSummaries.sort((a, b) =>
        b.isDefault ? 1 : a.isDefault ? -1 : 0
      ),
      recentTransactions: enrichedRecentTransactions,
      upcomingRecurring: upcomingRecurring.sort(
        (a, b) => a.nextExecutionDate - b.nextExecutionDate
      ),
      monthlyStats,
    };
  },
});
