import React from "react";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  H4,
  ScrollView,
} from "tamagui";
import {
  Plus,
  Clock,
  ArrowRight,
  Calendar,
  Repeat,
} from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { GenericId as Id } from "convex/values";
import { useRecurringTransactions, recurringTransactionUtils } from "../hooks/useRecurringTransactions";
import { formatCurrency } from "../lib/formatCurrency";
import { RecurringTransactionItem } from "./RecurringTransactionItem";

interface RecurringTransactionCardProps {
  accountId: Id<"bankAccounts">;
  currency?: "USD" | "EUR";
  onAddRecurring: () => void;
  onViewRecurring?: (recurringTransactionId: Id<"recurringTransactions">) => void;
}

export function RecurringTransactionCard({
  accountId,
  currency = "USD",
  onAddRecurring,
  onViewRecurring,
}: RecurringTransactionCardProps) {
  const { recurringTransactions, isLoading } = useRecurringTransactions({
    accountId,
    isActive: true,
  });

  const upcomingTransactions = recurringTransactions
    .filter((rt) => rt.daysUntilNext >= 0)
    .slice(0, 3); // Show next 3 upcoming

  if (isLoading) {
    return (
      <Card padding="$4">
        <YStack gap="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2">
              <Repeat size="$1" color="$color11" />
              <Text fontSize="$5" fontWeight="600">
                Recurring Transactions
              </Text>
            </XStack>
          </XStack>
          <Text color="$color11">Loading...</Text>
        </YStack>
      </Card>
    );
  }

  return (
    <Card padding="$4">
      <YStack gap="$3">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$2">
            <Repeat size="$1" color="$color11" />
            <Text fontSize="$5" fontWeight="600">
              Recurring Transactions
            </Text>
          </XStack>
          <Button
            size="$3"
            variant="outlined"
            icon={Plus}
            onPress={onAddRecurring}
          >
            Add
          </Button>
        </XStack>

        {/* Content */}
        {recurringTransactions.length === 0 ? (
          <YStack gap="$3" alignItems="center" paddingVertical="$4">
            <Calendar size="$2" color="$color11" />
            <YStack alignItems="center" gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color11">
                No Recurring Transactions
              </Text>
              <Text fontSize="$3" color="$color11" textAlign="center">
                Set up automatic income or expenses that repeat on a schedule
              </Text>
            </YStack>
            <Button
              backgroundColor="$blue9"
              color="white"
              icon={Plus}
              onPress={onAddRecurring}
            >
              Create First Recurring Transaction
            </Button>
          </YStack>
        ) : (
          <YStack gap="$3">
            {upcomingTransactions.length > 0 && (
              <YStack gap="$2">
                {upcomingTransactions.map((recurringTx) => (
                  <RecurringTransactionItem
                    key={recurringTx._id}
                    transaction={recurringTx}
                    currency={currency}
                    onPress={() => onViewRecurring?.(recurringTx._id)}
                  />
                ))}
              </YStack>
            )}

            {/* View All Button */}
            {recurringTransactions.length > 3 && (
              <>
                <Separator />
                <Button
                  variant="outlined"
                  onPress={() => router.push(`/finance/recurring-transactions?accountId=${accountId}`)}
                >
                  <Text>View All ({recurringTransactions.length})</Text>
                </Button>
              </>
            )}

            {/* Total Count - only show if no View All button */}
            {upcomingTransactions.length > 0 && recurringTransactions.length <= 3 && (
              <XStack justifyContent="center" paddingTop="$2">
                <Text fontSize="$2" color="$color11">
                  {upcomingTransactions.length} recurring transaction{upcomingTransactions.length !== 1 ? 's' : ''}
                </Text>
              </XStack>
            )}

          </YStack>
        )}
      </YStack>
    </Card>
  );
}