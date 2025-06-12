# 🛠 Development Guide

This guide provides comprehensive instructions for developing with the Fullstack Mobile Template. It's designed for both human developers and AI development tools.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Daily Development Workflow](#daily-development-workflow)
- [Adding New Features](#adding-new-features)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Testing Guidelines](#testing-guidelines)
- [Code Style & Conventions](#code-style--conventions)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

Ensure you have these tools installed:

```bash
# Node.js (18+)
node --version

# Package managers
npm --version
yarn --version

# Task runner
task --version

# Expo CLI
npx expo --version
```

### Initial Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd fullstack-mobile-template

# 2. Complete setup
task setup

# 3. Configure Convex (first time only)
cd convex
npx convex login
npx convex dev --configure

# 4. Start development
task dev
```

## Daily Development Workflow

### 1. Start Development Environment

```bash
# Start everything
task dev

# OR start separately for debugging
task convex:dev  # Terminal 1 - Backend
task app:dev     # Terminal 2 - Frontend
```

### 2. Sync API Types (When Backend Changes)

```bash
# After changing Convex functions or schema
task convex:sync-api
```

### 3. Run Tests

```bash
# Run all tests
task test

# Run tests in watch mode
task test:watch

# Run specific backend tests
task convex:test

# Run specific frontend tests
task app:test
```

## Adding New Features

### 1. Plan the Feature

Before coding, consider:
- Which service does this belong to?
- What data models are needed?
- What API endpoints are required?
- What UI components are needed?

### 2. Backend Development First

1. **Update Schema** (`convex/src/schema.ts`)
2. **Create Functions** (`convex/src/[service]/`)
3. **Write Tests** (`convex/tests/[service]/`)
4. **Sync API Types** (`task convex:sync-api`)

### 3. Frontend Development

1. **Create Components** (`app/services/[service]/components/`)
2. **Add Hooks** (`app/services/[service]/hooks/`)
3. **Create Pages** (`app/app/[service]/`)
4. **Add Navigation** (update `_layout.tsx`)

### 4. Integration Testing

Test the complete feature end-to-end.

## Backend Development

### Database Schema Design

```typescript
// convex/src/schema.ts
export default defineSchema({
  // Standard table pattern
  myEntity: defineTable({
    // Always include user ownership
    userId: v.id("users"),
    
    // Entity-specific fields
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    
    // Audit fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  // Standard indexes
  .index("by_user", ["userId"])
  .index("by_user_and_status", ["userId", "status"])
  .index("by_user_and_created", ["userId", "createdAt"]),
});
```

### Function Development Patterns

#### Query Function

```typescript
// convex/src/myService/myEntity.ts
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Not authenticated");
    
    // 2. Build query
    let query = ctx.db
      .query("myEntity")
      .withIndex("by_user", (q) => q.eq("userId", user));
    
    // 3. Apply filters
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    // 4. Apply pagination
    const limit = args.limit ?? 50;
    const results = await query.take(limit);
    
    return results;
  },
});
```

#### Mutation Function

```typescript
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Not authenticated");
    
    // 2. Validation
    if (args.name.trim().length === 0) {
      throw new Error("Name is required");
    }
    
    // 3. Business logic
    const now = Date.now();
    const entityId = await ctx.db.insert("myEntity", {
      userId: user,
      name: args.name.trim(),
      description: args.description,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    
    return entityId;
  },
});
```

### Function Organization

```
convex/src/myService/
├── entities.ts          # Main CRUD operations
├── setup.ts            # Service initialization
├── utils.ts            # Service-specific utilities
└── types.ts            # Service-specific types
```

### Testing Backend Functions

```typescript
// convex/tests/myService/entities.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";

test("create entity", async () => {
  const t = convexTest(schema, modules);
  
  // Setup authenticated user
  const asUser = t.withIdentity({ subject: "user123" });
  
  // Test the function
  const entityId = await asUser.mutation(api.myService.create, {
    name: "Test Entity",
  });
  
  expect(entityId).toBeDefined();
  
  // Verify the entity was created
  const entities = await asUser.query(api.myService.list);
  expect(entities).toHaveLength(1);
  expect(entities[0].name).toBe("Test Entity");
});
```

## Frontend Development

### Service Architecture

Create new services following this structure:

```
app/services/my-service/
├── README.md                   # Service documentation
├── components/                 # UI components
│   ├── MyServiceComponent.tsx
│   ├── MyServiceForm.tsx
│   └── MyServiceList.tsx
├── contexts/                   # State management
│   └── MyServiceContext.tsx
├── hooks/                      # Custom hooks
│   ├── useMyService.ts
│   └── useMyServiceData.ts
├── types/                      # TypeScript types
│   └── index.ts
└── lib/                        # Utilities
    ├── validation.ts
    └── formatters.ts
```

### Component Development Patterns

#### Service Context Pattern

```typescript
// app/services/my-service/contexts/MyServiceContext.tsx
interface MyServiceContextType {
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  // ... other state
}

const MyServiceContext = createContext<MyServiceContextType | null>(null);

export function MyServiceProvider({ children }: PropsWithChildren) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  
  const value = {
    selectedEntity,
    setSelectedEntity,
  };
  
  return (
    <MyServiceContext.Provider value={value}>
      {children}
    </MyServiceContext.Provider>
  );
}

export function useMyService() {
  const context = useContext(MyServiceContext);
  if (!context) {
    throw new Error('useMyService must be used within MyServiceProvider');
  }
  return context;
}
```

#### Data Hook Pattern

```typescript
// app/services/my-service/hooks/useMyServiceData.ts
export function useMyServiceData() {
  const { user } = useAuth();
  
  // Queries
  const entities = useQuery(api.myService.list, 
    user ? {} : "skip"
  );
  
  // Mutations
  const createEntity = useMutation(api.myService.create);
  const updateEntity = useMutation(api.myService.update);
  const deleteEntity = useMutation(api.myService.delete);
  
  // Helper functions
  const handleCreate = useCallback(async (data: CreateEntityData) => {
    try {
      await createEntity(data);
      // Show success toast
    } catch (error) {
      // Show error toast
      console.error('Failed to create entity:', error);
    }
  }, [createEntity]);
  
  return {
    // Data
    entities,
    isLoading: entities === undefined,
    
    // Actions
    createEntity: handleCreate,
    updateEntity,
    deleteEntity,
  };
}
```

#### Component Pattern

```typescript
// app/services/my-service/components/MyServiceComponent.tsx
export function MyServiceComponent() {
  const { entities, isLoading, createEntity } = useMyServiceData();
  const { selectedEntity, setSelectedEntity } = useMyService();
  
  if (isLoading) return <LoadingSpinner />;
  if (!entities?.length) return <EmptyState />;
  
  return (
    <YStack space="$4">
      <H3>My Service</H3>
      {entities.map((entity) => (
        <Card key={entity._id} onPress={() => setSelectedEntity(entity)}>
          <Text>{entity.name}</Text>
        </Card>
      ))}
    </YStack>
  );
}
```

### Page Development

```typescript
// app/app/my-service/index.tsx
import { MyServiceProvider } from '@/services/my-service/contexts/MyServiceContext';
import { MyServiceComponent } from '@/services/my-service/components/MyServiceComponent';

export default function MyServicePage() {
  return (
    <MyServiceProvider>
      <SafeAreaView>
        <MyServiceComponent />
      </SafeAreaView>
    </MyServiceProvider>
  );
}
```

## Testing Guidelines

### Backend Testing

```typescript
// Use convex-test for backend tests
test("user can only access their own entities", async () => {
  const t = convexTest(schema, modules);
  
  const user1 = t.withIdentity({ subject: "user1" });
  const user2 = t.withIdentity({ subject: "user2" });
  
  // User 1 creates entity
  await user1.mutation(api.myService.create, { name: "User 1 Entity" });
  
  // User 2 creates entity
  await user2.mutation(api.myService.create, { name: "User 2 Entity" });
  
  // User 1 should only see their entity
  const user1Entities = await user1.query(api.myService.list);
  expect(user1Entities).toHaveLength(1);
  expect(user1Entities[0].name).toBe("User 1 Entity");
  
  // User 2 should only see their entity
  const user2Entities = await user2.query(api.myService.list);
  expect(user2Entities).toHaveLength(1);
  expect(user2Entities[0].name).toBe("User 2 Entity");
});
```

### Frontend Testing

```typescript
// Use Jest + React Native Testing Library
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyServiceComponent } from '../MyServiceComponent';

test("displays entities correctly", async () => {
  const { getByText } = render(<MyServiceComponent />);
  
  await waitFor(() => {
    expect(getByText("Test Entity")).toBeTruthy();
  });
});
```

## Code Style & Conventions

### TypeScript Configuration

```typescript
// tsconfig.json - Strict TypeScript settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Naming Conventions

- **Files**: camelCase (`userProfile.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Directories**: kebab-case (`user-profile/`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_USERS`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';

// 2. Internal - common
import { api } from '@/common/lib/api';
import { useAuth } from '@/common/hooks/useAuth';

// 3. Internal - service
import { useMyService } from '../contexts/MyServiceContext';
import { validateInput } from '../lib/validation';

// 4. Internal - local
import { ServiceComponent } from './ServiceComponent';
```

### Error Handling Patterns

```typescript
// Backend error handling
export const myFunction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    try {
      // Function logic
    } catch (error) {
      console.error("Function error:", error);
      throw new Error("A user-friendly error message");
    }
  },
});

// Frontend error handling
export function useMyServiceData() {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = useCallback(async () => {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [action]);
  
  return { error, handleAction };
}
```

## Common Tasks

### Adding a New Service

1. **Create service directory**: `app/services/my-service/`
2. **Create backend functions**: `convex/src/my-service/`
3. **Update schema**: Add tables to `convex/src/schema.ts`
4. **Sync API types**: `task convex:sync-api`
5. **Create service components**: Follow service architecture
6. **Add navigation**: Update `app/app/_layout.tsx`
7. **Write tests**: Backend and frontend tests

### Modifying the Database Schema

1. **Update schema**: `convex/src/schema.ts`
2. **Update functions**: Modify affected functions
3. **Write migration**: If needed for existing data
4. **Sync API types**: `task convex:sync-api`
5. **Update frontend**: Adapt to new types
6. **Test thoroughly**: Backend and frontend

### Adding Authentication to a Route

```typescript
// In your page component
export default function MyPage() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  
  return <MyPageContent />;
}
```

### Adding Real-time Features

Convex automatically provides real-time updates. Simply use `useQuery`:

```typescript
// This automatically updates when data changes
const entities = useQuery(api.myService.list);
```

## Troubleshooting

### Common Issues

#### 1. API Types Out of Sync

**Symptoms**: TypeScript errors about missing API functions
**Solution**: 
```bash
task convex:sync-api
```

#### 2. Convex Authentication Issues

**Symptoms**: "Not authenticated" errors
**Solution**: 
```bash
cd convex
npx convex auth
```

#### 3. Metro Bundler Cache Issues

**Symptoms**: Old code still running
**Solution**: 
```bash
cd app
yarn start --clear
```

#### 4. iOS Build Issues

**Symptoms**: Build failures on iOS
**Solution**: 
```bash
cd app/ios
pod install
```

### Debug Mode

Enable debug logging:

```typescript
// In your Convex functions
console.log("Debug info:", { user, args });

// In React Native
console.log("Component state:", state);
```

### Performance Monitoring

Monitor query performance:

```typescript
// Time-sensitive queries
const entities = useQuery(api.myService.list, { limit: 10 });
console.log("Query result:", entities?.length);
```

---

This development guide provides the foundation for efficient development with the Fullstack Mobile Template. Follow these patterns for consistent, maintainable code that works well with AI development tools.