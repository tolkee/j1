import React, { useMemo } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { formatCurrency } from "../lib/formatCurrency";

const screenWidth = Dimensions.get("window").width;

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
  color?: string;
}

interface CategoryDonutChartProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth?: Date;
  accountId?: string; // Filter by specific account
  currency?: "USD" | "EUR"; // Currency for formatting
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export function CategoryDonutChart({
  transactions,
  categories,
  currentMonth = new Date(),
  accountId,
  currency = "USD",
}: CategoryDonutChartProps) {
  const { chartData, totalSpending } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], totalSpending: 0 };
    }

    // Filter transactions for current month and expenses only
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

    const currentMonthExpenses = transactions.filter((t) => {
      const date = new Date(t.date || t._creationTime);
      const isExpense = t.amount < 0;
      const isInCurrentMonth =
        date >= currentMonthStart && date <= currentMonthEnd;
      const isFromAccount = !accountId || t.accountId === accountId;

      return isExpense && isInCurrentMonth && isFromAccount;
    });

    if (currentMonthExpenses.length === 0) {
      return { chartData: [], totalSpending: 0 };
    }

    // Group by category
    const categorySpending = currentMonthExpenses.reduce(
      (acc, t) => {
        const categoryId = t.categoryId || "uncategorized";
        acc[categoryId] = (acc[categoryId] || 0) + Math.abs(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate total spending
    const totalSpending = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Convert to chart data with colors
    const colors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#F59E0B", // yellow
      "#EF4444", // red
      "#8B5CF6", // purple
      "#F97316", // orange
      "#06B6D4", // cyan
      "#84CC16", // lime
      "#EC4899", // pink
      "#6B7280", // gray
    ];

    const sortedEntries = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8); // Limit to top 8 categories for readability

    const chartData: PieChartData[] = sortedEntries.map(
      ([categoryId, amount], index) => {
        const category = categories.find((c) => c._id === categoryId);
        const categoryName = category?.name || "Other";
        const categoryIcon = category?.icon || "📊";

        return {
          name: `${categoryIcon} ${categoryName}`,
          population: amount,
          color: colors[index % colors.length],
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        };
      }
    );

    return { chartData, totalSpending };
  }, [transactions, categories, currentMonth, accountId]);

  const chartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: "transparent",
    backgroundGradientTo: "transparent",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (chartData.length === 0) {
    return (
      <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
        <YStack alignItems="center" gap="$3">
          <Text fontSize="$5" fontWeight="600" color="$color">
            Category Breakdown
          </Text>
          <Text fontSize="$3" color="$color11" textAlign="center">
            No spending data available for this month
          </Text>
        </YStack>
      </Card>
    );
  }

  return (
    <Card padding="$4" borderRadius="$4" backgroundColor="$color2">
      <YStack gap="$4">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$5" fontWeight="600" color="$color">
            Category Breakdown
          </Text>
          <Text fontSize="$4" fontWeight="600" color="$color">
            {formatCurrency(totalSpending, currency)}
          </Text>
        </XStack>

        <YStack alignItems="center">
          <PieChart
            data={chartData}
            width={screenWidth - 80} // Account for card padding
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </YStack>

        {/* Summary Statistics */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500" color="$color">
            Top Categories
          </Text>
          {chartData.slice(0, 3).map((item, index) => {
            const percentage = (
              (item.population / totalSpending) *
              100
            ).toFixed(1);
            return (
              <XStack
                key={item.name}
                alignItems="center"
                justifyContent="space-between"
                paddingVertical="$1"
              >
                <XStack alignItems="center" gap="$3" flex={1}>
                  <YStack
                    width="$1"
                    height="$1"
                    borderRadius="$2"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text fontSize="$3" color="$color" numberOfLines={1} flex={1}>
                    {item.name}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$2" color="$color11">
                    {percentage}%
                  </Text>
                  <Text
                    fontSize="$3"
                    fontWeight="500"
                    color="$color"
                    minWidth={60}
                    textAlign="right"
                  >
                    {formatCurrency(item.population, currency)}
                  </Text>
                </XStack>
              </XStack>
            );
          })}
        </YStack>
      </YStack>
    </Card>
  );
}
