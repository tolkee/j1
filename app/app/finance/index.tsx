import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { FlatList, Dimensions, StatusBar } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Spinner,
} from "tamagui";
import {
  ArrowLeft,
  Plus,
  Minus,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Users,
  Settings,
  CreditCard,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetAccounts } from "../../services/finance/hooks/useAccounts";
import { useDefaultAccount } from "../../services/finance/hooks/useDefaultAccount";
import { useGetCategories } from "../../services/finance/hooks/useCategories";
import { ACCOUNT_ICONS } from "../../services/finance/components/AccountForm";
import { DEFAULT_CATEGORY_COLORS } from "../../services/finance/constants";
import { AccountOnboarding } from "../../services/finance/components/AccountOnboarding";
import { TransactionList } from "../../services/finance/components/TransactionList";
import { GenericId as Id } from "convex/values";
import { useQuery } from "convex/react";
import { api } from "../../common/lib/api";
import { useAuth } from "../../services/auth/contexts/AuthContext";
import { formatCurrency } from "../../services/finance/lib/formatCurrency";

const { width: screenWidth } = Dimensions.get("window");

interface Account {
  _id: Id<"bankAccounts">;
  name: string;
  description?: string;
  icon: string;
  currentAmount: number;
  isDefault: boolean;
  displayOrder: number;
  _creationTime: number;
  transactionCount?: number;
  currency?: "USD" | "EUR";
}

export default function FinanceScreen() {
  const { accounts: rawAccounts, isLoading } = useGetAccounts();
  const { ensureDefaultAccount } = useDefaultAccount();
  const { categories } = useGetCategories();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sort accounts to ensure default account comes first in carousel
  const accounts = rawAccounts
    ? [...rawAccounts].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a._creationTime - b._creationTime;
      })
    : null;

  // Get recent transactions for the selected account
  const transactions = useQuery(
    api.finance.transactions.getAccountTransactions,
    user &&
      selectedAccount &&
      accounts &&
      accounts.some((acc) => acc._id === selectedAccount._id)
      ? {
          accountId: selectedAccount._id,
          userId: user._id,
          paginationOpts: {
            numItems: 5,
            cursor: null,
          },
        }
      : "skip"
  );

  // Keep previous transactions data to prevent flashing during account transitions
  const [displayTransactions, setDisplayTransactions] = useState(transactions);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);

  useEffect(() => {
    if (transactions !== undefined) {
      setDisplayTransactions(transactions);
      setIsTransactionLoading(false);
    } else if (selectedAccount) {
      // Only show loading if we have a selected account but no transactions yet
      setIsTransactionLoading(true);
    }
  }, [transactions, selectedAccount]);

  // Update selected account when accounts load or index changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      // Ensure there's always a default account
      ensureDefaultAccount(accounts);

      // Check if the current selected account still exists in the accounts list
      const currentSelectedAccountExists =
        selectedAccount &&
        accounts.some((acc) => acc._id === selectedAccount._id);

      // Find default account or use first account
      const defaultAccountIndex = accounts.findIndex((acc) => acc.isDefault);
      const initialIndex = defaultAccountIndex >= 0 ? defaultAccountIndex : 0;

      if (
        !currentSelectedAccountExists ||
        selectedAccountIndex >= accounts.length
      ) {
        // Reset to default account if current selection is invalid or deleted
        setSelectedAccountIndex(initialIndex);
        setSelectedAccount(accounts[initialIndex]);
      } else {
        // Update the selected account data (in case it was modified)
        setSelectedAccount(accounts[selectedAccountIndex]);
      }
    } else if (!isLoading && accounts && accounts.length === 0) {
      // Show onboarding for users with no accounts
      setShowOnboarding(true);
      setSelectedAccount(null);
    } else {
      setSelectedAccount(null);
    }
  }, [
    accounts,
    selectedAccountIndex,
    selectedAccount,
    isLoading,
    ensureDefaultAccount,
  ]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Accounts will be refetched automatically due to Convex reactivity
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleAccountScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (
      accounts &&
      index !== selectedAccountIndex &&
      index >= 0 &&
      index < accounts.length
    ) {
      setSelectedAccountIndex(index);
    }
  };

  const handleAddExpense = () => {
    router.push({
      pathname: "/finance/add-expense",
      params: { accountId: selectedAccount?._id },
    });
  };

  const handleAddIncome = () => {
    router.push({
      pathname: "/finance/add-income",
      params: { accountId: selectedAccount?._id },
    });
  };

  const handleViewAccount = () => {
    if (selectedAccount) {
      router.push(`/finance/account/${selectedAccount._id}`);
    }
  };

  const handleAccountOverview = () => {
    router.push("/finance/accounts");
  };

  const handleViewAllTransactions = () => {
    if (selectedAccount) {
      router.push(`/finance/transactions?accountId=${selectedAccount._id}`);
    } else {
      router.push("/finance/transactions");
    }
  };

  const renderAccountInfo = ({
    item: account,
    index,
  }: {
    item: Account;
    index: number;
  }) => {
    const iconData = ACCOUNT_ICONS.find((icon) => icon.id === account.icon);
    const IconComponent = iconData?.icon || ACCOUNT_ICONS[0].icon;
    const isPositive = account.currentAmount >= 0;

    return (
      <YStack
        width={screenWidth}
        alignItems="center"
        justifyContent="center"
        paddingVertical="$8"
        gap="$4"
      >
        {/* Account Icon */}
        <YStack alignItems="center" gap="$3">
          <YStack
            padding="$4"
            backgroundColor="$blue3"
            borderRadius="$10"
            alignItems="center"
            justifyContent="center"
          >
            <IconComponent size="$3" color="$blue10" />
          </YStack>

          {/* Account Name */}
          <XStack alignItems="center" gap="$2">
            <Text
              fontSize="$8"
              fontWeight="bold"
              color="$color"
              textAlign="center"
            >
              {account.name}
            </Text>
            {account.isDefault && <Star size="$1" color="$yellow9" />}
          </XStack>

          {/* Account Balance */}
          <XStack alignItems="center" gap="$2">
            <Text
              fontSize="$10"
              fontWeight="bold"
              color={isPositive ? "$green10" : "$red10"}
              textAlign="center"
            >
              {formatCurrency(account.currentAmount, account.currency)}
            </Text>
            <TrendingUp
              size="$1.5"
              color={isPositive ? "$green10" : "$red10"}
            />
          </XStack>
        </YStack>
      </YStack>
    );
  };

  const renderAccountDots = () => {
    if (!accounts || accounts.length <= 1) return null;

    return (
      <XStack
        justifyContent="center"
        alignItems="center"
        gap="$2"
        paddingVertical="$3"
      >
        {accounts.map((_, index) => (
          <YStack
            key={index}
            width={index === selectedAccountIndex ? 8 : 6}
            height={index === selectedAccountIndex ? 8 : 6}
            borderRadius="$12"
            backgroundColor={
              index === selectedAccountIndex ? "$blue9" : "$color9"
            }
          />
        ))}
      </XStack>
    );
  };

  if (isLoading) {
    return (
      <YStack
        flex={1}
        bg="$background"
        paddingTop={insets.top}
        paddingBottom={insets.bottom}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <YStack alignItems="center" justifyContent="center" flex={1} gap="$4">
          <Spinner size="large" color="$blue10" />
          <Text color="$color11">Loading your accounts...</Text>
        </YStack>
      </YStack>
    );
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <YStack
        flex={1}
        bg="$background"
        paddingTop={insets.top}
        paddingBottom={insets.bottom}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <AccountOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      bg="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView flex={1}>
        <YStack gap="$4">
          {/* Current Account Display - Slidable */}
          {accounts && accounts.length > 0 ? (
            <YStack>
              <FlatList
                data={accounts}
                renderItem={renderAccountInfo}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth}
                decelerationRate="fast"
                onScroll={handleAccountScroll}
                scrollEventThrottle={16}
                getItemLayout={(data, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                pagingEnabled
              />

              {/* Account Dots */}
              {renderAccountDots()}
            </YStack>
          ) : (
            /* No Accounts State */
            <YStack gap="$6" padding="$6" alignItems="center" paddingTop="$12">
              <YStack
                padding="$6"
                backgroundColor="$blue3"
                borderRadius="$10"
                alignItems="center"
                justifyContent="center"
              >
                <PieChart size="$4" color="$blue10" />
              </YStack>

              <YStack alignItems="center" gap="$3">
                <Text fontSize="$8" fontWeight="bold" textAlign="center">
                  No Accounts Yet
                </Text>
                <Text
                  fontSize="$5"
                  color="$color11"
                  textAlign="center"
                  maxWidth={280}
                  lineHeight="$2"
                >
                  Create your first account to start tracking your finances
                </Text>
              </YStack>

              <Button
                size="$5"
                backgroundColor="$blue9"
                color="white"
                icon={Plus}
                borderRadius="$10"
                onPress={handleAccountOverview}
              >
                Create First Account
              </Button>
            </YStack>
          )}

          {/* Quick Actions - Fixed Position */}
          {selectedAccount && (
            <XStack justifyContent="center" alignItems="center" gap="$4">
              <Button
                size="$5"
                circular
                backgroundColor="$color8"
                onPress={handleAddIncome}
              >
                <Plus size="$2" color="white" />
              </Button>

              <Button
                size="$5"
                circular
                backgroundColor="$color8"
                onPress={handleAddExpense}
              >
                <Minus size="$2" color="white" />
              </Button>

              <Button
                size="$5"
                circular
                backgroundColor="$color8"
                onPress={() =>
                  router.push({
                    pathname: "/finance/insights",
                    params: { accountId: selectedAccount._id },
                  })
                }
              >
                <PieChart size="$2" color="white" />
              </Button>

              <Button
                size="$5"
                circular
                backgroundColor="$color8"
                onPress={handleViewAccount}
              >
                <Settings size="$2" color="white" />
              </Button>

              <Button
                size="$5"
                circular
                backgroundColor="$color8"
                onPress={handleAccountOverview}
              >
                <CreditCard size="$2" color="white" />
              </Button>
            </XStack>
          )}

          {/* Recent Transactions - Fixed Position */}
          {selectedAccount && (
            <YStack gap="$3" paddingHorizontal="$4" paddingBottom="$6">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$6" fontWeight="bold">
                  Recent Transactions
                </Text>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={handleViewAllTransactions}
                >
                  View All
                </Button>
              </XStack>

              <TransactionList
                transactions={displayTransactions?.page}
                categories={categories || []}
                isLoading={isTransactionLoading}
                emptyMessage="No transactions yet for this account"
                showDateDetails={false}
                limit={5}
                currency={selectedAccount.currency}
              />
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
