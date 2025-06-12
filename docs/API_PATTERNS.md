# 🔌 API Patterns & Backend Guidelines

This document outlines the patterns, conventions, and best practices for developing backend functions with Convex in the Fullstack Mobile Template.

## 📋 Table of Contents

- [Function Types & Patterns](#function-types--patterns)
- [Database Schema Patterns](#database-schema-patterns)
- [Authentication Patterns](#authentication-patterns)
- [Validation Patterns](#validation-patterns)
- [Error Handling](#error-handling)
- [Query Optimization](#query-optimization)
- [Testing Patterns](#testing-patterns)
- [Common Recipes](#common-recipes)

## Function Types & Patterns

### Query Functions (Read Operations)

Queries are read-only operations that can be subscribed to for real-time updates.

```typescript
// Basic query pattern
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // 2. Build query with user isolation
    const query = ctx.db
      .query("tableName")
      .withIndex("by_user", (q) => q.eq("userId", userId));
    
    // 3. Apply pagination
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    
    const results = await query.collect();
    return results.slice(offset, offset + limit);
  },
});

// Query with filters
export const listByStatus = query({
  args: {
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    return await ctx.db
      .query("tableName")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", args.status)
      )
      .take(args.limit ?? 50);
  },
});

// Single item query
export const get = query({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }
    
    // Verify ownership
    if (item.userId !== userId) {
      throw new Error("Access denied");
    }
    
    return item;
  },
});
```

### Mutation Functions (Write Operations)

Mutations modify data and should include validation and business logic.

```typescript
// Create pattern
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    // Use strict validation
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // 2. Input validation
    if (args.name.trim().length === 0) {
      throw new Error("Name is required");
    }
    if (args.name.length > 100) {
      throw new Error("Name must be less than 100 characters");
    }
    
    // 3. Business logic validation
    const existingItem = await ctx.db
      .query("tableName")
      .withIndex("by_user_and_name", (q) => 
        q.eq("userId", userId).eq("name", args.name.trim())
      )
      .first();
    
    if (existingItem) {
      throw new Error("Item with this name already exists");
    }
    
    // 4. Create the item
    const now = Date.now();
    const itemId = await ctx.db.insert("tableName", {
      userId,
      name: args.name.trim(),
      description: args.description?.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    
    return itemId;
  },
});

// Update pattern
export const update = mutation({
  args: {
    id: v.id("tableName"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // 1. Get existing item
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Item not found");
    }
    
    // 2. Verify ownership
    if (existing.userId !== userId) {
      throw new Error("Access denied");
    }
    
    // 3. Validate updates
    const updates: Partial<typeof existing> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) {
      if (args.name.trim().length === 0) {
        throw new Error("Name cannot be empty");
      }
      updates.name = args.name.trim();
    }
    
    if (args.description !== undefined) {
      updates.description = args.description?.trim();
    }
    
    // 4. Apply updates
    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Delete pattern
export const remove = mutation({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // 1. Get item
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }
    
    // 2. Verify ownership
    if (item.userId !== userId) {
      throw new Error("Access denied");
    }
    
    // 3. Check for dependencies (optional)
    const dependencies = await ctx.db
      .query("dependentTable")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .first();
    
    if (dependencies) {
      throw new Error("Cannot delete item with dependencies");
    }
    
    // 4. Delete
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});
```

### Action Functions (External APIs)

Actions can call external APIs and don't have real-time subscriptions.

```typescript
export const sendNotification = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");
    
    // 2. Get user data
    const user = await ctx.runQuery(api.users.get, { id: args.userId });
    if (!user) throw new Error("User not found");
    
    // 3. Call external API
    try {
      const response = await fetch("https://api.notifications.com/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NOTIFICATION_API_KEY}`,
        },
        body: JSON.stringify({
          email: user.email,
          message: args.message,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send notification");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Notification error:", error);
      throw new Error("Failed to send notification");
    }
  },
});
```

## Database Schema Patterns

### Standard Table Pattern

```typescript
// convex/src/schema.ts
export default defineSchema({
  // Standard entity table
  entities: defineTable({
    // User ownership (required for multi-tenant)
    userId: v.id("users"),
    
    // Entity-specific fields
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("draft")
    ),
    
    // Optional fields
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.object({
      key1: v.string(),
      key2: v.number(),
    })),
    
    // Audit fields (always include)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  // Essential indexes
  .index("by_user", ["userId"])
  .index("by_user_and_status", ["userId", "status"])
  .index("by_user_and_created", ["userId", "createdAt"])
  .index("by_user_and_name", ["userId", "name"]),
});
```

### Relationship Patterns

```typescript
// One-to-many relationship
parentEntities: defineTable({
  userId: v.id("users"),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"]),

childEntities: defineTable({
  userId: v.id("users"),
  parentId: v.id("parentEntities"),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_parent", ["parentId"])
.index("by_user_and_parent", ["userId", "parentId"]),

// Many-to-many relationship (via junction table)
entityTags: defineTable({
  userId: v.id("users"),
  entityId: v.id("entities"),
  tagId: v.id("tags"),
  createdAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_entity", ["entityId"])
.index("by_tag", ["tagId"])
.index("by_entity_and_tag", ["entityId", "tagId"]),
```

## Authentication Patterns

### Basic Authentication

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

export const myFunction = query({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Get authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Use userId for queries
    return await ctx.db
      .query("myTable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

### Role-Based Access Control

```typescript
// Helper function to get user with role
async function getAuthenticatedUserWithRole(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  
  return user;
}

// Function with role check
export const adminOnlyFunction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserWithRole(ctx);
    
    if (user.role !== "admin") {
      throw new Error("Admin access required");
    }
    
    // Admin logic here
  },
});
```

### Resource Ownership Verification

```typescript
async function verifyOwnership(
  ctx: QueryCtx | MutationCtx, 
  resourceId: Id<"tableName">, 
  userId: Id<"users">
) {
  const resource = await ctx.db.get(resourceId);
  if (!resource) {
    throw new Error("Resource not found");
  }
  
  if (resource.userId !== userId) {
    throw new Error("Access denied");
  }
  
  return resource;
}

export const updateMyResource = mutation({
  args: {
    id: v.id("tableName"),
    updates: v.object({ /* ... */ }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // Verify ownership
    await verifyOwnership(ctx, args.id, userId);
    
    // Proceed with update
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});
```

## Validation Patterns

### Input Validation

```typescript
// Validation helper functions
function validateString(value: string, fieldName: string, maxLength = 255) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
  
  return trimmed;
}

function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  return email.toLowerCase();
}

// Using validation in functions
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const name = validateString(args.name, "Name", 100);
    const email = validateEmail(args.email);
    
    // Continue with validated data
    const userId = await ctx.db.insert("users", {
      name,
      email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return userId;
  },
});
```

### Business Logic Validation

```typescript
export const createProject = mutation({
  args: {
    name: v.string(),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // 1. Validate team membership
    const teamMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();
    
    if (!teamMembership) {
      throw new Error("Not a member of this team");
    }
    
    // 2. Check project limits
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    if (existingProjects.length >= 10) {
      throw new Error("Maximum projects per team reached");
    }
    
    // 3. Check name uniqueness
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_team_and_name", (q) => 
        q.eq("teamId", args.teamId).eq("name", args.name)
      )
      .first();
    
    if (existingProject) {
      throw new Error("Project name already exists in this team");
    }
    
    // 4. Create project
    return await ctx.db.insert("projects", {
      name: args.name,
      teamId: args.teamId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

## Error Handling

### Structured Error Responses

```typescript
// Error types
type ErrorCode = 
  | "AUTHENTICATION_REQUIRED"
  | "ACCESS_DENIED"
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "BUSINESS_RULE_VIOLATION";

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Usage in functions
export const myFunction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new AppError("AUTHENTICATION_REQUIRED", "Please log in");
      }
      
      // Function logic...
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Re-throw structured errors
      }
      
      // Log unexpected errors
      console.error("Unexpected error in myFunction:", error);
      throw new AppError("INTERNAL_ERROR", "An unexpected error occurred");
    }
  },
});
```

### Graceful Error Handling

```typescript
export const safeFunction = query({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    try {
      const item = await ctx.db.get(args.id);
      return { success: true, data: item };
    } catch (error) {
      console.error("Error in safeFunction:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});
```

## Query Optimization

### Efficient Indexing

```typescript
// Good: Use appropriate indexes
export const listUserItems = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    if (args.status) {
      // Use compound index for filtered queries
      return await ctx.db
        .query("items")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", userId).eq("status", args.status)
        )
        .collect();
    } else {
      // Use user index for all items
      return await ctx.db
        .query("items")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }
  },
});
```

### Pagination Patterns

```typescript
// Cursor-based pagination
export const listWithCursor = query({
  args: {
    cursor: v.optional(v.id("tableName")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    const limit = Math.min(args.limit ?? 20, 100);
    
    let query = ctx.db
      .query("tableName")
      .withIndex("by_user_and_created", (q) => q.eq("userId", userId));
    
    if (args.cursor) {
      const cursorItem = await ctx.db.get(args.cursor);
      if (cursorItem) {
        query = query.filter((q) => 
          q.lt(q.field("createdAt"), cursorItem.createdAt)
        );
      }
    }
    
    const items = await query.order("desc").take(limit + 1);
    
    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? results[results.length - 1]?._id : null;
    
    return {
      items: results,
      nextCursor,
      hasMore,
    };
  },
});
```

## Testing Patterns

### Complete Function Testing

```typescript
// convex/tests/myService/myEntity.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import modules from "../_generated/modules";

describe("myEntity functions", () => {
  test("create and list entities", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user123" });
    
    // Test creation
    const entityId = await asUser.mutation(api.myEntity.create, {
      name: "Test Entity",
      description: "Test description",
    });
    
    expect(entityId).toBeDefined();
    
    // Test listing
    const entities = await asUser.query(api.myEntity.list);
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe("Test Entity");
    expect(entities[0].userId).toBe("user123");
  });
  
  test("user isolation", async () => {
    const t = convexTest(schema, modules);
    const user1 = t.withIdentity({ subject: "user1" });
    const user2 = t.withIdentity({ subject: "user2" });
    
    // User 1 creates entity
    await user1.mutation(api.myEntity.create, { name: "User 1 Entity" });
    
    // User 2 creates entity
    await user2.mutation(api.myEntity.create, { name: "User 2 Entity" });
    
    // Each user should only see their own entities
    const user1Entities = await user1.query(api.myEntity.list);
    const user2Entities = await user2.query(api.myEntity.list);
    
    expect(user1Entities).toHaveLength(1);
    expect(user2Entities).toHaveLength(1);
    expect(user1Entities[0].name).toBe("User 1 Entity");
    expect(user2Entities[0].name).toBe("User 2 Entity");
  });
  
  test("validation errors", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user123" });
    
    // Test empty name validation
    await expect(
      asUser.mutation(api.myEntity.create, { name: "" })
    ).rejects.toThrow("Name is required");
    
    // Test duplicate name validation
    await asUser.mutation(api.myEntity.create, { name: "Unique Name" });
    await expect(
      asUser.mutation(api.myEntity.create, { name: "Unique Name" })
    ).rejects.toThrow("already exists");
  });
});
```

## Common Recipes

### Setup Functions

```typescript
// convex/src/myService/setup.ts
export const initializeService = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // Check if already initialized
    const existing = await ctx.db
      .query("myServiceSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    // Create default settings
    return await ctx.db.insert("myServiceSettings", {
      userId,
      isInitialized: true,
      preferences: {
        theme: "light",
        notifications: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Bulk Operations

```typescript
export const bulkUpdate = mutation({
  args: {
    ids: v.array(v.id("tableName")),
    updates: v.object({
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    const now = Date.now();
    const results = [];
    
    for (const id of args.ids) {
      // Verify ownership
      const item = await ctx.db.get(id);
      if (!item || item.userId !== userId) {
        continue; // Skip unauthorized items
      }
      
      // Apply updates
      await ctx.db.patch(id, {
        ...args.updates,
        updatedAt: now,
      });
      
      results.push(id);
    }
    
    return results;
  },
});
```

### Aggregation Queries

```typescript
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    const items = await ctx.db
      .query("myTable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const stats = {
      total: items.length,
      byStatus: {} as Record<string, number>,
      recentCount: 0,
    };
    
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const item of items) {
      // Count by status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      
      // Count recent items
      if (item.createdAt > oneWeekAgo) {
        stats.recentCount++;
      }
    }
    
    return stats;
  },
});
```

---

These patterns provide a solid foundation for building robust, scalable backend functions with Convex. Follow these conventions for consistent, maintainable code that works well with AI development tools.