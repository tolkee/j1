import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Fetch all recurring transactions for user
 * Include next execution dates and support filtering by account and status
 */
export const getUserRecurringTransactions = query({
  args: {
    userId: v.id("users"),
    accountId: v.optional(v.id("bankAccounts")),
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("recurringTransactions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      accountId: v.id("bankAccounts"),
      categoryId: v.optional(v.id("categories")),
      amount: v.number(),
      description: v.string(),
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      nextExecutionDate: v.number(),
      endDate: v.optional(v.number()),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
      accountName: v.string(),
      categoryName: v.optional(v.string()),
      categoryIcon: v.optional(v.string()),
      categoryColor: v.optional(v.string()),
      daysUntilNext: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Apply filters
    if (args.accountId) {
      query = query.filter((q) => q.eq(q.field("accountId"), args.accountId));
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const recurringTransactions = await query.collect();

    // Enrich with account and category information
    const enrichedTransactions = await Promise.all(
      recurringTransactions.map(async (recurringTx) => {
        // Get account info
        const account = await ctx.db.get(recurringTx.accountId);
        const accountName = account?.name || "Unknown Account";

        // Get category info
        let categoryName: string | undefined;
        let categoryIcon: string | undefined;
        let categoryColor: string | undefined;

        if (recurringTx.categoryId) {
          const category = await ctx.db.get(recurringTx.categoryId);
          if (category) {
            categoryName = category.name;
            categoryIcon = category.icon;
            categoryColor = category.color;
          }
        }

        // Calculate days until next execution
        const now = Date.now();
        const daysUntilNext = Math.ceil(
          (recurringTx.nextExecutionDate - now) / (24 * 60 * 60 * 1000)
        );

        return {
          ...recurringTx,
          accountName,
          categoryName,
          categoryIcon,
          categoryColor,
          daysUntilNext,
        };
      })
    );

    // Sort by next execution date
    enrichedTransactions.sort(
      (a, b) => a.nextExecutionDate - b.nextExecutionDate
    );

    return enrichedTransactions;
  },
});

/**
 * Create new recurring transaction setup
 * Calculate first execution date and validate frequency and end date
 */
export const createRecurringTransaction = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    nextExecutionDate: v.number(),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    _id: v.id("recurringTransactions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    nextExecutionDate: v.number(),
    endDate: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
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
      throw new Error("Recurring transaction amount cannot be zero");
    }

    // Validate description
    if (args.description.trim() === "") {
      throw new Error("Recurring transaction description cannot be empty");
    }

    // Validate dates
    const now = Date.now();
    if (args.nextExecutionDate < now) {
      throw new Error("Next execution date cannot be in the past");
    }

    if (args.endDate && args.endDate <= args.nextExecutionDate) {
      throw new Error("End date must be after the first execution date");
    }

    const currentTime = Date.now();

    // Create the recurring transaction
    const recurringTransactionId = await ctx.db.insert(
      "recurringTransactions",
      {
        userId: args.userId,
        accountId: args.accountId,
        categoryId: args.categoryId,
        amount: args.amount,
        description: args.description.trim(),
        frequency: args.frequency,
        nextExecutionDate: args.nextExecutionDate,
        endDate: args.endDate,
        isActive: true,
        createdAt: currentTime,
        updatedAt: currentTime,
      }
    );

    const recurringTransaction = await ctx.db.get(recurringTransactionId);
    if (!recurringTransaction) {
      throw new Error("Failed to create recurring transaction");
    }

    return recurringTransaction;
  },
});

/**
 * Update amount, frequency, description and recalculate next execution date
 * Handle active/inactive status
 */
export const updateRecurringTransaction = mutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
    userId: v.id("users"),
    accountId: v.optional(v.id("bankAccounts")),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    frequency: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    nextExecutionDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.object({
    _id: v.id("recurringTransactions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    nextExecutionDate: v.number(),
    endDate: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const recurringTransaction = await ctx.db.get(args.recurringTransactionId);
    if (!recurringTransaction || recurringTransaction.userId !== args.userId) {
      throw new Error("Recurring transaction not found or access denied");
    }

    // Prepare update data
    const updateData: Partial<Doc<"recurringTransactions">> = {
      updatedAt: Date.now(),
    };

    // Validate new account if changing
    if (args.accountId && args.accountId !== recurringTransaction.accountId) {
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
        throw new Error("Recurring transaction amount cannot be zero");
      }
      updateData.amount = args.amount;
    }

    // Validate description
    if (args.description !== undefined) {
      const trimmedDescription = args.description.trim();
      if (trimmedDescription === "") {
        throw new Error("Recurring transaction description cannot be empty");
      }
      updateData.description = trimmedDescription;
    }

    // Update frequency
    if (args.frequency !== undefined) {
      updateData.frequency = args.frequency;
    }

    // Update next execution date
    if (args.nextExecutionDate !== undefined) {
      const now = Date.now();
      if (args.nextExecutionDate < now) {
        throw new Error("Next execution date cannot be in the past");
      }
      updateData.nextExecutionDate = args.nextExecutionDate;
    }

    // Update end date
    if (args.endDate !== undefined) {
      const nextExecution =
        updateData.nextExecutionDate || recurringTransaction.nextExecutionDate;
      if (args.endDate && args.endDate <= nextExecution) {
        throw new Error("End date must be after the next execution date");
      }
      updateData.endDate = args.endDate;
    }

    // Update active status
    if (args.isActive !== undefined) {
      updateData.isActive = args.isActive;
    }

    // Update the recurring transaction
    await ctx.db.patch(args.recurringTransactionId, updateData);

    const updatedRecurringTransaction = await ctx.db.get(
      args.recurringTransactionId
    );
    if (!updatedRecurringTransaction) {
      throw new Error("Failed to update recurring transaction");
    }

    return updatedRecurringTransaction;
  },
});

/**
 * Remove recurring transaction
 * Optionally keep or remove generated transactions
 */
export const deleteRecurringTransaction = mutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
    userId: v.id("users"),
    deleteGeneratedTransactions: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedTransactionsCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const recurringTransaction = await ctx.db.get(args.recurringTransactionId);
    if (!recurringTransaction || recurringTransaction.userId !== args.userId) {
      throw new Error("Recurring transaction not found or access denied");
    }

    let deletedTransactionsCount = 0;

    // Optionally delete generated transactions
    if (args.deleteGeneratedTransactions) {
      const generatedTransactions = await ctx.db
        .query("transactions")
        .withIndex("by_recurring_transaction", (q) =>
          q.eq("recurringTransactionId", args.recurringTransactionId)
        )
        .collect();

      for (const transaction of generatedTransactions) {
        await ctx.db.delete(transaction._id);
        deletedTransactionsCount++;

        // Recalculate account balance after deleting transaction
        const account = await ctx.db.get(transaction.accountId);
        if (account) {
          const remainingTransactions = await ctx.db
            .query("transactions")
            .withIndex("by_account", (q) =>
              q.eq("accountId", transaction.accountId)
            )
            .collect();

          let newBalance = account.defaultValue;
          for (const tx of remainingTransactions) {
            newBalance += tx.amount;
          }

          await ctx.db.patch(transaction.accountId, {
            currentAmount: newBalance,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Delete the recurring transaction
    await ctx.db.delete(args.recurringTransactionId);

    return {
      success: true,
      message:
        deletedTransactionsCount > 0
          ? `Recurring transaction and ${deletedTransactionsCount} generated transactions deleted successfully`
          : "Recurring transaction deleted successfully",
      deletedTransactionsCount,
    };
  },
});

/**
 * Calculate next execution date based on frequency
 */
function calculateNextExecution(
  currentDate: number,
  frequency: "daily" | "weekly" | "monthly"
): number {
  const date = new Date(currentDate);

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date.getTime();
}

/**
 * Internal query to get due recurring transactions for processing
 */
export const getDueRecurringTransactions = query({
  args: {
    currentTime: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("recurringTransactions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      accountId: v.id("bankAccounts"),
      categoryId: v.optional(v.id("categories")),
      amount: v.number(),
      description: v.string(),
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      nextExecutionDate: v.number(),
      endDate: v.optional(v.number()),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all active recurring transactions where nextExecutionDate <= currentTime
    const dueTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_next_execution_and_active", (q) =>
        q.lte("nextExecutionDate", args.currentTime)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return dueTransactions;
  },
});

/**
 * Background job to create transactions from recurring setups
 * Check all due recurring transactions and create actual transactions
 * Update next execution dates and handle errors
 */
export const processRecurringTransactions = action({
  args: {},
  returns: v.object({
    processedCount: v.number(),
    createdTransactions: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let processedCount = 0;
    let createdTransactions = 0;
    const errors: string[] = [];

    try {
      // Get all active recurring transactions that are due
      const dueRecurringTransactions = await ctx.runQuery(
        "finance/recurring:getDueRecurringTransactions" as any,
        { currentTime: now }
      );

      for (const recurringTx of dueRecurringTransactions) {
        try {
          processedCount++;

          // Check if we should stop (end date reached)
          if (recurringTx.endDate && now > recurringTx.endDate) {
            await ctx.runMutation(
              "finance/recurring:updateRecurringTransaction" as any,
              {
                recurringTransactionId: recurringTx._id,
                userId: recurringTx.userId,
                isActive: false,
              }
            );
            continue;
          }

          // Create the actual transaction
          await ctx.runMutation(
            "finance/transactions:createTransaction" as any,
            {
              userId: recurringTx.userId,
              accountId: recurringTx.accountId,
              categoryId: recurringTx.categoryId,
              amount: recurringTx.amount,
              description: recurringTx.description,
              date: now,
              isRecurring: true,
              recurringTransactionId: recurringTx._id,
            }
          );

          createdTransactions++;

          // Calculate and update next execution date
          const nextExecution = calculateNextExecution(
            recurringTx.nextExecutionDate,
            recurringTx.frequency
          );

          await ctx.runMutation(
            "finance/recurring:updateRecurringTransaction" as any,
            {
              recurringTransactionId: recurringTx._id,
              userId: recurringTx.userId,
              nextExecutionDate: nextExecution,
            }
          );
        } catch (error) {
          errors.push(
            `Failed to process recurring transaction ${recurringTx._id}: ${error}`
          );
        }
      }
    } catch (error) {
      errors.push(`Failed to fetch due recurring transactions: ${error}`);
    }

    return {
      processedCount,
      createdTransactions,
      errors,
    };
  },
});
