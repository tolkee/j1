# Task 03 - Finance Service Setup & Cloud Integration

## Description

Integrate the Finance service into the Jarvis app's cloud interface by adding the Finance service node to the service registry and creating the initial navigation structure. This task establishes the foundation for the finance service in the app while maintaining the existing cloud-based navigation system.

## Subtasks

### 1. Service Registry Integration

**Prerequisites:** [Task 02 - Jarvis Cloud Home Screen](mdc:02-jarvis-cloud-home-screen.md) - Cloud interface must be implemented

- [x] Update `lib/services/registry.ts` to include Finance service:
  - [x] Add Finance service definition:
    ```typescript
    {
      id: 'finance',
      name: 'Finance',
      icon: 'DollarSign', // or 'Wallet'
      color: '$green10', // Emerald green for money/finance
      route: '/services/finance',
      enabled: true
    }
    ```
  - [x] Ensure Finance service appears in appropriate position in cloud layout
  - [x] Verify Finance node renders with correct styling and icon

### 2. Convex API Integration

**Prerequisites:** [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Backend functions must be implemented

- [x] Regenerate Convex API types:
  - [x] Run `cd convex && npm run sync-api` (generates API types and syncs to app)
  - [x] Convex sync script automatically copies `api.ts` to `app/common/lib/api.ts` (avoids Metro bundler symlink issues on iOS)
  - [x] Sync workflow: `convex/scripts/sync-api.sh` handles copying after generation
  - [x] Verify finance service functions are available in generated API
  - [x] Test import of finance functions: `import { api } from "../../../common/lib/api"`
- [x] Create finance service types:

  - [x] Create `common/types/finance.ts` with TypeScript interfaces:

    ```typescript
    interface BankAccount {
      _id: Id<"bankAccounts">;
      name: string;
      description?: string;
      icon: string;
      currentAmount: number;
      isDefault: boolean;
      displayOrder: number;
    }

    interface Transaction {
      _id: Id<"transactions">;
      accountId: Id<"bankAccounts">;
      categoryId: Id<"categories">;
      amount: number;
      description: string;
      date: number;
      isRecurring: boolean;
    }

    interface Category {
      _id: Id<"categories">;
      name: string;
      icon: string;
      color: string;
    }
    ```

### 3. Finance Service Route Structure

- [x] Create finance service navigation structure:

  - [x] Create `app/finance/` directory for finance-related screens
  - [x] Create `app/finance/_layout.tsx` for finance navigation:

    ```tsx
    import { Stack } from "expo-router";

    export default function FinanceLayout() {
      return (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#10B981" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Finance" }} />
          <Stack.Screen name="accounts" options={{ title: "Accounts" }} />
          <Stack.Screen name="add-expense" options={{ title: "Add Expense" }} />
          <Stack.Screen name="add-income" options={{ title: "Add Income" }} />
          <Stack.Screen
            name="account/[id]"
            options={{ title: "Account Details" }}
          />
        </Stack>
      );
    }
    ```

### 4. Finance Service Main Screen

- [x] Create `app/finance/index.tsx` - Finance service home:

  - [x] **Minimalist main finance screen design** with Tamagui:
    - [x] **Clean, header-free layout** without green backgrounds
    - [x] **Centered account display** with icon, name, and balance
    - [x] **Horizontal account navigation** with smooth FlatList scrolling
    - [x] **Compact action buttons** (expense, income, view) in consistent gray theme
    - [x] **Fixed transactions section** with enhanced typography
  - [x] **Responsive navigation structure**:
    - [x] Account carousel with immediate scroll feedback
    - [x] Small, spaced dots for account indicators
    - [x] Clean account transitions and state management
    - [x] Simplified empty states without unnecessary buttons

  ```tsx
  export default function FinanceScreen() {
    return (
      <YStack flex={1} bg="$background" paddingTop={insets.top}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />

        {/* Slidable Account Section */}
        <FlatList
          data={accounts}
          renderItem={renderAccountInfo}
          horizontal
          pagingEnabled
          onScroll={handleAccountScroll}
        />

        {/* Account Dots */}
        <XStack justifyContent="center" gap="$2">
          {/* Dot indicators */}
        </XStack>

        {/* Circular Action Buttons */}
        <XStack justifyContent="center" gap="$4">
          <Button size="$5" circular backgroundColor="$color8">
            <Plus size="$2" color="white" />
          </Button>
          {/* Additional buttons */}
        </XStack>

        {/* Fixed Transactions Section */}
        <YStack gap="$3" padding="$4">
          {/* Transaction cards */}
        </YStack>
      </YStack>
    );
  }
  ```

  - [x] Add navigation integration with cloud interface
  - [x] Ensure screen is accessible from cloud interface with proper routing

### 5. Navigation Integration Testing

- [ ] Test cloud-to-finance navigation:
  - [ ] Verify Finance node appears in cloud interface
  - [ ] Test tap interaction navigates to `/finance`
  - [ ] Ensure smooth transition animations
  - [ ] Test back navigation returns to cloud home
- [ ] Test deep linking:
  - [ ] Verify direct navigation to `/finance` works
  - [ ] Test app state restoration when navigating to finance
- [ ] Test with authentication:
  - [ ] Ensure finance screens are protected behind auth
  - [ ] Test navigation when user is not authenticated

### 6. Finance Service Authentication Hooks

- [x] Create `services/finance/hooks/useFinanceAuth.ts`:
  - [x] Wrap Convex auth for finance-specific needs
  - [x] Handle finance service initialization for new users
  - [x] Check if user has finance service set up
  - [x] Provide finance service onboarding state
- [x] Create finance service context:
  - [x] Create `services/finance/contexts/FinanceContext.tsx` for finance service state
  - [x] Initialize with user's finance service status
  - [x] Provide finance service configuration
  - [x] Handle finance service loading states

### 7. Basic Error Handling & Loading States

- [x] Implement loading states for finance service:
  - [x] Create `services/finance/components/FinanceLoadingScreen.tsx`
  - [x] Show loading spinner while checking finance service status
  - [x] Handle navigation loading between finance screens
- [x] Create error boundaries for finance service:
  - [x] Create `services/finance/components/FinanceErrorBoundary.tsx`
  - [x] Handle Convex connection errors gracefully
  - [x] Provide retry mechanisms for failed requests
  - [x] Show user-friendly error messages

### 7.1. Safe Area Implementation

- [x] Implement safe area handling for custom headers:
  - [x] Create `common/components/SafeAreaView/SafeAreaView.tsx` - Reusable safe area wrapper
  - [x] Create `common/components/SafeHeader/SafeHeader.tsx` - Safe header with background extending to status bar
  - [x] Update finance screen to use SafeHeader with proper background color
  - [x] Update FloatingUserControls to respect safe area insets
  - [x] Ensure finance header background extends behind status bar

### 8. Finance Service Icon & Visual Assets

- [x] Implement finance service visual identity:
  - [x] Use consistent emerald green color theme (#10B981)
  - [x] Implement appropriate Lucide icons:
    - Primary: `DollarSign` or `Wallet`
    - Secondary: `CreditCard`, `TrendingUp`, `PiggyBank`
  - [x] Ensure icons are consistent with cloud interface
  - [x] Test icon rendering across different screen sizes

### 9. Performance Setup

- [x] Optimize finance service for performance:
  - [x] Implement React.memo for finance components
  - [x] Set up proper loading states to prevent layout shifts
  - [x] Ensure smooth transitions between finance screens
  - [x] Test performance on target devices

### 10. Development and Testing Setup

- [x] Set up development workflow:
  - [x] Ensure hot reload works for finance screens
  - [x] Test finance navigation in development mode
  - [x] Verify Convex functions are accessible from finance screens
- [x] Create basic testing infrastructure:
  - [x] Set up navigation testing for finance service
  - [x] Test cloud integration with finance service
  - [x] Verify authentication integration works properly

## Prerequisites

- [Task 01 - App Setup](mdc:01-app-setup.md) - App foundation must be complete
- [Task 02 - Jarvis Cloud Home Screen](mdc:02-jarvis-cloud-home-screen.md) - Cloud interface must be implemented
- [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Backend API must be available

## Acceptance Criteria

- [x] Finance service appears as a node in the cloud interface
- [x] Tapping Finance node navigates to finance service home screen
- [x] Finance service has proper navigation structure with Stack router
- [x] Finance service is protected behind authentication
- [x] Convex API types are properly generated and imported
- [x] Finance service displays with consistent emerald green theme
- [x] Basic loading states and error handling are implemented
- [x] Navigation between cloud and finance service feels smooth
- [x] Finance service foundation is ready for feature implementation
- [x] All navigation routes are properly configured and tested
