# Authentication Service

This service handles user authentication for the Jarvis application.

## Components

### AuthContext

- **Location**: `contexts/AuthContext.tsx`
- **Purpose**: Provides authentication state and methods throughout the app
- **Exports**: `AuthProvider`, `useAuth`

## Features

- User registration with email and name
- User login with email
- Authentication state management
- Integration with Convex backend

## Usage

```typescript
import { useAuth } from "../services/auth/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use authentication state and methods
}
```

## API Integration

The auth service integrates with the following Convex functions:

- `api.auth.registerUser` - Register a new user
- `api.auth.loginUser` - Login an existing user

## Types

```typescript
interface User {
  _id: Id<"users">;
  _creationTime: number;
  email: string;
  name: string;
  preferredName?: string;
  timezone?: string;
  welcomeMessagePreference?: string;
}
```
