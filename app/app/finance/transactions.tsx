import React, { useState, useCallback, useMemo } from "react";
import {
  YStack,
  XStack,
  Button,
  Text,
  ScrollView,
  Input,
  Sheet,
  Switch,
} from "tamagui";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Calendar,
  DollarSign,
  Tag,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RefreshControl, FlatList } from "react-native";

// Import our custom components and hooks
import { TransactionList } from "../../services/finance/components/TransactionList";
import { useGetTransactions } from "../../services/finance/hooks/useTransactions";
import { useGetCategories } from "../../services/finance/hooks/useCategories";
import { useGetAccounts } from "../../services/finance/hooks/useAccounts";
import { useAuth } from "../../services/auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";

interface FilterOptions {
  accountId?: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
  dateStart?: number;
  dateEnd?: number;
  minAmount?: number;
  maxAmount?: number;
  type: "all" | "income" | "expense";
  searchQuery: string;
}

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    searchQuery: "",
    accountId: accountId as Id<"bankAccounts"> | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  // Data hooks
  const { categories } = useGetCategories();
  const { accounts } = useGetAccounts();

  // Get transactions with current filters
  const { transactions, isLoading, hasMore, loadMore, refresh, isLoadingMore } =
    useGetTransactions({
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      type: filters.type,
      limit: 50,
    });

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!filters.searchQuery.trim()) {
      return transactions;
    }

    const query = filters.searchQuery.toLowerCase();
    return transactions.filter((transaction) => {
      const description = transaction.description?.toLowerCase() || "";
      const amount = Math.abs(transaction.amount).toString();

      // Find category name
      const category = categories?.find(
        (c) => c._id === transaction.categoryId
      );
      const categoryName = category?.name?.toLowerCase() || "";

      return (
        description.includes(query) ||
        amount.includes(query) ||
        categoryName.includes(query)
      );
    });
  }, [transactions, filters.searchQuery, categories]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: typeof filteredTransactions } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date || transaction._creationTime);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return Object.entries(groups).map(([date, transactions]) => ({
      date,
      transactions,
    }));
  }, [filteredTransactions]);

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setShowFilters(false);
  }, [tempFilters]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: FilterOptions = {
      type: "all",
      searchQuery: filters.searchQuery, // Keep search query
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
  }, [filters.searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.accountId) count++;
    if (filters.categoryId) count++;
    if (filters.dateStart) count++;
    if (filters.minAmount) count++;
    if (filters.type !== "all") count++;
    return count;
  }, [filters]);

  // Get the current account for currency
  const currentAccount = accounts?.find((acc) => acc._id === filters.accountId);
  const currency = currentAccount?.currency || "USD"; // Default to USD if no account or currency

  const renderTransactionGroup = ({
    item,
  }: {
    item: { date: string; transactions: any[] };
  }) => (
    <YStack key={item.date} gap="$2" marginBottom="$4">
      <Text
        fontSize="$4"
        fontWeight="600"
        color="$color11"
        paddingHorizontal="$4"
      >
        {item.date}
      </Text>
      <TransactionList
        transactions={item.transactions}
        categories={categories}
        showDateDetails={false}
        currency={currency}
      />
    </YStack>
  );

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
          Transaction History
        </Text>
        <YStack width="$5" />
      </XStack>

      {/* Search Bar */}
      <XStack padding="$4" gap="$2">
        <XStack
          flex={1}
          alignItems="center"
          gap="$2"
          paddingHorizontal="$3"
          backgroundColor="$color2"
          borderRadius="$4"
        >
          <Search size="$1" color="$color11" />
          <Input
            flex={1}
            placeholder="Search transactions..."
            value={filters.searchQuery}
            onChangeText={handleSearchChange}
            backgroundColor="transparent"
            borderWidth={0}
            fontSize="$3"
          />
        </XStack>
        <Button
          height="$4"
          paddingHorizontal="$3"
          variant="outlined"
          icon={Filter}
          onPress={() => setShowFilters(true)}
          backgroundColor={
            getActiveFilterCount() > 0 ? "$blue2" : "transparent"
          }
        >
          {getActiveFilterCount() > 0 && (
            <Text fontSize="$1" color="$blue10">
              {getActiveFilterCount()}
            </Text>
          )}
        </Button>
      </XStack>

      {/* Transaction List */}
      <FlatList
        data={groupedTransactions}
        renderItem={renderTransactionGroup}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <YStack padding="$8" alignItems="center" gap="$4">
            <DollarSign size="$4" color="$color9" />
            <Text fontSize="$5" fontWeight="600" color="$color">
              No transactions found
            </Text>
            <Text fontSize="$3" color="$color11" textAlign="center">
              {filters.searchQuery || getActiveFilterCount() > 0
                ? "Try adjusting your search or filters"
                : "Start by adding your first transaction"}
            </Text>
            <Button
              backgroundColor="$blue9"
              color="white"
              onPress={() => router.push("/finance/add-expense")}
            >
              Add Transaction
            </Button>
          </YStack>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <YStack padding="$4" alignItems="center">
              <Text fontSize="$3" color="$color11">
                Loading more...
              </Text>
            </YStack>
          ) : null
        }
      />

      {/* Filter Sheet */}
      <Sheet
        modal
        open={showFilters}
        onOpenChange={setShowFilters}
        snapPoints={[85]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.3)" />
        <Sheet.Handle />
        <Sheet.Frame padding="$4" gap="$4">
          <YStack gap="$4">
            <Text fontSize="$6" fontWeight="600">
              Filter Transactions
            </Text>

            {/* Transaction Type */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Transaction Type
              </Text>
              <XStack gap="$2">
                {(["all", "income", "expense"] as const).map((type) => (
                  <Button
                    key={type}
                    size="$3"
                    variant={tempFilters.type === type ? undefined : "outlined"}
                    backgroundColor={
                      tempFilters.type === type ? "$blue9" : "transparent"
                    }
                    color={tempFilters.type === type ? "white" : "$color"}
                    onPress={() =>
                      setTempFilters((prev) => ({ ...prev, type }))
                    }
                    flex={1}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Account Filter */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Account
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$2" paddingHorizontal="$1">
                  <Button
                    size="$3"
                    variant="outlined"
                    backgroundColor={
                      !tempFilters.accountId ? "$blue9" : "transparent"
                    }
                    color={!tempFilters.accountId ? "white" : "$color"}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        accountId: undefined,
                      }))
                    }
                  >
                    All Accounts
                  </Button>
                  {accounts?.map((account) => (
                    <Button
                      key={account._id}
                      size="$3"
                      variant="outlined"
                      backgroundColor={
                        tempFilters.accountId === account._id
                          ? "$blue9"
                          : "transparent"
                      }
                      color={
                        tempFilters.accountId === account._id
                          ? "white"
                          : "$color"
                      }
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          accountId:
                            account._id === prev.accountId
                              ? undefined
                              : account._id,
                        }))
                      }
                    >
                      {account.name}
                    </Button>
                  ))}
                </XStack>
              </ScrollView>
            </YStack>

            {/* Category Filter */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$2" paddingHorizontal="$1">
                  <Button
                    size="$3"
                    variant="outlined"
                    backgroundColor={
                      !tempFilters.categoryId ? "$blue9" : "transparent"
                    }
                    color={!tempFilters.categoryId ? "white" : "$color"}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        categoryId: undefined,
                      }))
                    }
                  >
                    All Categories
                  </Button>
                  {categories?.map((category) => (
                    <Button
                      key={category._id}
                      size="$3"
                      variant="outlined"
                      backgroundColor={
                        tempFilters.categoryId === category._id
                          ? "$blue9"
                          : "transparent"
                      }
                      color={
                        tempFilters.categoryId === category._id
                          ? "white"
                          : "$color"
                      }
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          categoryId:
                            category._id === prev.categoryId
                              ? undefined
                              : category._id,
                        }))
                      }
                    >
                      <XStack alignItems="center" gap="$1">
                        <Text>{category.icon}</Text>
                        <Text>{category.name}</Text>
                      </XStack>
                    </Button>
                  ))}
                </XStack>
              </ScrollView>
            </YStack>

            {/* Action Buttons */}
            <XStack gap="$2" marginTop="$4">
              <Button flex={1} variant="outlined" onPress={handleClearFilters}>
                Clear All
              </Button>
              <Button
                flex={1}
                backgroundColor="$blue9"
                color="white"
                onPress={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
