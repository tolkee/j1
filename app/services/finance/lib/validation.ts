import { GenericId as Id } from "convex/values";

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Account validation rules
export const ACCOUNT_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_'.()]+$/, // Allow common account name characters
  },
  description: {
    required: false,
    maxLength: 200,
  },
  balance: {
    min: -1000000, // Allow negative balances for credit cards, loans
    max: 1000000000, // 1 billion max
  },
};

/**
 * Validate account name
 */
export function validateAccountName(
  name: string,
  existingNames: string[] = []
): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push({
      field: "name",
      message: "Account name is required",
      code: "REQUIRED",
    });
    return errors;
  }

  if (trimmedName.length < ACCOUNT_VALIDATION_RULES.name.minLength) {
    errors.push({
      field: "name",
      message: `Account name must be at least ${ACCOUNT_VALIDATION_RULES.name.minLength} characters`,
      code: "MIN_LENGTH",
    });
  }

  if (trimmedName.length > ACCOUNT_VALIDATION_RULES.name.maxLength) {
    errors.push({
      field: "name",
      message: `Account name cannot exceed ${ACCOUNT_VALIDATION_RULES.name.maxLength} characters`,
      code: "MAX_LENGTH",
    });
  }

  if (!ACCOUNT_VALIDATION_RULES.name.pattern.test(trimmedName)) {
    errors.push({
      field: "name",
      message: "Account name contains invalid characters",
      code: "INVALID_PATTERN",
    });
  }

  // Check for duplicate names (case-insensitive)
  if (
    existingNames.some(
      (existing) => existing.toLowerCase() === trimmedName.toLowerCase()
    )
  ) {
    errors.push({
      field: "name",
      message: "An account with this name already exists",
      code: "DUPLICATE",
    });
  }

  return errors;
}

/**
 * Validate account description
 */
export function validateAccountDescription(
  description?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    description &&
    description.length > ACCOUNT_VALIDATION_RULES.description.maxLength
  ) {
    errors.push({
      field: "description",
      message: `Description cannot exceed ${ACCOUNT_VALIDATION_RULES.description.maxLength} characters`,
      code: "MAX_LENGTH",
    });
  }

  return errors;
}

/**
 * Validate account balance/amount
 */
export function validateAccountBalance(
  balance: number | string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = typeof balance === "string" ? parseFloat(balance) : balance;

  if (isNaN(numValue)) {
    errors.push({
      field: "balance",
      message: "Please enter a valid amount",
      code: "INVALID_NUMBER",
    });
    return errors;
  }

  if (numValue < ACCOUNT_VALIDATION_RULES.balance.min) {
    errors.push({
      field: "balance",
      message: `Amount cannot be less than $${ACCOUNT_VALIDATION_RULES.balance.min.toLocaleString()}`,
      code: "MIN_VALUE",
    });
  }

  if (numValue > ACCOUNT_VALIDATION_RULES.balance.max) {
    errors.push({
      field: "balance",
      message: `Amount cannot exceed $${ACCOUNT_VALIDATION_RULES.balance.max.toLocaleString()}`,
      code: "MAX_VALUE",
    });
  }

  return errors;
}

/**
 * Validate complete account form data
 */
export function validateAccountForm(
  data: {
    name: string;
    description?: string;
    icon: string;
    defaultValue: number;
  },
  existingNames: string[] = []
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  errors.push(...validateAccountName(data.name, existingNames));

  // Validate description
  if (data.description) {
    errors.push(...validateAccountDescription(data.description));
  }

  // Validate icon
  if (!data.icon) {
    errors.push({
      field: "icon",
      message: "Please select an account icon",
      code: "REQUIRED",
    });
  }

  // Validate balance
  errors.push(...validateAccountBalance(data.defaultValue));

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  options?: {
    currency?: string;
    locale?: string;
    showSign?: boolean;
  }
): string {
  const {
    currency = "USD",
    locale = "en-US",
    showSign = false,
  } = options || {};

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Parse currency input string
 */
export function parseCurrencyInput(input: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = input.replace(/[$,\s]/g, "");

  // Handle negative values
  const isNegative = cleaned.includes("-");
  const numericPart = cleaned.replace("-", "");

  const parsed = parseFloat(numericPart);
  return isNaN(parsed) ? 0 : isNegative ? -parsed : parsed;
}

/**
 * Validate account ID format
 */
export function validateAccountId(accountId: string): boolean {
  // Basic validation for Convex ID format
  return typeof accountId === "string" && accountId.length > 0;
}

/**
 * Convert validation errors to user-friendly messages
 */
export function getErrorsByField(
  errors: ValidationError[]
): Record<string, string> {
  const errorMap: Record<string, string> = {};

  errors.forEach((error) => {
    if (!errorMap[error.field]) {
      errorMap[error.field] = error.message;
    }
  });

  return errorMap;
}

/**
 * Check if network error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("fetch")
    );
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Handle common backend validation errors
    if (message.includes("already exists")) {
      return "An account with this name already exists";
    }

    if (message.includes("not found")) {
      return "Account not found or no longer exists";
    }

    if (message.includes("permission") || message.includes("unauthorized")) {
      return "You don't have permission to perform this action";
    }

    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again";
    }

    // Return the original message if it's user-friendly
    if (message.length < 100 && !message.includes("Error:")) {
      return message;
    }
  }

  return "An unexpected error occurred. Please try again";
}
