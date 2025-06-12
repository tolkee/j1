import React, { useMemo } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Calendar,
} from "@tamagui/lucide-icons";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { formatCurrency } from "../lib/formatCurrency";

interface Transaction {
  _id: string;
  amount: number;
  categoryId?: string;
  accountId?: string;
  description?: string;
  date?: number;
  _creationTime: number;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
}

interface TransactionInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth?: Date;
  accountId?: string; // Filter by specific account
  currency?: "USD" | "EUR"; // Currency for formatting
}

export function TransactionInsights({
  transactions,
  categories,
  currentMonth = new Date(),
  accountId,
  currency = "USD",
}: TransactionInsightsProps) {
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Current month filter
    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Previous month for comparison
    const previousMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0
    );

    // Filter transactions by current month
    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date || t._creationTime);
      const isInCurrentMonth =
        date >= currentMonthStart && date <= currentMonthEnd;
      const isFromAccount = !accountId || t.accountId === accountId;

      return isInCurrentMonth && isFromAccount;
    });

    // Filter transactions by previous month
    const previousMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date || t._creationTime);
      const isInPreviousMonth =
        date >= previousMonthStart && date <= previousMonthEnd;
      const isFromAccount = !accountId || t.accountId === accountId;

      return isInPreviousMonth && isFromAccount;
    });

    // Calculate totals
    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = Math.abs(
      currentMonthTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const previousMonthExpenses = Math.abs(
      previousMonthTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const netBalance = currentMonthIncome - currentMonthExpenses;

    // Spending comparison with previous month
    const spendingChange =
      previousMonthExpenses > 0
        ? ((currentMonthExpenses - previousMonthExpenses) /
            previousMonthExpenses) *
          100
        : 0;

    // Category spending analysis
    const categorySpending = currentMonthTransactions
      .filter((t) => t.amount < 0)
      .reduce(
        (acc, t) => {
          const categoryId = t.categoryId || "uncategorized";
          acc[categoryId] = (acc[categoryId] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    // Top spending category
    const topSpendingCategory = Object.entries(categorySpending).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Largest transaction
    const largestTransaction = currentMonthTransactions.reduce(
      (largest, current) => {
        return Math.abs(current.amount) > Math.abs(largest.amount)
          ? current
          : largest;
      },
      currentMonthTransactions[0]
    );

    // Average transaction amount
    const averageTransaction =
      currentMonthTransactions.length > 0
        ? Math.abs(
            currentMonthTransactions.reduce(
              (sum, t) => sum + Math.abs(t.amount),
              0
            ) / currentMonthTransactions.length
          )
        : 0;

    return {
      currentMonthIncome,
      currentMonthExpenses,
      netBalance,
      spendingChange,
      topSpendingCategory,
      largestTransaction,
      averageTransaction,
      transactionCount: currentMonthTransactions.length,
    };
  }, [transactions, categories, currentMonth, accountId]);

  if (!insights) {
    return (
      <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
        <YStack alignItems="center" gap="$2">
          <PieChart size="$2" color="$color9" />
          <Text fontSize="$4" color="$color11">
            No data available for insights
          </Text>
        </YStack>
      </Card>
    );
  }

  const getSpendingTrendColor = () => {
    if (insights.spendingChange > 10) return "red";
    if (insights.spendingChange > 0) return "orange";
    return "green";
  };

  const getSpendingTrendIcon = () => {
    return insights.spendingChange > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <YStack gap="$3">
      {/* Category Donut Chart */}
      <CategoryDonutChart
        transactions={transactions}
        categories={categories}
        currentMonth={currentMonth}
        accountId={accountId}
        currency={currency}
      />

      {/* Monthly Summary */}
      <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" color="$color">
            This Month Summary
          </Text>

          <XStack justifyContent="space-between">
            <YStack gap="$1">
              <Text fontSize="$2" color="$color11">
                Income
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$green10">
                {formatCurrency(insights.currentMonthIncome, currency)}
              </Text>
            </YStack>

            <YStack gap="$1" alignItems="center">
              <Text fontSize="$2" color="$color11">
                Expenses
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$red10">
                {formatCurrency(insights.currentMonthExpenses, currency)}
              </Text>
            </YStack>

            <YStack gap="$1" alignItems="flex-end">
              <Text fontSize="$2" color="$color11">
                Net
              </Text>
              <Text
                fontSize="$4"
                fontWeight="600"
                color={insights.netBalance >= 0 ? "$green10" : "$red10"}
              >
                {formatCurrency(insights.netBalance, currency)}
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      {/* Spending Trend */}
      <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
        <XStack alignItems="center" justifyContent="space-between">
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="500" color="$color">
              Spending vs Last Month
            </Text>
            <Text fontSize="$3" color="$color11">
              {Math.abs(insights.spendingChange).toFixed(1)}%
              {insights.spendingChange > 0 ? " increase" : " decrease"}
            </Text>
          </YStack>

          <XStack alignItems="center" gap="$2">
            {React.createElement(getSpendingTrendIcon(), {
              size: "$1",
              color: getSpendingTrendColor(),
            })}
            <Text
              fontSize="$3"
              color={getSpendingTrendColor()}
              fontWeight="500"
            >
              {insights.spendingChange > 0 ? "+" : ""}
              {insights.spendingChange.toFixed(1)}%
            </Text>
          </XStack>
        </XStack>
      </Card>

      {/* Quick Stats */}
      <XStack gap="$3">
        {/* Top Category */}
        {insights.topSpendingCategory && (
          <Card
            flex={1}
            padding="$3"
            borderRadius="$4"
            backgroundColor="$color2"
          >
            <YStack gap="$2">
              <XStack alignItems="center" gap="$2">
                <PieChart size="$0.75" color="$color9" />
                <Text fontSize="$2" color="$color11">
                  Top Category
                </Text>
              </XStack>

              <YStack>
                <Text fontSize="$3" fontWeight="500" color="$color">
                  {categories.find(
                    (c) => c._id === insights.topSpendingCategory![0]
                  )?.name || "Other"}
                </Text>
                <Text fontSize="$2" color="$red10">
                  {formatCurrency(insights.topSpendingCategory[1], currency)}
                </Text>
              </YStack>
            </YStack>
          </Card>
        )}

        {/* Transaction Count */}
        <Card flex={1} padding="$3" borderRadius="$4" backgroundColor="$color2">
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <Calendar size="$0.75" color="$color9" />
              <Text fontSize="$2" color="$color11">
                Transactions
              </Text>
            </XStack>

            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$color">
                {insights.transactionCount}
              </Text>
              <Text fontSize="$2" color="$color11">
                This month
              </Text>
            </YStack>
          </YStack>
        </Card>
      </XStack>

      {/* Largest Transaction */}
      {insights.largestTransaction && (
        <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <DollarSign size="$1" color="$color9" />
              <Text fontSize="$4" fontWeight="500" color="$color">
                Largest Transaction
              </Text>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize="$3" color="$color">
                  {insights.largestTransaction.description || "No description"}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {new Date(
                    insights.largestTransaction.date ||
                      insights.largestTransaction._creationTime
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </YStack>

              <Text
                fontSize="$4"
                fontWeight="600"
                color={
                  insights.largestTransaction.amount > 0 ? "$green10" : "$red10"
                }
              >
                {insights.largestTransaction.amount > 0 ? "+" : "-"}
                {formatCurrency(
                  Math.abs(insights.largestTransaction.amount),
                  currency
                )}
              </Text>
            </XStack>
          </YStack>
        </Card>
      )}

      {/* Average Transaction */}
      <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <Text fontSize="$4" fontWeight="500" color="$color">
              Average Transaction
            </Text>
            <Text fontSize="$2" color="$color11">
              Based on {insights.transactionCount} transactions
            </Text>
          </YStack>

          <Text fontSize="$4" fontWeight="600" color="$color">
            {formatCurrency(insights.averageTransaction, currency)}
          </Text>
        </XStack>
      </Card>
    </YStack>
  );
}
