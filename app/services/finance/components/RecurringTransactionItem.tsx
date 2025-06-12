import React from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { formatCurrency } from "../lib/formatCurrency";
import { recurringTransactionUtils } from "../hooks/useRecurringTransactions";

interface RecurringTransaction {
  _id: string;
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  isActive: boolean;
  daysUntilNext: number;
}

interface RecurringTransactionItemProps {
  transaction: RecurringTransaction;
  currency?: "USD" | "EUR";
  onPress?: (transaction: RecurringTransaction) => void;
}

export function RecurringTransactionItem({
  transaction,
  currency = "USD",
  onPress,
}: RecurringTransactionItemProps) {
  return (
    <Card
      padding="$3"
      backgroundColor="$color2"
      borderWidth={1}
      borderColor="$color5"
      pressStyle={{ scale: 0.98 }}
      onPress={() => onPress?.(transaction)}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3" flex={1}>
          {/* Category Icon */}
          <YStack
            width={32}
            height={32}
            backgroundColor={transaction.categoryColor as any || "$color5"}
            borderRadius="$2"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$3">{transaction.categoryIcon || "💰"}</Text>
          </YStack>

          <YStack flex={1} gap="$1">
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color" numberOfLines={1} flex={1}>
                {transaction.description}
              </Text>
              {!transaction.isActive && (
                <Text
                  fontSize="$1"
                  color="$yellow10"
                  fontWeight="600"
                  backgroundColor="$yellow2"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  PAUSED
                </Text>
              )}
            </XStack>
            
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$2" color="$color11">
                {recurringTransactionUtils.formatFrequency(transaction.frequency)}
              </Text>
              {transaction.categoryName && (
                <>
                  <Text fontSize="$2" color="$color11">
                    •
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    {transaction.categoryName}
                  </Text>
                </>
              )}
            </XStack>
          </YStack>
        </XStack>

        <Text
          fontSize="$4"
          fontWeight="bold"
          color={transaction.amount > 0 ? "$green10" : "$red10"}
        >
          {transaction.amount > 0 ? "+" : ""}
          {formatCurrency(Math.abs(transaction.amount), currency)}
        </Text>
      </XStack>
    </Card>
  );
}