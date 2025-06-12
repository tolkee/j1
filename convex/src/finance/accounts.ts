import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Fetch all accounts for a user ordered by displayOrder
 * Include current balance calculations and metadata
 */
export const getUserAccounts = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.string(),
      currentAmount: v.number(),
      defaultValue: v.number(),
      currency: v.optional(v.union(v.literal("USD"), v.literal("EUR"))),
      isDefault: v.boolean(),
      displayOrder: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user_and_display_order", (q) =>
        q.eq("userId", args.userId)
      )
      .order("asc")
      .collect();

    return accounts;
  },
});

/**
 * Fetch single account with full details
 * Include recent transactions count and metadata
 */
export const getAccountById = query({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.string(),
      currentAmount: v.number(),
      defaultValue: v.number(),
      currency: v.optional(v.union(v.literal("USD"), v.literal("EUR"))),
      isDefault: v.boolean(),
      displayOrder: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      transactionCount: v.number(),
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

    // Count transactions for this account
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    return {
      ...account,
      transactionCount: transactions.length,
    };
  },
});

/**
 * Create new bank account with validation
 * Set as default if it's the first account
 * Initialize with default amount
 */
export const createAccount = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
    defaultValue: v.number(),
    currency: v.union(v.literal("USD"), v.literal("EUR")),
  },
  returns: v.object({
    _id: v.id("bankAccounts"),
    _creationTime: v.number(),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
    currentAmount: v.number(),
    defaultValue: v.number(),
    currency: v.optional(v.union(v.literal("USD"), v.literal("EUR"))),
    isDefault: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate account name is not empty
    if (args.name.trim() === "") {
      throw new Error("Account name cannot be empty");
    }

    // Check if this is the first account (will be default)
    const existingAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const isFirstAccount = existingAccounts.length === 0;
    const displayOrder = existingAccounts.length;
    const currentTime = Date.now();

    const accountId = await ctx.db.insert("bankAccounts", {
      userId: args.userId,
      name: args.name.trim(),
      description: args.description?.trim(),
      icon: args.icon,
      currentAmount: args.defaultValue,
      defaultValue: args.defaultValue,
      currency: args.currency,
      isDefault: isFirstAccount,
      displayOrder,
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    const account = await ctx.db.get(accountId);
    if (!account) {
      throw new Error("Failed to create account");
    }

    return account;
  },
});

/**
 * Update account name, description, icon
 * Handle default account switching logic
 * Update display order
 */
export const updateAccount = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  returns: v.object({
    _id: v.id("bankAccounts"),
    _creationTime: v.number(),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
    currentAmount: v.number(),
    defaultValue: v.number(),
    currency: v.optional(v.union(v.literal("USD"), v.literal("EUR"))),
    isDefault: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify user ownership
    if (account.userId !== args.userId) {
      throw new Error("Unauthorized: Account does not belong to user");
    }

    // Validate name if provided
    if (args.name !== undefined && args.name.trim() === "") {
      throw new Error("Account name cannot be empty");
    }

    // Prepare update data
    const updateData: Partial<Doc<"bankAccounts">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updateData.name = args.name.trim();
    }

    if (args.description !== undefined) {
      updateData.description = args.description?.trim();
    }

    if (args.icon !== undefined) {
      updateData.icon = args.icon;
    }

    if (args.displayOrder !== undefined) {
      updateData.displayOrder = args.displayOrder;
    }

    await ctx.db.patch(args.accountId, updateData);

    const updatedAccount = await ctx.db.get(args.accountId);
    if (!updatedAccount) {
      throw new Error("Failed to update account");
    }

    return updatedAccount;
  },
});

/**
 * Set one account as default, unset others
 * Validate account belongs to user
 */
export const setDefaultAccount = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.string(),
      currentAmount: v.number(),
      defaultValue: v.number(),
      currency: v.optional(v.union(v.literal("USD"), v.literal("EUR"))),
      isDefault: v.boolean(),
      displayOrder: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify user ownership
    if (account.userId !== args.userId) {
      throw new Error("Unauthorized: Account does not belong to user");
    }

    // Get all user accounts
    const userAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const currentTime = Date.now();

    // Update all accounts - set isDefault to false except for the target account
    for (const userAccount of userAccounts) {
      const isDefaultAccount = userAccount._id === args.accountId;

      if (userAccount.isDefault !== isDefaultAccount) {
        await ctx.db.patch(userAccount._id, {
          isDefault: isDefaultAccount,
          updatedAt: currentTime,
        });
      }
    }

    // Return updated accounts list
    const updatedAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user_and_display_order", (q) =>
        q.eq("userId", args.userId)
      )
      .order("asc")
      .collect();

    return updatedAccounts;
  },
});

/**
 * Delete account with validation to prevent deletion if transactions exist
 * Handle default account reassignment if needed
 */
export const deleteAccount = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedCounts: v.object({
      transactions: v.number(),
      recurringTransactions: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify user ownership
    if (account.userId !== args.userId) {
      throw new Error("Unauthorized: Account does not belong to user");
    }

    // Check for existing transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    // Check for existing recurring transactions
    const recurringTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    // Prevent deletion if there are transactions
    if (transactions.length > 0 || recurringTransactions.length > 0) {
      return {
        success: false,
        message: `Cannot delete account with ${transactions.length} transactions and ${recurringTransactions.length} recurring transactions. Please delete or move transactions first.`,
        deletedCounts: {
          transactions: 0,
          recurringTransactions: 0,
        },
      };
    }

    const wasDefault = account.isDefault;

    // Delete the account (only if no transactions exist)
    await ctx.db.delete(args.accountId);

    // If this was the default account, set another account as default
    if (wasDefault) {
      const remainingAccounts = await ctx.db
        .query("bankAccounts")
        .withIndex("by_user_and_display_order", (q) =>
          q.eq("userId", args.userId)
        )
        .order("asc")
        .first();

      if (remainingAccounts) {
        await ctx.db.patch(remainingAccounts._id, {
          isDefault: true,
          updatedAt: Date.now(),
        });
      }
    }

    return {
      success: true,
      message: "Account deleted successfully.",
      deletedCounts: {
        transactions: 0,
        recurringTransactions: 0,
      },
    };
  },
});
