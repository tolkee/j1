# Task 07 - Finance Recurring Transactions

## Description

Implement the recurring transactions system that allows users to set up automated recurring income and expenses. This includes creating recurring transaction schedules, managing existing recurring items, and processing them automatically in the background.

## Subtasks

### 1. Recurring Transaction Hooks

**Prerequisites:** [Task 06 - Finance Transaction History & Income Entry](mdc:06-finance-transaction-history.md) - Transaction management must be complete

- [ ] Create `lib/hooks/useRecurringTransactions.ts`:
  - [ ] Implement `useGetRecurringTransactions()` hook:
    - [ ] Query user's recurring transactions
    - [ ] Include next execution dates and status
    - [ ] Filter by account, category, or active status
    - [ ] Sort by next execution date
  - [ ] Implement `useCreateRecurringTransaction()` hook:
    - [ ] Create new recurring transaction setup
    - [ ] Validate frequency and scheduling
    - [ ] Calculate next execution dates
    - [ ] Handle different recurrence patterns
  - [ ] Implement `useUpdateRecurringTransaction()` hook:
    - [ ] Modify existing recurring transactions
    - [ ] Update schedules and amounts
    - [ ] Handle status changes (active/inactive)
    - [ ] Recalculate execution dates
  - [ ] Implement `useDeleteRecurringTransaction()` hook:
    - [ ] Delete recurring transaction setups
    - [ ] Handle existing generated transactions
    - [ ] Provide options to keep or remove past transactions

### 2. Recurring Transaction Setup Flow

- [ ] Create `app/finance/recurring/add.tsx`:
  - [ ] **Step 1: Transaction Details**:
    - [ ] Amount entry (similar to regular transactions)
    - [ ] Category selection
    - [ ] Description field
    - [ ] Account selection
    - [ ] Income vs expense selection
  - [ ] **Step 2: Recurrence Schedule**:
    - [ ] Frequency selection:
      ```tsx
      const FREQUENCY_OPTIONS = [
        { id: "daily", label: "Daily", description: "Every day" },
        { id: "weekly", label: "Weekly", description: "Every week" },
        { id: "biweekly", label: "Bi-weekly", description: "Every 2 weeks" },
        { id: "monthly", label: "Monthly", description: "Every month" },
        { id: "quarterly", label: "Quarterly", description: "Every 3 months" },
        { id: "yearly", label: "Yearly", description: "Every year" },
      ];
      ```
    - [ ] Start date selection (defaults to today)
    - [ ] End date selection (optional)
    - [ ] Preview of next few execution dates
  - [ ] **Step 3: Confirmation**:
    - [ ] Summary of recurring transaction
    - [ ] Preview of upcoming transactions
    - [ ] Confirmation and creation

### 3. Recurring Transaction Management Screen

- [ ] Create `app/finance/recurring/index.tsx`:
  - [ ] Recurring transactions list:
    - [ ] Active recurring transactions
    - [ ] Next execution date prominently displayed
    - [ ] Amount, category, and frequency
    - [ ] Quick actions (pause/resume, edit, delete)
  - [ ] Recurring transaction organization:
    - [ ] Group by frequency (Daily, Weekly, Monthly, etc.)
    - [ ] Sort by next execution date
    - [ ] Filter by active/inactive status
    - [ ] Search by description or category
  - [ ] Management actions:
    - [ ] Add new recurring transaction
    - [ ] Bulk actions (pause multiple, delete multiple)
    - [ ] Import recurring transactions from templates

### 4. Recurring Transaction List Component

- [ ] Create `components/finance/RecurringTransactionsList.tsx`:
  - [ ] List item design:
    - [ ] Transaction amount with income/expense styling
    - [ ] Category icon and name
    - [ ] Description
    - [ ] Frequency badge (Daily, Weekly, Monthly)
    - [ ] Next execution date
    - [ ] Active/inactive status indicator
  - [ ] Interactive features:
    - [ ] Tap to view/edit details
    - [ ] Swipe to pause/resume
    - [ ] Long press for multi-select
    - [ ] Quick toggle active/inactive
  - [ ] Visual design:
    ```tsx
    <XStack ai="center" p="$3" bg="$background">
      <Circle size="$4" bg={categoryColor} mr="$3">
        <CategoryIcon />
      </Circle>
      <YStack f={1}>
        <XStack ai="center" jc="space-between">
          <Text fontSize="$4" fontWeight="500">
            {description}
          </Text>
          <Text
            fontSize="$4"
            fontWeight="bold"
            color={amount > 0 ? "$green10" : "$red10"}
          >
            {amount > 0 ? "+" : ""}${Math.abs(amount).toFixed(2)}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between" mt="$1">
          <XStack ai="center" gap="$2">
            <Badge variant="outlined">{frequency}</Badge>
            <Text fontSize="$2" color="$gray10">
              {categoryName}
            </Text>
          </XStack>
          <Text fontSize="$2" color="$gray10">
            Next: {formatDate(nextExecutionDate)}
          </Text>
        </XStack>
      </YStack>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggleActive}
        size="$2"
      />
    </XStack>
    ```

### 5. Recurring Transaction Details & Editing

- [ ] Create `app/finance/recurring/[id].tsx`:
  - [ ] Recurring transaction details:
    - [ ] Complete transaction information
    - [ ] Recurrence schedule details
    - [ ] Creation date and history
    - [ ] Generated transactions count
    - [ ] Next few execution dates preview
  - [ ] Edit functionality:
    - [ ] Modify amount, category, description
    - [ ] Change recurrence frequency
    - [ ] Update start/end dates
    - [ ] Pause/resume recurring transaction
  - [ ] Generated transactions:
    - [ ] List of transactions created from this recurring setup
    - [ ] Quick access to individual transactions
    - [ ] Statistics (total amount, frequency completion)

### 6. Recurring Transaction Templates

- [ ] Create `components/finance/RecurringTemplates.tsx`:
  - [ ] Common recurring transaction templates:
    ```tsx
    const RECURRING_TEMPLATES = [
      {
        name: "Monthly Rent",
        category: "Housing",
        frequency: "monthly",
        type: "expense",
        icon: "Home",
      },
      {
        name: "Weekly Groceries",
        category: "Food",
        frequency: "weekly",
        type: "expense",
        icon: "ShoppingCart",
      },
      {
        name: "Monthly Salary",
        category: "Salary",
        frequency: "monthly",
        type: "income",
        icon: "Banknote",
      },
      {
        name: "Quarterly Investment",
        category: "Investment",
        frequency: "quarterly",
        type: "expense",
        icon: "TrendingUp",
      },
    ];
    ```
  - [ ] Template selection interface:
    - [ ] Browse template categories
    - [ ] Quick setup with template defaults
    - [ ] Customize template before creating
    - [ ] Save custom templates for reuse

### 7. Recurring Transaction Processing (Client-Side Handling)

- [ ] Create `lib/hooks/useRecurringProcessor.ts`:
  - [ ] Client-side recurring transaction awareness:
    - [ ] Check for due recurring transactions on app start
    - [ ] Remind users of pending recurring transactions
    - [ ] Provide quick execution of due transactions
    - [ ] Handle manual triggering of recurring transactions
  - [ ] Notification and reminders:
    - [ ] Show notifications for due recurring transactions
    - [ ] Provide quick action to execute or skip
    - [ ] Handle user confirmation for recurring execution
  - [ ] Background sync coordination:
    - [ ] Coordinate with backend processing
    - [ ] Handle conflicts between manual and automatic execution
    - [ ] Provide status updates on processing

### 8. Integration with Transaction Entry

**Prerequisites:** [Task 05 - Finance Quick Expense Entry](mdc:05-finance-quick-expense-entry.md) and [Task 06 - Finance Transaction History & Income Entry](mdc:06-finance-transaction-history.md) - Transaction entry flows must be complete

- [ ] Extend expense entry flow:
  - [ ] Add "Make Recurring" option in expense entry
  - [ ] Quick setup for recurring expenses
  - [ ] Convert one-time expense to recurring
  - [ ] Set frequency during expense creation
- [ ] Extend income entry flow:
  - [ ] Add "Make Recurring" option for income
  - [ ] Salary and regular income quick setup
  - [ ] Recurring income scheduling
- [ ] Transaction duplication with recurring:
  - [ ] "Duplicate as Recurring" option in transaction details
  - [ ] Convert existing transaction to recurring template
  - [ ] Suggest recurring setup for frequent similar transactions

### 9. Recurring Transaction Analytics

- [ ] Create `components/finance/RecurringAnalytics.tsx`:
  - [ ] Recurring transaction insights:
    - [ ] Total monthly recurring income vs expenses
    - [ ] Percentage of budget from recurring transactions
    - [ ] Upcoming recurring transactions calendar view
    - [ ] Recurring transaction impact on cash flow
  - [ ] Recurring expense analysis:
    - [ ] Fixed vs variable expense breakdown
    - [ ] Category distribution of recurring expenses
    - [ ] Trends in recurring transaction amounts
  - [ ] Budget planning features:
    - [ ] Monthly budget impact of recurring transactions
    - [ ] Future balance projections based on recurring items
    - [ ] Comparison of actual vs planned recurring transactions

### 10. Advanced Recurring Features

- [ ] Flexible scheduling options:
  - [ ] Custom intervals (every 2 weeks, every 3 months)
  - [ ] Weekday-specific recurring (every Friday)
  - [ ] Month-end recurring (last day of month)
  - [ ] Seasonal recurring (quarterly, semi-annually)
- [ ] Amount variation handling:
  - [ ] Variable amount ranges for recurring transactions
  - [ ] Inflation adjustment for recurring transactions
  - [ ] User confirmation for amount changes
- [ ] Smart recurring suggestions:
  - [ ] Analyze user patterns to suggest recurring setups
  - [ ] Detect manually repeated transactions
  - [ ] Suggest optimization of recurring schedules

### 11. Recurring Transaction Error Handling

- [ ] Processing error management:
  - [ ] Handle failed recurring transaction execution
  - [ ] Retry mechanisms for temporary failures
  - [ ] User notification of processing issues
  - [ ] Manual execution as fallback
- [ ] Schedule conflict resolution:
  - [ ] Handle date conflicts (weekends, holidays)
  - [ ] Provide options for rescheduling
  - [ ] User preferences for conflict handling
- [ ] Data integrity protection:
  - [ ] Prevent duplicate recurring transaction creation
  - [ ] Validate recurring transaction constraints
  - [ ] Handle account or category deletion scenarios

### 12. Performance & Optimization

- [ ] Efficient recurring transaction management:
  - [ ] Optimize queries for large numbers of recurring transactions
  - [ ] Cache recurring transaction schedules
  - [ ] Batch processing for multiple due transactions
  - [ ] Background sync optimization
- [ ] User experience optimizations:
  - [ ] Fast loading of recurring transaction lists
  - [ ] Smooth animations for status changes
  - [ ] Optimistic updates for immediate feedback
  - [ ] Efficient pagination for large recurring lists

## Prerequisites

- [Task 02 - Finance Service Backend](mdc:../../convex/doc/task/02-finance-service-backend.md) - Recurring transaction backend functions must be implemented
- [Task 05 - Finance Quick Expense Entry](mdc:05-finance-quick-expense-entry.md) - Basic transaction entry must be complete
- [Task 06 - Finance Transaction History & Income Entry](mdc:06-finance-transaction-history.md) - Transaction management must be complete

## Acceptance Criteria

- [ ] Users can create recurring transactions with flexible scheduling options
- [ ] Recurring transactions list shows all active and inactive recurring setups
- [ ] Users can edit, pause, resume, and delete recurring transactions
- [ ] Recurring transaction templates provide quick setup for common scenarios
- [ ] Integration with expense and income entry allows easy recurring setup
- [ ] Due recurring transactions are properly communicated to users
- [ ] Recurring transaction processing maintains data accuracy and integrity
- [ ] Analytics provide insights into recurring transaction patterns
- [ ] Error handling ensures reliable recurring transaction management
- [ ] Performance remains smooth with many recurring transactions
- [ ] Advanced scheduling options support complex recurring patterns
- [ ] User experience feels intuitive and matches the simplicity of other finance features
