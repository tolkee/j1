# Finance Service Documentation

## Overview

The Finance service provides comprehensive financial management capabilities within the Jarvis app, including account management, transaction tracking, and financial insights.

## Architecture

The Finance service follows the Jarvis app modular architecture with the following structure:

```
services/finance/
├── components/          # Finance-specific UI components
│   ├── FinanceLoadingScreen.tsx
│   └── FinanceErrorBoundary.tsx
├── hooks/              # Finance-specific React hooks
│   └── useFinanceAuth.ts
├── contexts/           # Finance-specific React contexts
│   └── FinanceContext.tsx
├── types/              # Finance-specific TypeScript types
├── lib/                # Finance utility functions
└── doc/                # Finance service documentation
    └── README.md
```

## Navigation Structure

The Finance service uses Expo Router with Stack navigation:

```
app/finance/
├── _layout.tsx         # Finance navigation layout
├── index.tsx           # Finance home screen
├── accounts.tsx        # Accounts management
├── add-expense.tsx     # Add expense form
├── add-income.tsx      # Add income form
└── account/
    └── [id].tsx        # Dynamic account details
```

## Backend Integration

The Finance service integrates with the Convex backend through:

- **API Types**: Generated from `common/lib/api.ts` (symlinked from convex module)
- **Finance Functions**: Complete CRUD operations for accounts, transactions, categories
- **Setup Functions**: Finance service initialization and status checking
- **Balance Calculations**: Real-time balance aggregation and financial summaries

## Key Components

### useFinanceAuth Hook

Provides finance-specific authentication and setup status:

```typescript
const {
  isAuthenticated,
  user,
  setupStatus,
  isFinanceSetup,
  hasAccounts,
  hasCategories,
  hasTransactions,
  isLoading,
} = useFinanceAuth();
```

### FinanceContext

Global state management for finance service:

```typescript
const {
  isAuthenticated,
  isFinanceSetup,
  setupStatus,
  hasAccounts,
  hasCategories,
  hasTransactions,
  isLoading,
} = useFinance();
```

### Error Handling

- **FinanceErrorBoundary**: Catches and handles React errors gracefully
- **FinanceLoadingScreen**: Provides consistent loading experience

## Types

Finance service types are defined in `common/types/finance.ts`:

- `BankAccount`: Bank account entity
- `Transaction`: Financial transaction entity
- `Category`: Transaction category entity
- `FinanceSetupStatus`: Service setup and status information

## Theme and Visual Identity

- **Primary Color**: Emerald green (`$green10`)
- **Primary Icon**: `DollarSign` (Lucide)
- **Secondary Icons**: `CreditCard`, `TrendingUp`, `PiggyBank`

## Cloud Integration

The Finance service appears in the Jarvis cloud interface:

- **Service Node**: Displays as "Finance" with DollarSign icon
- **Route**: `/services/finance`
- **Navigation**: Smooth transitions from cloud to finance screens

## Development Notes

- All components use Tamagui for consistent styling
- TypeScript compilation passes without errors
- Navigation structure supports deep linking
- Ready for feature implementation in subsequent tasks

## Next Steps

This foundation enables implementation of:

1. Account management features
2. Transaction entry and editing
3. Financial reporting and insights
4. Recurring transaction automation
5. Financial goal tracking
