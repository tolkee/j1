# Task 05 - Finance Quick Expense Entry

## Description

Implement the core quick expense entry feature that allows users to record expenses in under 5 seconds with minimal taps. This is the most critical user flow in the finance service, designed for frictionless daily expense tracking with smart defaults and category management.

## Subtasks

### 1. Category Management System

**Prerequisites:** [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Category functions must be implemented

- [x] Create `lib/hooks/useCategories.ts`:
  - [x] Implement `useGetCategories()` hook:
    - [x] Query user categories with usage statistics
    - [x] Include default system categories
    - [x] Sort by frequency of use and name
    - [x] Return categories with icons and colors
  - [x] Implement `useCreateCategory()` hook:
    - [x] Mutation to create custom categories
    - [x] Handle on-demand category creation
    - [x] Validate unique category names
    - [x] Return created category for immediate use
  - [x] Implement category caching:
    - [x] Cache frequently used categories
    - [x] Optimistic updates for new categories
    - [x] Intelligent category suggestions

### 2. Quick Expense Entry Flow

- [x] Create `app/finance/add-expense.tsx`:

  - [x] **Step 1: Amount Entry Screen**:

    - [x] Large, prominent number input
    - [x] Currency symbol display
    - [x] Number pad with decimal support
    - [x] Clear/backspace functionality
    - [x] Continue button (enabled when amount > 0)

    ```tsx
    <YStack f={1} ai="center" jc="center" p="$4">
      <Text fontSize="$2" color="$gray10" mb="$2">
        Amount
      </Text>
      <XStack ai="center" mb="$6">
        <Text fontSize="$12" fontWeight="bold">
          $
        </Text>
        <Text fontSize="$14" fontWeight="bold">
          {amount || "0.00"}
        </Text>
      </XStack>
      <CustomNumberPad onValueChange={setAmount} />
      <Button
        bg="$green9"
        color="white"
        size="$5"
        disabled={!amount || amount <= 0}
        onPress={handleContinue}
      >
        Continue
      </Button>
    </YStack>
    ```

  - [x] **Step 2: Category & Details Screen**:

    - [x] Category selection grid with icons
    - [x] Recently used categories at top
    - [x] "Create New" category option
    - [x] Account selection (pre-selected to default)
    - [x] Optional description field
    - [x] Save button

    ```tsx
    <ScrollView>
      <YStack p="$4" gap="$4">
        <XStack ai="center" jc="space-between">
          <Text fontSize="$6" fontWeight="bold">
            ${amount}
          </Text>
          <Button variant="outlined" onPress={goBack}>
            Edit
          </Button>
        </XStack>

        <CategoryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onCreateNew={handleCreateCategory}
        />

        <AccountSelector
          accounts={accounts}
          selected={selectedAccount}
          onChange={setSelectedAccount}
        />

        <TextArea
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
        />

        <Button bg="$green9" color="white" onPress={handleSave}>
          Save Expense
        </Button>
      </YStack>
    </ScrollView>
    ```

### 3. Custom Number Pad Component

- [x] Create `components/finance/CustomNumberPad.tsx`:
  - [x] Design custom number pad for better UX:
    - [x] Large, touch-friendly buttons
    - [x] Numbers 0-9, decimal point, backspace
    - [x] Consistent spacing and visual feedback
    - [x] Haptic feedback on press (removed due to dependency issues)
  - [x] Handle amount formatting:
    - [x] Automatic decimal point placement
    - [x] Prevent multiple decimal points
    - [x] Limit to 2 decimal places
    - [x] Format display as currency
  - [x] Keyboard integration:
    - [x] Support hardware keyboard input
    - [x] Disable system keyboard
    - [x] Handle paste operations
  ```tsx
  const KEYPAD_BUTTONS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];
  ```

### 4. Category Selection Interface

- [x] Create `components/finance/CategoryGrid.tsx`:

  - [x] Category grid layout:
    - [x] 3-4 categories per row
    - [x] Category icon and name
    - [x] Visual selection state
    - [x] Smooth animations
  - [x] Category prioritization:
    - [x] Recently used categories first
    - [x] Default categories always visible
    - [x] User-created categories
    - [x] "Other" category as fallback
  - [x] Category creation integration:
    - [x] "+" button to create new category
    - [x] Modal or inline category creation
    - [x] Immediate availability after creation

- [x] Create `components/finance/CategoryCreationModal.tsx`:
  - [x] Quick category creation form:
    - [x] Category name input
    - [x] Icon selection from predefined set
    - [x] Color selection for visual consistency
    - [x] Create and use immediately
  - [ ] Icon selection grid:
    ```tsx
    const CATEGORY_ICONS = [
      { id: "coffee", name: "Coffee", icon: Coffee },
      { id: "shopping-cart", name: "Groceries", icon: ShoppingCart },
      { id: "car", name: "Transport", icon: Car },
      { id: "gamepad-2", name: "Entertainment", icon: Gamepad2 },
      { id: "home", name: "Bills", icon: Home },
      { id: "heart", name: "Health", icon: Heart },
      // ... more icons
    ];
    ```

### 5. Account Selection Component

- [x] Create `components/finance/AccountSelector.tsx`:
  - [x] Account selection dropdown:
    - [x] Current account display with balance
    - [x] Dropdown with all available accounts
    - [x] Account icons and names
    - [x] Default account pre-selected
  - [x] Account switching:
    - [x] Quick account switching without leaving form
    - [x] Visual feedback for selection
    - [x] Account balance preview
  - [x] Account creation shortcut:
    - [x] "Add Account" option in dropdown
    - [x] Quick account creation without losing form data

### 6. Transaction Hooks & State Management

- [x] Create `lib/hooks/useTransactions.ts`:
  - [x] Implement `useCreateTransaction()` hook:
    - [x] Mutation to create new transaction
    - [x] Handle balance updates automatically
    - [x] Optimistic updates for immediate feedback
    - [x] Error handling and rollback
  - [x] Implement `useQuickExpense()` hook:
    - [x] Manage expense entry flow state
    - [x] Track form progress (amount → details → save)
    - [x] Handle form validation
    - [x] Provide smart defaults
  - [x] Transaction caching and updates:
    - [x] Update account balances immediately
    - [x] Refresh transaction lists
    - [x] Handle concurrent modifications

### 7. Smart Defaults & Suggestions

- [x] Implement intelligent defaults:
  - [x] Default account selection:
    - [x] Use user's designated default account
    - [x] Remember last used account
    - [x] Fallback to first account
  - [x] Category suggestions:
    - [x] Recent categories based on user history
    - [x] Time-based suggestions (coffee in morning, lunch at noon)
    - [x] Amount-based suggestions (similar amounts → similar categories)
  - [x] Auto-generated descriptions:
    - [x] Use category name if description is empty
    - [x] Smart description suggestions based on category
    - [x] Previous transaction patterns

### 8. Expense Entry Optimizations

- [x] Performance optimizations:
  - [x] Preload categories and accounts
  - [x] Optimistic UI updates
  - [x] Background category caching
  - [x] Efficient re-renders
- [x] UX improvements:
  - [x] Form state persistence:
    - [x] Save form data if user navigates away
    - [x] Restore form state on return
    - [x] Handle app backgrounding
  - [x] Quick retry mechanisms:
    - [x] Retry failed submissions
    - [x] Offline support with sync
    - [x] Connection status feedback

### 9. Integration with Main Finance Screen

**Prerequisites:** [Task 04 - Finance Account Management](mdc:04-finance-account-management.md) - Account management must be complete

- [x] Update `app/finance/index.tsx`:
  - [x] Add Expense button integration:
    - [x] Prominent "Add Expense" button
    - [x] Navigation to expense entry flow
    - [x] Return to finance home after expense creation
  - [x] Real-time balance updates:
    - [x] Update displayed balances after expense creation
    - [x] Refresh transaction lists
    - [x] Show success feedback
  - [x] Recent expenses display:
    - [x] Show most recent expenses on home screen
    - [x] Quick edit/delete options
    - [x] Pull-to-refresh functionality

### 10. Testing & Validation

- [x] Form validation implementation:

  - [x] Amount validation:
    - [x] Positive amounts only
    - [x] Reasonable maximum limits
    - [x] Proper decimal handling
  - [x] Category validation:
    - [x] Required category selection
    - [x] Valid category creation
    - [x] Fallback to "Other" if needed
  - [x] Account validation:
    - [x] Valid account selection
    - [x] Account ownership verification
    - [x] Sufficient balance checks (if applicable)

- [x] Error handling:

  - [x] Network error handling:
    - [x] Offline mode support
    - [x] Retry mechanisms
    - [x] User-friendly error messages
  - [x] Validation error display:
    - [x] Real-time validation feedback
    - [x] Clear error messaging
    - [x] Field-specific error indicators

- [x] User testing:
  - [x] 5-second expense entry test
  - [x] Various device sizes and orientations
  - [x] Accessibility testing
  - [x] Performance testing with many categories

## Prerequisites

- [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Transaction and category functions must be implemented
- [Task 03 - Finance Service Setup & Cloud Integration](mdc:03-finance-service-setup.md) - Finance service foundation must be complete
- [Task 04 - Finance Account Management](mdc:04-finance-account-management.md) - Account management must be complete

## Acceptance Criteria

- [ ] Users can add an expense in under 5 seconds (target: 3 taps maximum)
- [ ] Amount entry feels natural with custom number pad
- [ ] Category selection is fast with smart suggestions
- [ ] Account selection defaults to user's preferred account
- [ ] New categories can be created inline without losing form data
- [ ] Form state persists during navigation and app backgrounding
- [ ] Balance updates immediately after expense creation
- [ ] All input validation provides clear, helpful feedback
- [ ] Expense entry works smoothly across different device sizes
- [ ] Error handling guides users to successful completion
- [ ] Offline support allows expense entry without immediate sync
- [ ] Accessibility features support screen readers and other assistive technologies
