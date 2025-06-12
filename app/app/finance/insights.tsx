import React from "react";
import { YStack, XStack, Button, Text, ScrollView } from "tamagui";
import { ArrowLeft, TrendingUp } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GenericId as Id } from "convex/values";

// Import our custom components and hooks
import { TransactionInsights } from "../../services/finance/components/TransactionInsights";
import { useGetTransactions } from "../../services/finance/hooks/useTransactions";
import { useGetCategories } from "../../services/finance/hooks/useCategories";
import { useGetAccounts } from "../../services/finance/hooks/useAccounts";

export default function FinancialInsightsScreen() {
  const insets = useSafeAreaInsets();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  // Convert accountId to proper type
  const accountIdTyped = accountId
    ? (accountId as Id<"bankAccounts">)
    : undefined;

  // Data hooks
  const { categories } = useGetCategories();
  const { accounts } = useGetAccounts();
  const { transactions, isLoading } = useGetTransactions({
    accountId: accountIdTyped,
    limit: 200, // Get more transactions for better analytics
  });

  // Get the current account to determine currency
  const currentAccount = accounts.find((acc) => acc._id === accountIdTyped);
  const currency = currentAccount?.currency || "USD";

  return (
    <YStack
      flex={1}
      bg="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4">
        <Button
          size="$3"
          chromeless
          icon={ArrowLeft}
          onPress={() => router.back()}
        />
        <Text fontSize="$6" fontWeight="600" color="$color">
          Financial Insights
        </Text>
        <YStack width="$5" />
      </XStack>

      {/* Content */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <TrendingUp size="$1" color="$blue10" />
              <Text fontSize="$5" fontWeight="600" color="$color">
                Spending Analysis
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              Understanding your financial patterns and trends
            </Text>
          </YStack>

          {isLoading ? (
            <YStack padding="$8" alignItems="center" gap="$4">
              <Text fontSize="$4" color="$color11">
                Loading insights...
              </Text>
            </YStack>
          ) : (
            <TransactionInsights
              transactions={transactions}
              categories={categories || []}
              accountId={accountId}
              currency={currency}
            />
          )}

          {/* Tips Section */}
          <YStack gap="$3" marginTop="$4">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Financial Tips
            </Text>

            <YStack gap="$3">
              <YStack
                padding="$4"
                backgroundColor="$blue2"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$blue9"
              >
                <Text fontSize="$4" fontWeight="500" color="$blue11">
                  Track Your Categories
                </Text>
                <Text fontSize="$3" color="$blue10" marginTop="$1">
                  Categorizing your transactions helps identify spending
                  patterns and areas where you can save money.
                </Text>
              </YStack>

              <YStack
                padding="$4"
                backgroundColor="$green2"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$green9"
              >
                <Text fontSize="$4" fontWeight="500" color="$green11">
                  Set Monthly Budgets
                </Text>
                <Text fontSize="$3" color="$green10" marginTop="$1">
                  Use your spending insights to set realistic budgets for
                  different categories and stick to them.
                </Text>
              </YStack>

              <YStack
                padding="$4"
                backgroundColor="$color3"
                borderRadius="$4"
                borderLeftWidth={4}
                borderLeftColor="$color9"
              >
                <Text fontSize="$4" fontWeight="500" color="$color">
                  Review Regularly
                </Text>
                <Text fontSize="$3" color="$color11" marginTop="$1">
                  Check your insights monthly to understand your spending habits
                  and make informed financial decisions.
                </Text>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
