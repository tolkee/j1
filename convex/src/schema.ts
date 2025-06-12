import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // User management table - extended from Convex Auth
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    // Custom fields for Jarvis
    welcomeMessagePreference: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    timezone: v.optional(v.string()),
    // Audit fields (optional for backward compatibility)
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Welcome messages configuration
  welcomeMessages: defineTable({
    userId: v.id("users"),
    customMessage: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // Finance Service Tables

  // Bank accounts for users
  bankAccounts: defineTable({
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
    .index("by_user", ["userId"])
    .index("by_user_and_display_order", ["userId", "displayOrder"])
    .index("by_user_and_is_default", ["userId", "isDefault"]),

  // Categories for transaction categorization
  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"])
    .index("by_user_and_is_default", ["userId", "isDefault"]),

  // Individual transactions
  transactions: defineTable({
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
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_category", ["categoryId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_account_and_date", ["accountId", "date"])
    .index("by_recurring_transaction", ["recurringTransactionId"]),

  // Recurring transaction templates
  recurringTransactions: defineTable({
    userId: v.id("users"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    description: v.optional(v.string()),
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
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_user_and_next_execution", ["userId", "nextExecutionDate"])
    .index("by_next_execution_and_active", ["nextExecutionDate", "isActive"]),

  // Future service placeholder tables
  conversations: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_last_message", ["userId", "lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    timestamp: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_timestamp", ["conversationId", "timestamp"]),

  // User preferences and settings
  userSettings: defineTable({
    userId: v.id("users"),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
});
