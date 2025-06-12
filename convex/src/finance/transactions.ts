import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Fetch transactions for specific account with pagination
 * Support pagination with cursor and include category and running balance
 */
export const getAccountTransactions = query({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("transactions"),
        _creationTime: v.number(),
        userId: v.id("users"),
        accountId: v.id("bankAccounts"),
        categoryId: v.optional(v.id("categories")),
        amount: v.number(),
        description: v.optional(v.string()),
        date: v.number(),
        isRecurring: v.boolean(),
        recurringTransactionId: v.optional(v.id("recurringTransactions")),
        createdAt: v.number(),
        updatedAt: v.number(),
        categoryName: v.optional(v.string()),
        categoryIcon: v.optional(v.string()),
        categoryColor: v.optional(v.string()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Verify account exists and user ownership
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found or access denied");
    }

    // Get paginated transactions
    const result = await ctx.db
      .query("transactions")
      .withIndex("by_account_and_date", (q) =>
        q.eq("accountId", args.accountId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich transactions with category information
    const enrichedTransactions = await Promise.all(
      result.page.map(async (transaction) => {
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
          ...transaction,
          categoryName,
          categoryIcon,
          categoryColor,
        };
      })
    );

    return {
      page: enrichedTransactions,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Fetch all transactions for user across accounts with filtering
 * Support filtering by date range, category, amount and pagination
 */
export const getUserTransactions = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
    accountId: v.optional(v.id("bankAccounts")),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("transactions"),
        _creationTime: v.number(),
        userId: v.id("users"),
        accountId: v.id("bankAccounts"),
        categoryId: v.optional(v.id("categories")),
        amount: v.number(),
        description: v.optional(v.string()),
        date: v.number(),
        isRecurring: v.boolean(),
        recurringTransactionId: v.optional(v.id("recurringTransactions")),
        createdAt: v.number(),
        updatedAt: v.number(),
        accountName: v.string(),
        categoryName: v.optional(v.string()),
        categoryIcon: v.optional(v.string()),
        categoryColor: v.optional(v.string()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Build the base query using simpler approach
    let baseQuery = ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    // Apply additional filters
    if (args.accountId) {
      baseQuery = baseQuery.filter((q) =>
        q.eq(q.field("accountId"), args.accountId)
      );
    }

    if (args.categoryId) {
      baseQuery = baseQuery.filter((q) =>
        q.eq(q.field("categoryId"), args.categoryId)
      );
    }

    if (args.startDate !== undefined) {
      baseQuery = baseQuery.filter((q) =>
        q.gte(q.field("date"), args.startDate!)
      );
    }

    if (args.endDate !== undefined) {
      baseQuery = baseQuery.filter((q) =>
        q.lte(q.field("date"), args.endDate!)
      );
    }

    if (args.minAmount !== undefined) {
      baseQuery = baseQuery.filter((q) =>
        q.gte(q.field("amount"), args.minAmount!)
      );
    }

    if (args.maxAmount !== undefined) {
      baseQuery = baseQuery.filter((q) =>
        q.lte(q.field("amount"), args.maxAmount!)
      );
    }

    const result = await baseQuery.paginate(args.paginationOpts);

    // Enrich transactions with account and category information
    const enrichedTransactions = await Promise.all(
      result.page.map(async (transaction) => {
        // Get account info
        const account = await ctx.db.get(transaction.accountId);
        const accountName = account?.name || "Unknown Account";

        // Get category info
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
          ...transaction,
          accountName,
          categoryName,
          categoryIcon,
          categoryColor,
        };
      })
    );

    return {
      page: enrichedTransactions,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Fetch single transaction with full details
 * Include account and category information
 */
export const getTransactionById = query({
  args: {
    transactionId: v.id("transactions"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      accountId: v.id("bankAccounts"),
      categoryId: v.optional(v.id("categories")),
      amount: v.number(),
      description: v.optional(v.string()),
      date: v.number(),
      isRecurring: v.boolean(),
      recurringTransactionId: v.optional(v.id("recurringTransactions")),
      createdAt: v.number(),
      updatedAt: v.number(),
      accountName: v.string(),
      categoryName: v.optional(v.string()),
      categoryIcon: v.optional(v.string()),
      categoryColor: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== args.userId) {
      return null;
    }

    // Get account info
    const account = await ctx.db.get(transaction.accountId);
    const accountName = account?.name || "Unknown Account";

    // Get category info
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
      ...transaction,
      accountName,
      categoryName,
      categoryIcon,
      categoryColor,
    };
  },
});

/**
 * Create new transaction with validation
 * Update account balance automatically
 * Handle category creation if needed
 * Support both expense and income
 */
export const createTransaction = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
  },
  returns: v.object({
    _id: v.id("transactions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.optional(v.string()),
    date: v.number(),
    isRecurring: v.boolean(),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
    createdAt: v.number(),
    updatedAt: v.number(),
    newAccountBalance: v.number(),
  }),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate account exists and belongs to user
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found or access denied");
    }

    // Validate category if provided
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.userId !== args.userId) {
        throw new Error("Category not found or access denied");
      }
    }

    // Validate amount
    if (args.amount === 0) {
      throw new Error("Transaction amount cannot be zero");
    }

    const currentTime = Date.now();
    const transactionDate = args.date || currentTime;

    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      accountId: args.accountId,
      categoryId: args.categoryId,
      amount: args.amount,
      description: args.description?.trim(),
      date: transactionDate,
      isRecurring: args.isRecurring || false,
      recurringTransactionId: args.recurringTransactionId,
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    // Update account balance by recalculating from all transactions
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    let newBalance = account.defaultValue;
    for (const tx of allTransactions) {
      newBalance += tx.amount;
    }

    await ctx.db.patch(args.accountId, {
      currentAmount: newBalance,
      updatedAt: Date.now(),
    });

    const balanceResult = { newBalance };

    const transaction = await ctx.db.get(transactionId);
    if (!transaction) {
      throw new Error("Failed to create transaction");
    }

    return {
      ...transaction,
      newAccountBalance: balanceResult.newBalance,
    };
  },
});

/**
 * Update transaction amount, description, category
 * Recalculate account balances for old and new amounts
 * Handle account transfer if changed
 */
export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    userId: v.id("users"),
    accountId: v.optional(v.id("bankAccounts")),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  returns: v.object({
    _id: v.id("transactions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.optional(v.string()),
    date: v.number(),
    isRecurring: v.boolean(),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
    createdAt: v.number(),
    updatedAt: v.number(),
    oldAccountBalance: v.optional(v.number()),
    newAccountBalance: v.number(),
  }),
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== args.userId) {
      throw new Error("Transaction not found or access denied");
    }

    const oldAccountId = transaction.accountId;
    let oldAccountBalance: number | undefined;

    // Prepare update data
    const updateData: Partial<Doc<"transactions">> = {
      updatedAt: Date.now(),
    };

    // Validate new account if changing
    if (args.accountId && args.accountId !== transaction.accountId) {
      const newAccount = await ctx.db.get(args.accountId);
      if (!newAccount || newAccount.userId !== args.userId) {
        throw new Error("New account not found or access denied");
      }
      updateData.accountId = args.accountId;
    }

    // Validate new category if changing
    if (args.categoryId !== undefined) {
      if (args.categoryId) {
        const category = await ctx.db.get(args.categoryId);
        if (!category || category.userId !== args.userId) {
          throw new Error("Category not found or access denied");
        }
      }
      updateData.categoryId = args.categoryId;
    }

    // Validate amount
    if (args.amount !== undefined) {
      if (args.amount === 0) {
        throw new Error("Transaction amount cannot be zero");
      }
      updateData.amount = args.amount;
    }

    // Validate description
    if (args.description !== undefined) {
      const trimmedDescription = args.description.trim();
      if (trimmedDescription === "") {
        throw new Error("Transaction description cannot be empty");
      }
      updateData.description = trimmedDescription;
    }

    // Update date if provided
    if (args.date !== undefined) {
      updateData.date = args.date;
    }

    // Update the transaction
    await ctx.db.patch(args.transactionId, updateData);

    // Recalculate balances
    const newAccountId = updateData.accountId || transaction.accountId;

    // If account changed, recalculate both old and new account balances
    if (updateData.accountId && updateData.accountId !== oldAccountId) {
      // Recalculate old account balance
      const oldTransactions = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", oldAccountId))
        .collect();

      const oldAccount = await ctx.db.get(oldAccountId);
      if (oldAccount) {
        let oldAccountNewBalance = oldAccount.defaultValue;
        for (const tx of oldTransactions) {
          oldAccountNewBalance += tx.amount;
        }

        await ctx.db.patch(oldAccountId, {
          currentAmount: oldAccountNewBalance,
          updatedAt: Date.now(),
        });

        oldAccountBalance = oldAccountNewBalance;
      }
    }

    // Recalculate new account balance
    const newTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", newAccountId))
      .collect();

    const newAccount = await ctx.db.get(newAccountId);
    if (!newAccount) {
      throw new Error("Account not found");
    }

    let newAccountBalance = newAccount.defaultValue;
    for (const tx of newTransactions) {
      newAccountBalance += tx.amount;
    }

    await ctx.db.patch(newAccountId, {
      currentAmount: newAccountBalance,
      updatedAt: Date.now(),
    });

    const newBalance = { newBalance: newAccountBalance };

    const updatedTransaction = await ctx.db.get(args.transactionId);
    if (!updatedTransaction) {
      throw new Error("Failed to update transaction");
    }

    return {
      ...updatedTransaction,
      oldAccountBalance,
      newAccountBalance: newBalance.newBalance,
    };
  },
});

/**
 * Remove transaction and update account balance
 * Handle recurring transaction relationship
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    newAccountBalance: v.number(),
    deletedAmount: v.number(),
  }),
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== args.userId) {
      throw new Error("Transaction not found or access denied");
    }

    const accountId = transaction.accountId;
    const deletedAmount = transaction.amount;

    // Delete the transaction
    await ctx.db.delete(args.transactionId);

    // Recalculate account balance by recalculating from all transactions
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .collect();

    const account = await ctx.db.get(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    let newAccountBalance = account.defaultValue;
    for (const tx of allTransactions) {
      newAccountBalance += tx.amount;
    }

    await ctx.db.patch(accountId, {
      currentAmount: newAccountBalance,
      updatedAt: Date.now(),
    });

    const balanceResult = { newBalance: newAccountBalance };

    return {
      success: true,
      message: "Transaction deleted successfully",
      newAccountBalance: balanceResult.newBalance,
      deletedAmount,
    };
  },
});
