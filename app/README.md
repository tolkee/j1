# 📱 Mobile App

This is the React Native mobile application built with Expo and Tamagui. It follows a service-oriented architecture for scalable, maintainable code.

## 🏗 Architecture Overview

The mobile app is organized around **services** - self-contained feature modules that handle specific business domains.

```
app/
├── app/                     # File-based routing (pages)
│   ├── (auth)/             # Authentication flow
│   ├── index.tsx           # Main dashboard/home
│   ├── tasks/              # Example: Tasks service pages
│   ├── services/           # Service overview pages
│   └── modal.tsx           # Global modals
├── common/                 # Shared across all services
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Common React hooks
│   ├── lib/                # Utilities and API client
│   ├── types/              # Shared TypeScript types
│   └── constants/          # App-wide constants
└── services/               # Feature-specific modules
    ├── auth/               # Authentication service
    ├── tasks/              # Example: Tasks service
    └── [your-service]/     # Add your services here
```

## 🎯 Service Architecture

Each service follows a consistent structure:

```
services/my-service/
├── README.md               # Service documentation
├── components/             # UI components
│   ├── ServiceComponent.tsx
│   ├── ServiceForm.tsx
│   └── ServiceList.tsx
├── contexts/               # React contexts for state
│   └── ServiceContext.tsx
├── hooks/                  # Custom hooks
│   ├── useService.ts
│   └── useServiceData.ts
├── types/                  # TypeScript types
│   └── index.ts
└── lib/                    # Utilities
    ├── validation.ts
    └── formatters.ts
```

## 📄 File-Based Routing

Using **Expo Router** for navigation:

- `app/(auth)/` - Authentication pages (login, register)
- `app/index.tsx` - Main dashboard
- `app/[service]/` - Service-specific pages
- `app/services/` - Service overview/discovery pages

## 🧩 Core Components

### Provider Setup

The app is wrapped with essential providers:

```typescript
// app/common/components/Provider.tsx
<ConvexProvider client={convex}>
  <ConvexAuthProvider>
    <TamaguiProvider config={config}>
      <ToastProvider>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </ToastProvider>
    </TamaguiProvider>
  </ConvexAuthProvider>
</ConvexProvider>
```

### API Integration

The app uses Convex for real-time backend integration:

```typescript
// Example data fetching
import { useQuery, useMutation } from "convex/react";
import { api } from "@/common/lib/api";

function MyComponent() {
  const data = useQuery(api.myService.list);
  const create = useMutation(api.myService.create);
  
  return (
    <View>
      {data?.map(item => (
        <Text key={item._id}>{item.name}</Text>
      ))}
    </View>
  );
}
```

## 🎨 UI Components

The app uses **Tamagui** for cross-platform UI:

```typescript
import { View, Text, Button, YStack, XStack } from "tamagui";

function MyComponent() {
  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$6" fontWeight="600">
        Title
      </Text>
      <XStack space="$2">
        <Button theme="blue">Primary</Button>
        <Button variant="outlined">Secondary</Button>
      </XStack>
    </YStack>
  );
}
```

## 🔐 Authentication

Authentication is handled by the auth service:

```typescript
import { useAuth } from "@/services/auth/contexts/AuthContext";

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return <AuthenticatedContent user={user} />;
}
```

## 📱 Platform Support

- **iOS**: Native iOS app
- **Android**: Native Android app  
- **Web**: Progressive Web App (PWA)

## 🛠 Development Commands

```bash
# From project root - use these task commands:

# Start development server
task app:dev

# Run on iOS simulator
task app:ios

# Run on Android emulator  
task app:android

# Run on web browser
task app:web

# Run tests
task app:test

# Or run directly in app folder:
cd app
yarn start       # Start development server
yarn ios         # Run on iOS simulator
yarn android     # Run on Android emulator
yarn web         # Run on web browser
yarn test        # Run tests
```

## 🧪 Testing

Tests are located alongside components:

```
components/
├── MyComponent.tsx
├── MyComponent.test.tsx
└── __mocks__/
```

Example test:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from './MyComponent';

test('renders correctly', () => {
  const { getByText } = render(<MyComponent />);
  expect(getByText('Hello World')).toBeTruthy();
});
```

## 📚 Adding a New Service

### 1. Create Service Structure

```bash
mkdir -p app/services/my-service/{components,contexts,hooks,types,lib}
```

### 2. Create Service Components

Follow the existing patterns in `services/auth/` and `services/tasks/`.

### 3. Add Service Pages

Create pages in `app/app/my-service/` for your service routes.

### 4. Update Navigation

Add your service to the main layout if needed.

### 5. Create Service Documentation

Add a `README.md` to your service explaining its purpose and usage.

## 🎯 Best Practices

### Component Design

- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UIs from simple components
- **Props Interface**: Always define TypeScript interfaces for props
- **Error Boundaries**: Wrap risky components with error boundaries

### State Management

- **Local State**: Use `useState` for component-specific state
- **Service State**: Use React Context for service-wide state
- **Server State**: Use Convex queries/mutations for backend data
- **Global State**: Minimize global state, prefer composition

### Performance

- **Lazy Loading**: Use `React.lazy()` for large components
- **Memoization**: Use `React.memo()` for expensive components
- **Virtualization**: Use `FlatList` for large data sets
- **Image Optimization**: Use Expo's image optimization

### Error Handling

```typescript
function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      setError(null);
      await riskyOperation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return <MyContent />;
}
```

## 🚀 Deployment

### Development Build

```bash
# From project root
task app:build

# Or directly in app folder
cd app
npx expo export
```

### Production Build

```bash
# iOS
eas build --platform ios

# Android  
eas build --platform android

# Web (if configured)
npx expo export --platform web
```

## 📖 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Tamagui Documentation](https://tamagui.dev/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Convex Documentation](https://docs.convex.dev/)

---

This mobile app architecture provides a solid foundation for building scalable, maintainable applications with clear separation of concerns and consistent patterns.