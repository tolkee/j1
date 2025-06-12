import React from "react";
import { YStack, XStack, Text, Card, Spinner } from "tamagui";
import { Calendar, Activity, Repeat } from "@tamagui/lucide-icons";
import { GenericId as Id } from "convex/values";
import { DEFAULT_CATEGORY_COLORS } from "../constants";
import { formatCurrency } from "../lib/formatCurrency";

interface Transaction {
  _id: Id<"transactions">;
  amount: number;
  description?: string;
  date: number;
  categoryId?: Id<"categories">;
  isRecurring?: boolean;
  recurringTransactionId?: Id<"recurringTransactions">;
  _creationTime: number;
}

interface Category {
  _id: Id<"categories">;
  name: string;
  icon: string;
  color?: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
  categories?: Category[];
  isLoading?: boolean;
  emptyMessage?: string;
  showDateDetails?: boolean;
  limit?: number;
  onTransactionPress?: (transaction: Transaction) => void;
  currency?: "USD" | "EUR";
}

export const TransactionList = React.memo(function TransactionList({
  transactions = [],
  categories = [],
  isLoading = false,
  emptyMessage = "No transactions yet",
  showDateDetails = true,
  limit,
  onTransactionPress,
  currency = "USD",
}: TransactionListProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(showDateDetails && { year: "numeric" }),
    });
  };

  const displayTransactions = limit
    ? transactions.slice(0, limit)
    : transactions;

  if (isLoading) {
    return (
      <Card padding="$8" borderRadius="$6">
        <YStack alignItems="center" gap="$4">
          <Spinner size="small" color="$blue10" />
          <Text color="$color11" textAlign="center" fontSize="$5">
            Loading transactions...
          </Text>
        </YStack>
      </Card>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <Card padding="$8" borderRadius="$6">
        <YStack alignItems="center" gap="$4">
          <Activity size="$3" color="$color11" />
          <Text color="$color11" textAlign="center" fontSize="$5">
            {emptyMessage}
          </Text>
        </YStack>
      </Card>
    );
  }

  return (
    <YStack gap="$3">
      {displayTransactions.map((transaction) => {
        // Find category data for icon and color
        const category = categories.find(
          (cat) => cat._id === transaction.categoryId
        );
        // Ensure icon is a string and fallback to default if undefined/null
        const categoryIcon =
          category?.icon && typeof category.icon === "string"
            ? category.icon
            : "💰";
        const categoryColor = category?.color || DEFAULT_CATEGORY_COLORS[0];

        // Use description if provided, otherwise show "Expense" or "Income" based on amount
        const displayTitle =
          transaction.description ||
          (transaction.amount < 0 ? "Expense" : "Income");

        return (
          <Card
            key={transaction._id}
            padding="$4"
            borderRadius="$4"
            onPress={
              onTransactionPress
                ? () => onTransactionPress(transaction)
                : undefined
            }
            pressStyle={
              onTransactionPress ? { scale: 0.98, opacity: 0.8 } : undefined
            }
          >
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$3" flex={1}>
                {/* Category Icon */}
                <YStack
                  width={40}
                  height={40}
                  backgroundColor={categoryColor as any}
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="$4">{categoryIcon}</Text>
                </YStack>

                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="600">
                    {displayTitle}
                  </Text>
                  <XStack alignItems="center" gap="$2" marginTop="$1">
                    <Calendar size="$0.75" color="$color11" />
                    <Text fontSize="$3" color="$color11">
                      {formatDate(transaction.date)}
                    </Text>
                    {transaction.isRecurring && (
                      <>
                        <Text fontSize="$3" color="$color11">
                          •
                        </Text>
                        <XStack alignItems="center" gap="$1">
                          <Repeat size="$0.75" color="$blue10" />
                          <Text fontSize="$3" color="$blue10" fontWeight="600">
                            Recurring
                          </Text>
                        </XStack>
                      </>
                    )}
                    {category && (
                      <>
                        <Text fontSize="$3" color="$color11">
                          •
                        </Text>
                        <Text fontSize="$3" color="$color11">
                          {category.name}
                        </Text>
                      </>
                    )}
                  </XStack>
                </YStack>
              </XStack>

              <Text
                fontSize="$5"
                fontWeight="bold"
                color={transaction.amount >= 0 ? "$green10" : "$red10"}
              >
                {transaction.amount >= 0 ? "+" : ""}
                {formatCurrency(transaction.amount, currency)}
              </Text>
            </XStack>
          </Card>
        );
      })}
    </YStack>
  );
});
