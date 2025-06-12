import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Initialize the tasks service for a new user
 * Creates a default project and some sample tasks
 */
export const initializeTasksService = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Check if user already has projects
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingProjects.length > 0) {
      return { alreadyInitialized: true, projectId: existingProjects[0]._id };
    }

    const now = Date.now();

    // Create default project
    const defaultProjectId = await ctx.db.insert("projects", {
      userId,
      name: "My First Project",
      description: "Welcome to your task management system! This is your first project.",
      color: "#3b82f6", // Blue
      icon: "📋",
      status: "active",
      isDefault: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Create sample tasks
    const sampleTasks = [
      {
        title: "Welcome to your task manager!",
        description: "This is your first task. You can edit or delete it anytime.",
        priority: "medium" as const,
        status: "todo" as const,
      },
      {
        title: "Try creating a new task",
        description: "Click the + button to add your own tasks.",
        priority: "low" as const,
        status: "todo" as const,
      },
      {
        title: "Mark tasks as complete",
        description: "Click on a task to mark it as done.",
        priority: "high" as const,
        status: "completed" as const,
        completedAt: now - 1000, // Completed 1 second ago
      },
    ];

    const taskIds = [];
    for (const task of sampleTasks) {
      const taskId = await ctx.db.insert("tasks", {
        userId,
        projectId: defaultProjectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: undefined,
        completedAt: task.completedAt,
        tags: ["sample", "getting-started"],
        createdAt: now,
        updatedAt: now,
      });
      taskIds.push(taskId);
    }

    return {
      initialized: true,
      projectId: defaultProjectId,
      taskIds,
    };
  },
});

/**
 * Check if the user has initialized the tasks service
 */
export const isInitialized = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      isInitialized: projects.length > 0,
      projectCount: projects.length,
    };
  },
});

/**
 * Reset the tasks service (delete all projects and tasks)
 * USE WITH CAUTION - This will delete all user data
 */
export const reset = mutation({
  args: {
    confirmReset: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    if (!args.confirmReset) {
      throw new Error("Reset confirmation required");
    }

    // Delete all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const project of projects) {
      await ctx.db.delete(project._id);
    }

    return {
      deletedTasks: tasks.length,
      deletedProjects: projects.length,
    };
  },
});

/**
 * Get user's tasks and projects summary
 */
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Get all projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate statistics
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "active").length,
      completedProjects: projects.filter(p => p.status === "completed").length,
      
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === "todo").length,
      inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      
      overdueTasks: tasks.filter(t => 
        t.dueDate && t.dueDate < now && t.status !== "completed"
      ).length,
      
      dueSoonTasks: tasks.filter(t => 
        t.dueDate && t.dueDate > now && t.dueDate < now + 7 * 24 * 60 * 60 * 1000 && t.status !== "completed"
      ).length,
      
      highPriorityTasks: tasks.filter(t => 
        t.priority === "high" && t.status !== "completed"
      ).length,
      
      recentlyCreatedTasks: tasks.filter(t => t.createdAt > oneWeekAgo).length,
      recentlyCompletedTasks: tasks.filter(t => 
        t.completedAt && t.completedAt > oneWeekAgo
      ).length,
    };

    return {
      isInitialized: projects.length > 0,
      stats,
      recentProjects: projects
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
      recentTasks: tasks
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10),
    };
  },
});