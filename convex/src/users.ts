import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all users (for admin purposes or testing)
 */
export const getAllUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Get user settings
 */
export const getUserSettings = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("userSettings"),
      _creationTime: v.number(),
      userId: v.id("users"),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
      language: v.optional(v.string()),
      notificationsEnabled: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();
  },
});

/**
 * Update user settings
 */
export const updateUserSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    if (!settings) {
      return {
        success: false,
        message: "User settings not found",
      };
    }

    const updates: any = {};
    if (args.theme !== undefined) updates.theme = args.theme;
    if (args.language !== undefined) updates.language = args.language;
    if (args.notificationsEnabled !== undefined) {
      updates.notificationsEnabled = args.notificationsEnabled;
    }

    await ctx.db.patch(settings._id, updates);

    return {
      success: true,
      message: "Settings updated successfully",
    };
  },
});

/**
 * Delete a user and all associated data
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Delete user settings
    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();
    if (settings) {
      await ctx.db.delete(settings._id);
    }

    // Delete user's projects and tasks
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    for (const project of projects) {
      // Delete all tasks in this project
      const tasks = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("projectId"), project._id))
        .collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
      // Delete the project
      await ctx.db.delete(project._id);
    }

    // Delete user's notes
    const notes = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete user's documents
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    for (const document of documents) {
      await ctx.db.delete(document._id);
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);

    return {
      success: true,
      message: "User and all associated data deleted successfully",
    };
  },
});

/**
 * Get current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(userId);
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    email: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {};
    if (args.email !== undefined) updates.email = args.email;
    if (args.username !== undefined) updates.username = args.username;
    updates.updatedAt = Date.now();

    await ctx.db.patch(userId, updates);

    return {
      success: true,
      message: "Profile updated successfully",
    };
  },
});

/**
 * Initialize user data after first signup
 */
export const initializeUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user data is already initialized
    const existingSettings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingSettings) {
      return { success: true, message: "User data already initialized" };
    }

    // Create default user settings
    await ctx.db.insert("userSettings", {
      userId,
      theme: "light",
      language: "en",
      notificationsEnabled: true,
      welcomeMessageSeen: false,
    });

    // Update user profile with defaults
    await ctx.db.patch(userId, {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "User data initialized successfully",
    };
  },
});
