import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List tasks for the authenticated user
 */
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    let query;
    
    if (args.projectId) {
      // Verify project ownership
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Project not found or access denied");
      }

      if (args.status) {
        query = ctx.db
          .query("tasks")
          .withIndex("by_project_and_status", (q) => 
            q.eq("projectId", args.projectId!).eq("status", args.status!)
          );
      } else {
        query = ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId!));
      }
    } else {
      if (args.status) {
        query = ctx.db
          .query("tasks")
          .withIndex("by_user_and_status", (q) => 
            q.eq("userId", userId).eq("status", args.status!)
          );
      } else {
        query = ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", userId));
      }
    }

    const limit = args.limit ?? 50;
    let tasks = await query.take(limit);

    // Filter by priority if specified
    if (args.priority) {
      tasks = tasks.filter(task => task.priority === args.priority);
    }

    // Sort by creation date (newest first)
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single task by ID
 */
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Access denied");
    }

    return task;
  },
});

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Validate input
    if (args.title.trim().length === 0) {
      throw new Error("Task title is required");
    }
    
    if (args.title.length > 200) {
      throw new Error("Task title must be less than 200 characters");
    }

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("Access denied to project");
    }

    // Validate due date
    if (args.dueDate && args.dueDate < Date.now()) {
      throw new Error("Due date cannot be in the past");
    }

    // Clean and validate tags
    const cleanTags = args.tags
      ?.map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Max 10 tags

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId,
      projectId: args.projectId,
      title: args.title.trim(),
      description: args.description?.trim(),
      status: "todo",
      priority: args.priority,
      dueDate: args.dueDate,
      completedAt: undefined,
      tags: cleanTags,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

/**
 * Update an existing task
 */
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get existing task
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Task not found");
    }

    if (existing.userId !== userId) {
      throw new Error("Access denied");
    }

    // Validate updates
    const updates: Partial<typeof existing> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      if (args.title.trim().length === 0) {
        throw new Error("Task title cannot be empty");
      }
      if (args.title.length > 200) {
        throw new Error("Task title must be less than 200 characters");
      }
      updates.title = args.title.trim();
    }

    if (args.description !== undefined) {
      updates.description = args.description?.trim();
    }

    if (args.status !== undefined) {
      updates.status = args.status;
      
      // Set completion time when marking as completed
      if (args.status === "completed" && existing.status !== "completed") {
        updates.completedAt = Date.now();
      } else if (args.status !== "completed") {
        updates.completedAt = undefined;
      }
    }

    if (args.priority !== undefined) {
      updates.priority = args.priority;
    }

    if (args.dueDate !== undefined) {
      if (args.dueDate && args.dueDate < Date.now()) {
        throw new Error("Due date cannot be in the past");
      }
      updates.dueDate = args.dueDate;
    }

    if (args.tags !== undefined) {
      const cleanTags = args.tags
        ?.map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Max 10 tags
      updates.tags = cleanTags;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Delete a task
 */
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get task
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Access denied");
    }

    // Delete the task
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Toggle task completion status
 */
export const toggleComplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get task
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== userId) {
      throw new Error("Access denied");
    }

    // Toggle completion status
    const newStatus = task.status === "completed" ? "todo" : "completed";
    const updates: Partial<typeof task> = {
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (newStatus === "completed") {
      updates.completedAt = Date.now();
    } else {
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Get tasks due soon
 */
export const getDueSoon = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const daysAhead = args.days ?? 7;
    const endDate = Date.now() + (daysAhead * 24 * 60 * 60 * 1000);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_due_date", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.neq(q.field("status"), "completed"),
          q.lte(q.field("dueDate"), endDate)
        )
      )
      .collect();

    return tasks.sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
  },
});

/**
 * Get overdue tasks
 */
export const getOverdue = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const now = Date.now();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.neq(q.field("status"), "completed"),
          q.lt(q.field("dueDate"), now)
        )
      )
      .collect();

    return tasks.sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  },
});

/**
 * Search tasks by title and description
 */
export const search = query({
  args: {
    query: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    if (args.query.trim().length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }

    const searchTerm = args.query.trim().toLowerCase();

    let query;
    if (args.projectId) {
      // Verify project ownership
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Project not found or access denied");
      }

      query = ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId!));
    } else {
      query = ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId));
    }

    const allTasks = await query.collect();

    // Filter tasks that match the search term
    const matchingTasks = allTasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = task.description?.toLowerCase().includes(searchTerm) ?? false;
      const tagMatch = task.tags?.some(tag => tag.includes(searchTerm)) ?? false;

      return titleMatch || descriptionMatch || tagMatch;
    });

    return matchingTasks.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Cleanup old completed tasks (used by cron job)
 * Removes completed tasks older than 30 days
 */
export const cleanupOldTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Find old completed tasks
    const oldTasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "completed"),
          q.lt(q.field("completedAt"), thirtyDaysAgo)
        )
      )
      .collect();

    // Delete old tasks
    let deletedCount = 0;
    for (const task of oldTasks) {
      await ctx.db.delete(task._id);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} old completed tasks`);
    return { success: true, deletedCount };
  },
});