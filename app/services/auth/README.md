# Jarvis Authentication with Convex Auth

## Overview

This project uses Convex Auth for secure username/password authentication in React Native with persistent sessions.

## Setup Complete

✅ **Backend (Convex)**

- Convex Auth configured with Password provider
- User management functions with proper authentication
- Auth tables automatically created in schema
- Development server running at `https://dashboard.convex.dev/d/uncommon-magpie-872`

✅ **Frontend (React Native)**

- ConvexAuthProvider properly configured with secure storage
- expo-secure-store integration for secure token storage on mobile
- AuthContext wrapper for easy access
- Login/Register screens with password fields
- Persistent authentication state across app restarts

## How to Use

### 1. Register a New User

1. Open the app (it will redirect to login if not authenticated)
2. Tap "Register" to go to the registration screen
3. Fill in:
   - Email address
   - Full name
   - Preferred name (optional)
   - Password (minimum 6 characters)
   - Confirm password
4. Tap "Create Account"

### 2. Login

1. On the login screen, enter:
   - Email address
   - Password
2. Tap "Sign In"

### 3. Persistent Sessions

- Once logged in, users remain authenticated until they explicitly sign out
- The app will automatically redirect authenticated users away from auth screens
- Authentication state is managed by Convex Auth and persists across app restarts

## Authentication Context

The `useAuth()` hook provides:

```typescript
interface AuthContextType {
  user: any | null; // Current authenticated user
  isLoading: boolean; // Loading state during auth operations
  isAuthenticated: boolean; // True if user is logged in
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

## Example Usage in Components

```typescript
import { useAuth } from "../services/auth/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Button onPress={signOut}>Sign Out</Button>
    </View>
  );
}
```

## Security Features

- Passwords are hashed and secured by Convex Auth
- Sessions are managed securely with JWT tokens
- Authentication tokens stored securely using expo-secure-store on mobile
- User data is isolated per authenticated user
- CSRF protection built-in
- Rate limiting on authentication attempts

## Development

- Convex dev server: Run `cd convex && pnpm dev`
- React Native app: Run `cd app && yarn start`
- Both servers need to be running for authentication to work

## Production Deployment

When deploying to production:

1. Deploy Convex backend: `cd convex && pnpm run deploy`
2. Update app environment variables to point to production Convex deployment
3. Build and deploy React Native app using standard Expo/React Native deployment methods

## Next Steps

The authentication system is now fully functional. You can:

1. Test user registration and login
2. Add user profile management
3. Implement role-based access control
4. Add social login providers if needed
5. Integrate with other app features that require authentication
