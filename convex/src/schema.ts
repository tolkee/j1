import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  
  // User management table - extended from Convex Auth
  users: defineTable({
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    // Custom user fields
    preferredName: v.optional(v.string()),
    timezone: v.optional(v.string()),
    // Audit fields
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"])
    .index("by_username", ["username"]),

  // User preferences and settings
  userSettings: defineTable({
    userId: v.id("users"),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    welcomeMessageSeen: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  // ==========================================
  // EXAMPLE SERVICE: Task Management
  // ==========================================
  // This is an example service demonstrating the patterns.
  // Replace with your own service tables.

  // Projects - top-level organization
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    isDefault: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_display_order", ["userId", "displayOrder"]),

  // Tasks - items within projects
  tasks: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_due_date", ["userId", "dueDate"])
    .index("by_project_and_status", ["projectId", "status"]),

  // ==========================================
  // FUTURE SERVICE PLACEHOLDERS
  // ==========================================
  // Add your own service tables here following the same patterns

  // Example: Note-taking service
  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    isPrivate: v.boolean(),
    lastEditedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_edited", ["userId", "lastEditedAt"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  // Example: File/document service
  documents: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("document"),
      v.literal("image"),
      v.literal("file")
    ),
    size: v.number(),
    mimeType: v.string(),
    storageId: v.optional(v.string()), // For Convex file storage
    url: v.optional(v.string()), // For external storage
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_created", ["userId", "createdAt"]),
});
