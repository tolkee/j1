# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**j1** is a production-ready fullstack mobile application template specifically designed for AI development tools. Built with React Native + Expo Router (frontend) and Convex (real-time serverless backend).

### Technology Stack
- **Frontend**: React Native, Expo Router, Tamagui v3 (universal design system)
- **Backend**: Convex (serverless functions + real-time database + auth)
- **Authentication**: Convex Auth with email/password
- **Type Safety**: Full TypeScript with auto-generated API types
- **Testing**: Vitest (backend), Jest (frontend)

## Essential Development Commands

**Always use Task runner** - commands are in `Taskfile.yml`:

### Core Development
- `task dev` - Start both frontend and backend development servers
- `task install` - Install all dependencies (app + backend)  
- `task init` - Initialize project with Convex setup and dependencies
- `task test` - Run all tests
- `task clean` - Clean build artifacts

### Critical Backend Commands
- `task convex:sync-api` - **MUST RUN**: Generate and sync API types to frontend (run after ANY backend changes)
- `task convex:dev` - Start Convex backend only
- `task convex:test` - Run backend tests
- `task convex:deploy` - Deploy backend to production

### Frontend Commands  
- `task app:dev` - Start Expo development server
- `task app:ios` - Run on iOS simulator
- `task app:android` - Run on Android emulator
- `task app:web` - Run in web browser

## Service-Oriented Architecture

Features are organized as self-contained services following consistent patterns:

```
app/services/[service-name]/
├── README.md               # Service documentation
├── components/             # UI components  
├── contexts/              # React contexts for state
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
└── lib/                   # Utilities

convex/src/[service-name]/
├── [entity].ts            # CRUD operations
└── setup.ts              # Service initialization
```

## Database Schema Patterns

All tables in `convex/src/schema.ts` follow this standard pattern:

```typescript
tableName: defineTable({
  userId: v.id("users"),           // Multi-tenant user ownership (required)
  // ... entity-specific fields
  createdAt: v.number(),           // Standard audit fields (required)
  updatedAt: v.number(),
})
.index("by_user", ["userId"])      // Standard user-scoped index (required)
```

## API Integration Flow

**Critical Workflow** - Follow this exact sequence:

1. **Backend**: Define/modify functions in `convex/src/[service]/`
2. **Sync Types**: Run `task convex:sync-api` (MANDATORY after backend changes)
3. **Frontend**: Use fully-typed API with `useQuery`/`useMutation`

Example frontend usage:
```typescript
const data = useQuery(api.myService.list, { limit: 10 });
const create = useMutation(api.myService.create);
```

## Authentication System

- **Backend**: Convex Auth with Password provider (`convex/src/auth.ts`)
- **Frontend**: React Context (`app/services/auth/contexts/AuthContext.tsx`)  
- **User Isolation**: All functions must check `getAuthUserId(ctx)` for multi-tenant security
- **Route Protection**: Authentication guards in layouts

## Function Development Patterns

### Standard Query Pattern
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

### Standard Mutation Pattern
```typescript
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    
    // Validation
    if (args.name.trim().length === 0) {
      throw new Error("Name is required");
    }
    
    const now = Date.now();
    return await ctx.db.insert("tableName", {
      userId,
      name: args.name.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

## Environment Configuration

### Backend (Convex)
- Use `npx convex env set VARIABLE_NAME value` (no .env files)
- Variables are secure and server-side only

### Frontend  
- Use `app/.env.local` for client variables
- Prefix with `EXPO_PUBLIC_` for public variables
- `EXPO_PUBLIC_CONVEX_URL` connects to backend

## Testing Patterns

### Backend Testing (`convex/tests/`)
```typescript
test("user isolation", async () => {
  const t = convexTest(schema, modules);
  const user1 = t.withIdentity({ subject: "user1" });
  const user2 = t.withIdentity({ subject: "user2" });
  
  await user1.mutation(api.service.create, { name: "User 1 Item" });
  await user2.mutation(api.service.create, { name: "User 2 Item" });
  
  const user1Items = await user1.query(api.service.list);
  const user2Items = await user2.query(api.service.list);
  
  expect(user1Items).toHaveLength(1);
  expect(user2Items).toHaveLength(1);
});
```

## Critical Development Rules

1. **ALWAYS run `task convex:sync-api`** after backend changes - API types will be stale otherwise
2. **Follow service architecture patterns** - use existing services as templates (`app/services/tasks/` and `convex/src/tasks/`)
3. **Include user isolation** - every backend function must verify `userId` for security
4. **Use standard schema pattern** - include `userId`, `createdAt`, `updatedAt`, and proper indexes
5. **Write tests** - follow patterns in `convex/tests/tasks/`

## Example Service Implementation

Reference the **Tasks Service** (`app/services/tasks/` and `convex/src/tasks/`) for complete patterns:
- CRUD operations with validation
- User isolation and access control  
- Comprehensive testing
- Frontend component architecture
- React Context state management

## Key Reference Files

- **Commands**: `Taskfile.yml` (all available tasks)
- **Architecture**: `docs/ARCHITECTURE.md` (system design)
- **Development**: `docs/DEVELOPMENT.md` (workflows and patterns)
- **API Patterns**: `docs/API_PATTERNS.md` (backend function patterns)
- **Schema**: `convex/src/schema.ts` (database structure)
- **Example Service**: `convex/src/tasks/` and `app/services/tasks/`

## Linting and Type Checking

After making changes, run these to ensure code quality:
- **Backend**: `cd convex && npm run lint && npm run typecheck`  
- **Frontend**: `cd app && npm run lint && npm run typecheck`
- **All**: `task test` (includes linting and tests)

## Common Pitfalls for AI Development

- **Forgetting API sync**: Always run `task convex:sync-api` after backend changes
- **Missing user isolation**: Every backend function needs `getAuthUserId(ctx)` check
- **Schema violations**: Follow the standard table pattern with required fields
- **Taskfile YAML syntax**: Avoid colons in echo commands (use dashes or quotes)
- **Environment variables**: Backend uses Convex env, frontend uses .env.local