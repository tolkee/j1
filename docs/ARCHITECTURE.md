# 🏗 Architecture Overview

This document describes the architectural decisions, patterns, and design principles of the Fullstack Mobile Template.

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Backend Architecture (Convex)](#backend-architecture-convex)
- [Frontend Architecture (Mobile App)](#frontend-architecture-mobile-app)
- [Data Flow](#data-flow)
- [Service-Oriented Design](#service-oriented-design)
- [Type Safety](#type-safety)
- [Authentication Flow](#authentication-flow)
- [File Organization](#file-organization)
- [Design Patterns](#design-patterns)

## System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Mobile App    │◄──►│   Convex API    │◄──►│   Database      │
│   (React        │    │   (Functions)   │    │   (Built-in)    │
│    Native)      │    │                 │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: React Native + Expo Router + Tamagui
- **Backend**: Convex (Serverless Functions + Real-time Database)
- **Authentication**: Convex Auth
- **Type Safety**: TypeScript throughout
- **State Management**: React Context + Convex Queries
- **UI Components**: Tamagui Design System

## Backend Architecture (Convex)

### Core Principles

1. **Function-Based**: All backend logic is organized as Convex functions
2. **Real-time**: Automatic subscriptions and updates
3. **Type-Safe**: Generated TypeScript types for all functions
4. **Serverless**: No server management required

### Directory Structure

```
convex/
├── src/
│   ├── auth.ts              # Authentication configuration
│   ├── schema.ts            # Database schema definition
│   ├── users.ts             # User management functions
│   ├── [service]/           # Service-specific functions
│   │   ├── [entity].ts      # CRUD operations for entity
│   │   └── setup.ts         # Service initialization
│   └── _generated/          # Auto-generated types (do not edit)
└── tests/                   # Backend tests
```

### Function Types

1. **Queries**: Read-only operations (`query`)
2. **Mutations**: Write operations (`mutation`)
3. **Actions**: External API calls (`action`)
4. **Crons**: Scheduled tasks (`cron`)

### Database Schema Pattern

```typescript
// Standard table pattern
tableName: defineTable({
  userId: v.id("users"),           // User ownership
  // ... entity-specific fields
  createdAt: v.number(),           // Audit fields
  updatedAt: v.number(),
})
.index("by_user", ["userId"])      // Standard indexes
.index("by_user_and_date", ["userId", "createdAt"])
```

## Frontend Architecture (Mobile App)

### Service-Oriented Architecture

The mobile app is organized around **services** - self-contained feature modules.

```
app/
├── app/                     # File-based routing (pages)
│   ├── (auth)/             # Auth-protected routes
│   ├── [service]/          # Service-specific pages
│   └── index.tsx           # Home/dashboard
├── common/                 # Shared across services
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Common React hooks
│   ├── lib/                # Utilities and API client
│   └── types/              # Shared TypeScript types
└── services/               # Feature-specific modules
    └── [service]/
        ├── components/     # Service-specific components
        ├── contexts/       # React contexts for state
        ├── hooks/          # Service-specific hooks
        ├── types/          # Service-specific types
        └── lib/            # Service utilities
```

### Component Hierarchy

```
App
├── Provider (Convex + Auth + Theme)
├── Router (Expo Router)
└── Pages
    ├── Common Components
    └── Service Components
```

### Navigation Pattern

Using **Expo Router** with file-based routing:

- `app/(auth)/` - Authentication flow
- `app/index.tsx` - Main dashboard
- `app/[service]/` - Service-specific pages
- `app/modal.tsx` - Global modals

## Data Flow

### Query Pattern

```typescript
// 1. Define backend function
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Function logic
  }
});

// 2. Auto-generate types
// task convex:sync-api

// 3. Use in React component
const data = useQuery(api.myService.list, { limit: 10 });
```

### Mutation Pattern

```typescript
// 1. Define backend mutation
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Mutation logic
  }
});

// 2. Use in React component
const createItem = useMutation(api.myService.create);
const handleCreate = () => createItem({ name: "New Item" });
```

### Real-time Updates

Convex provides automatic real-time updates:
- Queries automatically re-run when data changes
- UI updates reactively
- No manual cache invalidation needed

## Service-Oriented Design

### Service Definition

A **service** is a self-contained feature module with:
- Clear boundaries and responsibilities
- Own data models and business logic
- Independent UI components
- Service-specific types and utilities

### Service Template Structure

```
services/my-service/
├── README.md               # Service documentation
├── components/             # UI components
│   ├── ServiceComponent.tsx
│   └── ServiceForm.tsx
├── contexts/               # State management
│   └── ServiceContext.tsx
├── hooks/                  # Custom hooks
│   ├── useService.ts
│   └── useServiceData.ts
├── types/                  # TypeScript types
│   └── index.ts
└── lib/                    # Utilities
    └── validation.ts
```

### Service Integration

Services integrate through:
- **Common components** in `app/common/`
- **Shared types** in `app/common/types/`
- **Service registry** in `app/common/lib/registry.ts`
- **Navigation** through Expo Router

## Type Safety

### End-to-End Type Safety

1. **Backend Types**: Defined in Convex schema
2. **API Types**: Auto-generated by Convex
3. **Frontend Types**: Consume backend types
4. **Component Props**: Strongly typed with TypeScript

### Type Generation Flow

```
schema.ts → Convex Functions → Generated API → Frontend Types
```

### Type Sharing Pattern

```typescript
// Backend: convex/src/schema.ts
export const myTable = defineTable({
  name: v.string(),
  value: v.number(),
});

// Generated: app/common/lib/api.ts
export const api = {
  myService: {
    create: FunctionReference<"mutation", ...>,
    list: FunctionReference<"query", ...>,
  }
};

// Frontend: Use with full type safety
const data = useQuery(api.myService.list); // Fully typed!
```

## Authentication Flow

### Authentication Architecture

```
User → Login → Convex Auth → Session → Protected Routes
```

### Implementation Pattern

1. **Auth Provider**: Wraps app with authentication context
2. **Auth Guards**: Protect routes based on auth state
3. **Auth Hooks**: Provide auth state and actions
4. **Session Management**: Automatic token handling

### Code Example

```typescript
// Auth context usage
const { isAuthenticated, user, login, logout } = useAuth();

// Route protection
if (!isAuthenticated) {
  return <Redirect href="/(auth)/login" />;
}
```

## File Organization

### Naming Conventions

- **Files**: camelCase (`userProfile.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Directories**: kebab-case (`user-profile/`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

### Import Patterns

```typescript
// External libraries first
import React from 'react';
import { View } from 'react-native';

// Internal imports by proximity
import { api } from '@/common/lib/api';
import { ServiceComponent } from '../components/ServiceComponent';
import { useService } from './useService';
```

### File Placement Rules

1. **Service-specific** → `services/[service]/`
2. **Shared across services** → `common/`
3. **Page components** → `app/`
4. **Backend logic** → `convex/src/`

## Design Patterns

### 1. Service Provider Pattern

```typescript
// Service context
const ServiceContext = createContext<ServiceContextType | null>(null);

// Provider component
export function ServiceProvider({ children }: PropsWithChildren) {
  const value = useServiceLogic();
  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

// Hook for consuming context
export function useService() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within ServiceProvider');
  }
  return context;
}
```

### 2. Custom Hook Pattern

```typescript
export function useServiceData() {
  const { user } = useAuth();
  const data = useQuery(api.service.list, { userId: user?.id });
  const create = useMutation(api.service.create);
  
  return {
    data,
    isLoading: data === undefined,
    create,
  };
}
```

### 3. Error Boundary Pattern

```typescript
export function ServiceErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={<ServiceErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Service error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 4. Loading State Pattern

```typescript
export function ServiceComponent() {
  const { data, isLoading, error } = useServiceData();
  
  if (isLoading) return <ServiceLoadingScreen />;
  if (error) return <ServiceErrorScreen error={error} />;
  if (!data) return <ServiceEmptyState />;
  
  return <ServiceContent data={data} />;
}
```

## Best Practices

### Backend Best Practices

1. **Single Responsibility**: Each function has one clear purpose
2. **Input Validation**: Validate all function arguments
3. **Error Handling**: Proper error messages and types
4. **Indexes**: Create appropriate database indexes
5. **Testing**: Write tests for all functions

### Frontend Best Practices

1. **Component Composition**: Small, focused components
2. **Custom Hooks**: Extract logic into reusable hooks
3. **Error Boundaries**: Catch and handle errors gracefully
4. **Loading States**: Provide feedback during async operations
5. **Type Safety**: Use TypeScript strictly

### Performance Best Practices

1. **Query Optimization**: Use appropriate filters and limits
2. **Component Memoization**: Use React.memo for expensive components
3. **Lazy Loading**: Code split large features
4. **Bundle Size**: Monitor and optimize bundle size

---

This architecture provides a solid foundation for building scalable, maintainable mobile applications with AI development tools.