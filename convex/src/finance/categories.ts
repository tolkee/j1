import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// Default categories that will be created for new users
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "food", color: "#FF6B6B" },
  { name: "Transportation", icon: "car", color: "#4ECDC4" },
  { name: "Shopping", icon: "shopping", color: "#45B7D1" },
  { name: "Entertainment", icon: "entertainment", color: "#96CEB4" },
  { name: "Bills & Utilities", icon: "bills", color: "#FFEAA7" },
  { name: "Healthcare", icon: "health", color: "#DDA0DD" },
  { name: "Education", icon: "education", color: "#98D8C8" },
  { name: "Travel", icon: "travel", color: "#F7DC6F" },
  { name: "Income", icon: "income", color: "#82E5AA" },
  { name: "Other", icon: "other", color: "#95A5A6" },
];

/**
 * Fetch all categories for user including default ones
 * Order by usage frequency and name
 * Return categories with usage statistics
 */
export const getUserCategories = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      icon: v.string(),
      color: v.string(),
      isDefault: v.boolean(),
      createdAt: v.number(),
      usageCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate usage statistics for each category
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        const transactions = await ctx.db
          .query("transactions")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();

        return {
          ...category,
          usageCount: transactions.length,
        };
      })
    );

    // Sort by usage frequency (most used first), then by name
    categoriesWithUsage.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    });

    return categoriesWithUsage;
  },
});

/**
 * Return predefined default categories
 * Include common categories like Food, Transport, etc.
 * Allow user to adopt default categories
 */
export const getDefaultCategories = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      icon: v.string(),
      color: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    return DEFAULT_CATEGORIES;
  },
});

/**
 * Create new custom category with validation
 * Ensure unique name per user
 * Set icon and color
 */
export const createCategory = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate category name is not empty
    const trimmedName = args.name.trim();
    if (trimmedName === "") {
      throw new Error("Category name cannot be empty");
    }

    // Check if category name already exists for this user
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", args.userId).eq("name", trimmedName)
      )
      .first();

    if (existingCategories) {
      throw new Error("Category with this name already exists");
    }

    const currentTime = Date.now();
    const defaultColor = args.color || "#95A5A6";

    const categoryId = await ctx.db.insert("categories", {
      userId: args.userId,
      name: trimmedName,
      icon: args.icon,
      color: defaultColor,
      isDefault: false,
      createdAt: currentTime,
    });

    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Failed to create category");
    }

    return category;
  },
});

/**
 * Update category name, icon, color
 * Validate category belongs to user
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Verify user ownership
    if (category.userId !== args.userId) {
      throw new Error("Unauthorized: Category does not belong to user");
    }

    // Prepare update data
    const updateData: Partial<Doc<"categories">> = {};

    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      if (trimmedName === "") {
        throw new Error("Category name cannot be empty");
      }

      // Check if new name conflicts with existing categories
      if (trimmedName !== category.name) {
        const existingCategory = await ctx.db
          .query("categories")
          .withIndex("by_user_and_name", (q) =>
            q.eq("userId", args.userId).eq("name", trimmedName)
          )
          .first();

        if (existingCategory) {
          throw new Error("Category with this name already exists");
        }
      }

      updateData.name = trimmedName;
    }

    if (args.icon !== undefined) {
      updateData.icon = args.icon;
    }

    if (args.color !== undefined) {
      updateData.color = args.color;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(args.categoryId, updateData);
    }

    const updatedCategory = await ctx.db.get(args.categoryId);
    if (!updatedCategory) {
      throw new Error("Failed to update category");
    }

    return updatedCategory;
  },
});

/**
 * Check if category is used in transactions
 * Reassign transactions to "Other" category if needed
 * Delete category
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    userId: v.id("users"),
    reassignToCategory: v.optional(v.id("categories")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    reassignedTransactions: v.number(),
  }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Verify user ownership
    if (category.userId !== args.userId) {
      throw new Error("Unauthorized: Category does not belong to user");
    }

    // Find transactions using this category
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    // Find recurring transactions using this category
    const recurringTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .collect();

    let reassignedCount = 0;

    // Handle transaction reassignment
    if (transactions.length > 0 || recurringTransactions.length > 0) {
      let targetCategoryId: Id<"categories"> | null = null;

      if (args.reassignToCategory) {
        // Verify the target category exists and belongs to user
        const targetCategory = await ctx.db.get(args.reassignToCategory);
        if (!targetCategory || targetCategory.userId !== args.userId) {
          throw new Error("Invalid reassignment category");
        }
        targetCategoryId = args.reassignToCategory;
      } else {
        // Find or create "Other" category
        let otherCategory = await ctx.db
          .query("categories")
          .withIndex("by_user_and_name", (q) =>
            q.eq("userId", args.userId).eq("name", "Other")
          )
          .first();

        if (!otherCategory) {
          // Create "Other" category
          const otherCategoryId = await ctx.db.insert("categories", {
            userId: args.userId,
            name: "Other",
            icon: "other",
            color: "#95A5A6",
            isDefault: true,
            createdAt: Date.now(),
          });
          otherCategory = await ctx.db.get(otherCategoryId);
        }

        if (!otherCategory) {
          throw new Error("Failed to create fallback category");
        }

        targetCategoryId = otherCategory._id;
      }

      // Reassign transactions
      for (const transaction of transactions) {
        await ctx.db.patch(transaction._id, {
          categoryId: targetCategoryId,
          updatedAt: Date.now(),
        });
        reassignedCount++;
      }

      // Reassign recurring transactions
      for (const recurringTransaction of recurringTransactions) {
        await ctx.db.patch(recurringTransaction._id, {
          categoryId: targetCategoryId,
          updatedAt: Date.now(),
        });
      }
    }

    // Delete the category
    await ctx.db.delete(args.categoryId);

    return {
      success: true,
      message:
        reassignedCount > 0
          ? `Category deleted successfully. ${reassignedCount} transactions were reassigned.`
          : "Category deleted successfully",
      reassignedTransactions: reassignedCount,
    };
  },
});

/**
 * Initialize default categories for a user
 * Create only missing predefined categories (skip existing ones)
 */
export const initializeDefaultCategories = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.id("categories")),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get existing categories for this user
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const existingCategoryNames = new Set(
      existingCategories.map((cat) => cat.name)
    );

    const currentTime = Date.now();
    const categoryIds: Id<"categories">[] = [];

    // Create only missing default categories
    for (const defaultCategory of DEFAULT_CATEGORIES) {
      if (!existingCategoryNames.has(defaultCategory.name)) {
        const categoryId = await ctx.db.insert("categories", {
          userId: args.userId,
          name: defaultCategory.name,
          icon: defaultCategory.icon,
          color: defaultCategory.color,
          isDefault: true,
          createdAt: currentTime,
        });
        categoryIds.push(categoryId);
      }
    }

    return categoryIds;
  },
});
