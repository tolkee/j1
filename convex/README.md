# ⚡ Convex Backend

This is the Convex backend providing real-time database and serverless functions for the Fullstack Mobile Template.

## 🏗 Architecture Overview

The backend is organized around **services** - groups of related functions that handle specific business domains.

```
convex/
├── src/
│   ├── auth.ts              # Authentication configuration
│   ├── schema.ts            # Database schema definition
│   ├── users.ts             # User management functions
│   ├── tasks/               # Example: Tasks service
│   │   ├── projects.ts      # Project CRUD operations
│   │   ├── tasks.ts         # Task CRUD operations
│   │   └── setup.ts         # Service initialization
│   └── [your-service]/      # Add your services here
├── tests/                   # Function tests
│   └── tasks/               # Service-specific tests
└── scripts/                 # Utility scripts
    └── sync-api.sh          # API type generation
```

## 🔧 Function Types

Convex provides four types of functions:

### Queries (Read Operations)

```typescript
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    return await ctx.db
      .query("tableName")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(args.limit ?? 50);
  },
});
```

### Mutations (Write Operations)

```typescript
export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // Validation
    if (args.name.trim().length === 0) {
      throw new Error("Name is required");
    }
    
    // Create record
    const now = Date.now();
    return await ctx.db.insert("tableName", {
      userId,
      name: args.name.trim(),
      description: args.description?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

### Actions (External APIs)

```typescript
export const sendEmail = action({
  args: { to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    // Call external API
    const response = await fetch("https://api.email.com/send", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.EMAIL_API_KEY}` },
      body: JSON.stringify(args),
    });
    
    return { success: response.ok };
  },
});
```

### Crons (Scheduled Tasks)

```typescript
export const dailyCleanup = cron("0 0 * * *", async (ctx) => {
  // Runs daily at midnight
  const oldRecords = await ctx.db
    .query("tableName")
    .filter((q) => q.lt(q.field("createdAt"), Date.now() - 30 * 24 * 60 * 60 * 1000))
    .collect();
  
  for (const record of oldRecords) {
    await ctx.db.delete(record._id);
  }
});
```

## 🗄 Database Schema

### Schema Definition

```typescript
// convex/src/schema.ts
export default defineSchema({
  ...authTables, // Convex Auth tables
  
  // Your tables
  myTable: defineTable({
    userId: v.id("users"),        // User ownership
    name: v.string(),             // Required fields
    description: v.optional(v.string()), // Optional fields
    status: v.union(              // Enum-like fields
      v.literal("active"),
      v.literal("inactive")
    ),
    tags: v.optional(v.array(v.string())), // Arrays
    metadata: v.optional(v.object({        // Objects
      key: v.string(),
      value: v.number(),
    })),
    createdAt: v.number(),        // Audit fields
    updatedAt: v.number(),
  })
  // Indexes for efficient queries
  .index("by_user", ["userId"])
  .index("by_user_and_status", ["userId", "status"])
  .index("by_user_and_created", ["userId", "createdAt"]),
});
```

### Standard Patterns

Every table should follow these patterns:

1. **User Ownership**: Include `userId: v.id("users")` for multi-tenant isolation
2. **Audit Fields**: Include `createdAt` and `updatedAt` timestamps
3. **Proper Indexes**: Create indexes for common query patterns
4. **Validation**: Use Convex's validation system with proper types

## 🔐 Authentication

### Setup

Authentication is configured in `auth.config.ts`:

```typescript
export default {
  providers: [
    Password({ 
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
};
```

### Usage in Functions

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

export const myFunction = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Use userId for data isolation
    return await ctx.db
      .query("myTable")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

## 🧪 Testing

### Test Setup

Tests use `convex-test` for isolated testing:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import modules from "../_generated/modules";

test("create and list items", async () => {
  const t = convexTest(schema, modules);
  const asUser = t.withIdentity({ subject: "user123" });
  
  // Test creation
  const itemId = await asUser.mutation(api.myService.create, {
    name: "Test Item",
  });
  
  expect(itemId).toBeDefined();
  
  // Test listing
  const items = await asUser.query(api.myService.list);
  expect(items).toHaveLength(1);
  expect(items[0].name).toBe("Test Item");
});
```

### Testing Patterns

1. **User Isolation**: Test that users can only access their own data
2. **Validation**: Test input validation and error cases
3. **Business Logic**: Test complex business rules
4. **Edge Cases**: Test empty states, large data sets, etc.

## 🔄 API Type Generation

### Sync API Types

```bash
# Generate and sync API types to frontend
npm run sync-api
```

This generates TypeScript types in `_generated/api.ts` and syncs them to the frontend.

### Using Generated Types

```typescript
// In your React components
import { useQuery, useMutation } from "convex/react";
import { api } from "@/common/lib/api";

function MyComponent() {
  // Fully typed queries and mutations
  const items = useQuery(api.myService.list, { limit: 10 });
  const createItem = useMutation(api.myService.create);
  
  return (
    <div>
      {items?.map(item => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## 🛠 Development Commands

```bash
# From project root - use these task commands:

# Start development server
task convex:dev

# Deploy to production  
task convex:deploy

# Run tests
task convex:test

# Run tests in watch mode
task convex:test:watch

# Generate and sync API types
task convex:sync-api

# Or run directly in convex folder:
cd convex
pnpm dev             # Start development server
pnpm deploy          # Deploy to production
pnpm test            # Run tests
pnpm sync-api        # Generate API types
```

## 📊 Best Practices

### Function Design

1. **Single Responsibility**: Each function should have one clear purpose
2. **Input Validation**: Always validate function arguments
3. **Error Handling**: Provide clear, user-friendly error messages
4. **Documentation**: Document function purpose and parameters

### Database Design

1. **Normalization**: Avoid data duplication where possible
2. **Indexing**: Create indexes for common query patterns
3. **Data Types**: Use appropriate Convex value types
4. **Relationships**: Model relationships with proper foreign keys

### Performance

1. **Query Optimization**: Use appropriate indexes and filters
2. **Pagination**: Implement pagination for large data sets
3. **Batch Operations**: Group related operations when possible
4. **Caching**: Let Convex handle caching automatically

### Security

1. **Authentication**: Always check user authentication
2. **Authorization**: Verify user permissions for resources
3. **Input Sanitization**: Validate and sanitize all inputs
4. **Data Isolation**: Ensure users can only access their own data

## 📖 Adding a New Service

### 1. Create Service Directory

```bash
mkdir -p src/my-service
mkdir -p tests/my-service
```

### 2. Define Schema Tables

Add your tables to `src/schema.ts`:

```typescript
myEntity: defineTable({
  userId: v.id("users"),
  name: v.string(),
  // ... other fields
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_user_and_name", ["userId", "name"]),
```

### 3. Create Functions

Create CRUD functions in `src/my-service/`:

- `entities.ts` - Main CRUD operations
- `setup.ts` - Service initialization
- `utils.ts` - Service-specific utilities

### 4. Write Tests

Create comprehensive tests in `tests/my-service/`.

### 5. Sync API Types

```bash
npm run sync-api
```

### 6. Document Your Service

Create a `README.md` documenting your service's purpose and usage.

## 🚀 Deployment

### Development

Development uses the Convex development environment with real-time updates.

### Production

```bash
# Deploy to production
npm run deploy

# Configure environment variables
npx convex env set VARIABLE_NAME value
```

### Environment Variables

**Important**: Backend environment variables are managed through Convex, not `.env` files.

#### Setting Backend Environment Variables

```bash
# List current environment variables
npx convex env list

# Set a new environment variable
npx convex env set EMAIL_API_KEY your-api-key
npx convex env set WEBHOOK_SECRET your-webhook-secret

# Remove an environment variable
npx convex env unset VARIABLE_NAME
```

#### Frontend Environment Variables

Frontend environment variables go in the mobile app's `.env.local`:

```bash
# Mobile app environment (in project root)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Key Points**:
- **Backend vars**: Set via `npx convex env set` (secure, server-side only)
- **Frontend vars**: Set in `.env.local` with `EXPO_PUBLIC_` prefix (client-side accessible)
- Never put sensitive keys in frontend environment variables
- Frontend variables are bundled with the app and visible to users

## 📖 Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Database Best Practices](https://docs.convex.dev/database/advanced/best-practices)
- [Testing Guide](https://docs.convex.dev/functions/testing)

---

This Convex backend provides a solid foundation for building scalable, real-time applications with strong type safety and excellent developer experience.