# Task 04 - Finance Account Management

## Description

Implement the complete account management functionality for the Finance service, including account creation, editing, deletion, and the account navigation interface. This task covers the foundational account management features that support all other finance service operations with a clean, minimalist design approach.

## Subtasks

### 1. Account Management Hooks ✅

**Prerequisites:** [Task 03 - Finance Service Setup & Cloud Integration](mdc:03-finance-service-setup.md) - Finance service foundation must be complete

- [x] Create `services/finance/hooks/useAccounts.ts`:
  - [x] Implement `useGetAccounts()` hook:
    - [x] Query user accounts with `api.finance.accounts.getUserAccounts`
    - [x] Handle loading and error states
    - [x] Sort accounts by displayOrder and isDefault
    - [x] Return accounts with current balances
  - [x] Implement `useCreateAccount()` hook:
    - [x] Mutation to create new account
    - [x] Handle optimistic updates
    - [x] Validate account data before submission
    - [x] Return success/error states
  - [x] Implement `useUpdateAccount()` hook:
    - [x] Mutation to update account details
    - [x] Handle default account switching logic
    - [x] Support partial updates
    - [x] Return updated account data
  - [x] Implement `useDeleteAccount()` hook:
    - [x] Mutation to delete account with validation
    - [x] Check for existing transactions before deletion
    - [x] Handle confirmation flow
    - [x] Update account list after deletion

### 2. Account Creation & Editing Forms ✅

- [x] Create `services/finance/components/AccountForm.tsx`:
  - [x] Design form layout with Tamagui components:
    - [x] Account name input (required)
    - [x] Description input (optional)
    - [x] Icon selector with predefined options
    - [x] Initial balance input
    - [x] Default account toggle
  - [x] Implement form validation:
    - [x] Required field validation
    - [x] Amount format validation
    - [x] Duplicate name prevention
    - [x] Real-time validation feedback
  - [x] Support both create and edit modes:
    - [x] Pre-populate form for editing
    - [x] Different submission behavior
    - [x] Appropriate button text and headers
  - [x] Icon selection interface:
    ```tsx
    const ACCOUNT_ICONS = [
      { id: "wallet", name: "Wallet", icon: Wallet },
      { id: "bank", name: "Bank", icon: Building },
      { id: "card", name: "Credit Card", icon: CreditCard },
      { id: "piggy", name: "Savings", icon: PiggyBank },
      { id: "coins", name: "Cash", icon: Coins },
    ];
    ```

### 3. Account List Display ✅

- [x] Create `services/finance/components/AccountsList.tsx`:
  - [x] Display accounts in organized list:
    - [x] Account name and description
    - [x] Current balance prominently displayed
    - [x] Account icon and visual indicators
    - [x] Default account badge/indicator
  - [x] Implement account interactions:
    - [x] Tap to view account details
    - [x] Long press for quick actions menu
    - [x] Swipe actions for edit/delete
  - [x] Account reordering functionality:
    - [x] Backend support for displayOrder updates
    - [x] Visual feedback and enhanced UX
    - [x] Comprehensive validation and error handling
  - [x] Empty state handling:
    - [x] Welcome message for first-time users
    - [x] Call-to-action to create first account
    - [x] Onboarding tips

### 4. Account Details Screen ✅

- [x] Create `app/finance/account/[id].tsx`:
  - [x] **Minimalist header design**:
    - [x] Simple navigation with back arrow and settings icon (no green background)
    - [x] Account name and description below icons when at top
    - [x] Smooth animation: name moves between icons when scrolling down
    - [x] Clean, space-efficient layout with proper safe area handling
  - [x] Account information display:
    - [x] Current balance prominently displayed
    - [x] Account icon and visual indicators
    - [x] Default account badge when applicable
  - [x] Account statistics:
    - [x] Transaction count
    - [x] Account creation date
    - [x] Account type display
  - [x] Recent transactions list:
    - [x] Transactions specific to this account
    - [x] Show 5 most recent transactions
    - [x] "View All" button for full transaction list
    - [x] Clean empty state without unnecessary action buttons
  - [x] Account settings:
    - [x] Set as default account
    - [x] Delete account (with confirmation)

### 5. Accounts Management Screen ✅

- [x] Create `app/finance/accounts/index.tsx`:
  - [x] Full accounts management interface:
    - [x] List all user accounts
    - [x] Account summary cards with key metrics
    - [x] Add new account button
    - [x] Search and filter functionality
  - [x] Account organization features:
    - [x] Sort by balance, name, date created, or last updated
    - [x] Filter by account status (all, default, positive/negative balance)
    - [x] Visual indicators for active filters
  - [x] Account insights:
    - [x] Total balance across all accounts
    - [x] Account count statistics
    - [x] Positive vs negative balance account counts

### 6. Account Navigation Integration ✅

**Prerequisites:** [Task 03 - Finance Service Setup & Cloud Integration](mdc:03-finance-service-setup.md) - Finance service main screen must be implemented

- [x] Update `app/finance/index.tsx` with **minimalist design**:
  - [x] **Clean, card-free layout**:
    - [x] Removed green header and bulky elements
    - [x] Centered account display with icon, name, and balance
    - [x] Smooth horizontal scrolling between accounts with FlatList
    - [x] Immediate scroll feedback with proper throttling
  - [x] **Refined visual indicators**:
    - [x] Small, close-spaced dots below account info
    - [x] Active dot larger and blue, inactive dots smaller and gray
    - [x] Clean, minimal spacing for better visual hierarchy
  - [x] **Consistent action buttons**:
    - [x] Three circular gray buttons: Plus (expense), Minus (income), Eye (view)
    - [x] White icons with proper sizing and spacing
    - [x] Compact layout with reduced spacing between buttons
  - [x] **Fixed transactions section**:
    - [x] Enhanced transaction cards with clean typography
    - [x] Recent transactions with proper date formatting
    - [x] Simplified empty state without call-to-action buttons

### 7. Account Creation Onboarding ✅

- [x] Create account setup flow for new users:
  - [x] First-time user detection:
    - [x] Check if user has any accounts
    - [x] Show onboarding flow if none exist
    - [x] Skip directly to account creation if needed
  - [x] Guided account creation:
    - [x] Step-by-step account setup (Welcome → Templates → Success)
    - [x] Account type suggestions with descriptions
    - [x] Tips for account organization and usage
  - [x] Quick setup options:
    - [x] Common account templates (Checking, Savings, Credit Card, etc.)
    - [x] Pre-filled account types with suggested balances
    - [x] Multi-select account creation workflow

### 8. Account Default Management ✅

- [x] Implement default account functionality:
  - [x] Automatic default account selection:
    - [x] Set first account as default automatically
    - [x] Handle default switching with `useDefaultAccount` hook
    - [x] Ensure only one default account at all times
  - [x] Default account usage:
    - [x] Pre-select default account in finance screen
    - [x] Quick expense/income buttons use selected account
    - [x] Clear visual indication with star icons
  - [x] Default account persistence:
    - [x] Default account managed through backend state
    - [x] Handle account deletion scenarios automatically
    - [x] Reassign default if current default is deleted

### 9. Account Data Validation & Error Handling ✅

- [x] Implement comprehensive validation:
  - [x] **Enhanced validation system**:
    - [x] Created `services/finance/lib/validation.ts` with ValidationError/ValidationResult interfaces
    - [x] Account validation rules (name 2-50 chars, description max 200, balance limits)
    - [x] Currency formatting and parsing utilities
    - [x] Centralized error handling utilities
  - [x] Form validation:
    - [x] Required field checks
    - [x] Amount format validation
    - [x] Name uniqueness validation
    - [x] Balance limit checks (range: -$1M to $1B)
  - [x] Backend validation handling:
    - [x] Display server-side validation errors
    - [x] Handle network errors gracefully
    - [x] Retry mechanisms for failed operations
  - [x] Data integrity checks:
    - [x] Validate account ownership
    - [x] Check transaction dependencies before deletion
    - [x] Handle concurrent modification conflicts

### 10. Account Performance & UX ✅

- [x] Optimize account management performance:
  - [x] **Enhanced form components**:
    - [x] Created `services/finance/hooks/useAccountsWithValidation.ts` with retry logic
    - [x] Optimistic updates with conflict resolution
    - [x] Network state management and error recovery
    - [x] Real-time validation with 300ms debouncing
  - [x] **Advanced form UX**:
    - [x] Created `services/finance/components/EnhancedAccountForm.tsx`
    - [x] React Native Animated effects for smooth interactions
    - [x] Auto-focus on error fields for better accessibility
    - [x] Loading states with proper visual feedback
  - [x] Account caching strategy:
    - [x] Cache account data with Convex reactivity
    - [x] Update cache on mutations automatically
    - [x] Handle cache invalidation through Convex
  - [x] **Smooth animations and transitions**:
    - [x] Account detail screen with animated header transitions
    - [x] Text smoothly moves between positions when scrolling
    - [x] No initial animation on page load, only on user interaction
    - [x] Natural animation directions (up/down based on scroll direction)
  - [x] Accessibility improvements:
    - [x] Screen reader support with proper labels
    - [x] Focus management between form fields
    - [x] High contrast support through Tamagui tokens
    - [x] Keyboard navigation and accessibility hints

## Design Philosophy ✅

The finance service follows a **minimalist design approach**:

- **Clean, card-free layouts** prioritizing content over decoration
- **Consistent gray action buttons** with white icons for unified experience
- **Smooth animations** that feel natural and responsive
- **Space-efficient design** removing unnecessary elements and padding
- **Simplified headers** without heavy backgrounds or complex layouts
- **Immediate feedback** with proper scroll handling and state management

## Prerequisites

- [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Account management functions must be implemented
- [Task 03 - Finance Service Setup & Cloud Integration](mdc:03-finance-service-setup.md) - Finance service foundation must be complete

## Acceptance Criteria ✅

- [x] Users can create new bank accounts with name, description, icon, and initial balance
- [x] Users can edit existing account details and set default accounts
- [x] Users can delete accounts (with proper validation for existing transactions)
- [x] Account list displays all accounts with current balances and visual indicators
- [x] Account details screen shows comprehensive account information and recent transactions
- [x] Account navigation works smoothly in the finance main screen with minimalist design
- [x] Default account functionality works correctly across all features
- [x] Account creation onboarding guides new users through setup
- [x] All account operations handle errors gracefully with user-friendly messages
- [x] Account management feels responsive and smooth across different devices
- [x] Account data is properly validated both client-side and server-side
- [x] Account interface is accessible and follows minimalist design system guidelines
- [x] Smooth animations enhance user experience without being intrusive
- [x] Headers adapt intelligently to scroll position and content needs
