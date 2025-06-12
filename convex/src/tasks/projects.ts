import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List all projects for the authenticated user
 */
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    let query = ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      query = ctx.db
        .query("projects")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", userId).eq("status", args.status!)
        );
    }

    const limit = args.limit ?? 50;
    const projects = await query
      .order("asc")
      .take(limit);

    return projects.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get a single project by ID
 */
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    return project;
  },
});

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Validate input
    if (args.name.trim().length === 0) {
      throw new Error("Project name is required");
    }
    
    if (args.name.length > 100) {
      throw new Error("Project name must be less than 100 characters");
    }

    // Check for duplicate names
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name.trim()))
      .first();

    if (existingProject) {
      throw new Error("A project with this name already exists");
    }

    // Get the next display order
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const maxOrder = Math.max(0, ...existingProjects.map(p => p.displayOrder));
    const isFirstProject = existingProjects.length === 0;

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      userId,
      name: args.name.trim(),
      description: args.description?.trim(),
      color: args.color,
      icon: args.icon,
      status: "active",
      isDefault: isFirstProject,
      displayOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Update an existing project
 */
export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get existing project
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (existing.userId !== userId) {
      throw new Error("Access denied");
    }

    // Validate updates
    const updates: Partial<typeof existing> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      if (args.name.trim().length === 0) {
        throw new Error("Project name cannot be empty");
      }
      if (args.name.length > 100) {
        throw new Error("Project name must be less than 100 characters");
      }
      
      // Check for duplicate names (excluding current project)
      const duplicateProject = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("name"), args.name!.trim()))
        .first();

      if (duplicateProject && duplicateProject._id !== args.id) {
        throw new Error("A project with this name already exists");
      }

      updates.name = args.name.trim();
    }

    if (args.description !== undefined) {
      updates.description = args.description?.trim();
    }

    if (args.color !== undefined) {
      updates.color = args.color;
    }

    if (args.icon !== undefined) {
      updates.icon = args.icon;
    }

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Delete a project and all its tasks
 */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get project
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    // Delete all tasks in this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete the project
    await ctx.db.delete(args.id);

    return args.id;
  },
});

/**
 * Reorder projects
 */
export const reorder = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Verify all projects belong to the user
    for (const projectId of args.projectIds) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Invalid project in reorder list");
      }
    }

    // Update display orders
    for (let i = 0; i < args.projectIds.length; i++) {
      await ctx.db.patch(args.projectIds[i], {
        displayOrder: i + 1,
        updatedAt: Date.now(),
      });
    }

    return args.projectIds;
  },
});

/**
 * Get project statistics
 */
export const getStats = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Verify project ownership
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    // Get all tasks for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    // Calculate statistics
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
      todoTasks: tasks.filter(t => t.status === "todo").length,
      overdueTasks: 0,
      highPriorityTasks: tasks.filter(t => t.priority === "high").length,
    };

    // Count overdue tasks
    const now = Date.now();
    stats.overdueTasks = tasks.filter(t => 
      t.dueDate && t.dueDate < now && t.status !== "completed"
    ).length;

    return stats;
  },
});

/**
 * Generate weekly project summary (used by cron job)
 * Creates a summary of project activity for the past week
 */
export const generateWeeklySummary = mutation({
  args: {},
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Get all active projects
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const summaries = [];
    
    for (const project of projects) {
      // Get tasks completed this week
      const completedThisWeek = await ctx.db
        .query("tasks")
        .filter((q) => 
          q.and(
            q.eq(q.field("projectId"), project._id),
            q.eq(q.field("status"), "completed"),
            q.gte(q.field("completedAt"), oneWeekAgo)
          )
        )
        .collect();

      // Get tasks created this week
      const createdThisWeek = await ctx.db
        .query("tasks")
        .filter((q) => 
          q.and(
            q.eq(q.field("projectId"), project._id),
            q.gte(q.field("createdAt"), oneWeekAgo)
          )
        )
        .collect();

      summaries.push({
        projectId: project._id,
        projectName: project.name,
        tasksCompleted: completedThisWeek.length,
        tasksCreated: createdThisWeek.length,
        weekEnding: new Date().toISOString(),
      });
    }

    console.log(`Generated weekly summary for ${summaries.length} projects`);
    return { success: true, summaries };
  },
});