import React, { useState, useCallback, useMemo } from "react";
import {
  YStack,
  XStack,
  Button,
  Text,
  ScrollView,
  Input,
  Sheet,
  Card,
} from "tamagui";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  Repeat,
  Calendar,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RefreshControl, FlatList } from "react-native";

// Import our custom components and hooks
import { useRecurringTransactions, recurringTransactionUtils } from "../../services/finance/hooks/useRecurringTransactions";
import { useGetCategories } from "../../services/finance/hooks/useCategories";
import { useGetAccounts } from "../../services/finance/hooks/useAccounts";
import { useAuth } from "../../services/auth/contexts/AuthContext";
import { formatCurrency } from "../../services/finance/lib/formatCurrency";
import { RecurringTransactionItem } from "../../services/finance/components/RecurringTransactionItem";
import { GenericId as Id } from "convex/values";

type FrequencyFilter = "all" | "daily" | "weekly" | "monthly";
type StatusFilter = "all" | "active" | "paused";

interface FilterOptions {
  accountId?: Id<"bankAccounts">;
  categoryId?: Id<"categories">;
  type: "all" | "income" | "expense";
  frequency: FrequencyFilter;
  status: StatusFilter;
  searchQuery: string;
}

export default function RecurringTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    frequency: "all",
    status: "all",
    searchQuery: "",
    accountId: accountId as Id<"bankAccounts"> | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  // Data hooks
  const { categories } = useGetCategories();
  const { accounts } = useGetAccounts();
  const { recurringTransactions, isLoading, refresh } = useRecurringTransactions({
    accountId: filters.accountId,
  });

  // Filter recurring transactions
  const filteredTransactions = useMemo(() => {
    let filtered = recurringTransactions;

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((tx) => 
        filters.type === "income" ? tx.amount > 0 : tx.amount < 0
      );
    }

    // Filter by frequency
    if (filters.frequency !== "all") {
      filtered = filtered.filter((tx) => tx.frequency === filters.frequency);
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((tx) => 
        filters.status === "active" ? tx.isActive : !tx.isActive
      );
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((tx) => {
        const description = tx.description?.toLowerCase() || "";
        const amount = Math.abs(tx.amount).toString();
        const categoryName = tx.categoryName?.toLowerCase() || "";
        
        return (
          description.includes(query) ||
          amount.includes(query) ||
          categoryName.includes(query)
        );
      });
    }

    // Filter by category
    if (filters.categoryId) {
      filtered = filtered.filter((tx) => tx.categoryId === filters.categoryId);
    }

    return filtered;
  }, [recurringTransactions, filters]);

  // Group transactions by status and due date
  const groupedTransactions = useMemo(() => {
    const active = filteredTransactions.filter((tx) => tx.isActive);
    const paused = filteredTransactions.filter((tx) => !tx.isActive);
    
    // Sort active by due date
    const sortedActive = active.sort((a, b) => a.daysUntilNext - b.daysUntilNext);
    
    const groups = [];
    
    if (sortedActive.length > 0) {
      groups.push({
        title: "Active",
        transactions: sortedActive,
      });
    }
    
    if (paused.length > 0) {
      groups.push({
        title: "Paused",
        transactions: paused,
      });
    }

    return groups;
  }, [filteredTransactions]);

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setShowFilters(false);
  }, [tempFilters]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: FilterOptions = {
      type: "all",
      frequency: "all",
      status: "all",
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
    if (filters.type !== "all") count++;
    if (filters.frequency !== "all") count++;
    if (filters.status !== "all") count++;
    return count;
  }, [filters]);

  // Get the current account for currency
  const currentAccount = accounts?.find((acc) => acc._id === filters.accountId);
  const currency = currentAccount?.currency || "USD";

  const renderTransactionGroup = ({
    item,
  }: {
    item: { title: string; transactions: any[] };
  }) => (
    <YStack key={item.title} gap="$2" marginBottom="$4">
      <Text
        fontSize="$4"
        fontWeight="600"
        color="$color11"
        paddingHorizontal="$4"
      >
        {item.title} ({item.transactions.length})
      </Text>
      <YStack gap="$2" paddingHorizontal="$4">
        {item.transactions.map((recurringTx) => (
          <RecurringTransactionItem
            key={recurringTx._id}
            transaction={recurringTx}
            currency={currency}
            onPress={() => {
              // Navigate to recurring transaction details
              // router.push(`/finance/recurring-transaction/${recurringTx._id}`);
            }}
          />
        ))}
      </YStack>
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
          Recurring Transactions
        </Text>
        <Button
          size="$3"
          chromeless
          icon={Plus}
          onPress={() => {
            // Navigate to add recurring transaction
            // router.push("/finance/add-recurring");
          }}
        />
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
            placeholder="Search recurring transactions..."
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
        keyExtractor={(item) => item.title}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <YStack padding="$8" alignItems="center" gap="$4">
            <Repeat size="$4" color="$color9" />
            <Text fontSize="$5" fontWeight="600" color="$color">
              No recurring transactions found
            </Text>
            <Text fontSize="$3" color="$color11" textAlign="center">
              {filters.searchQuery || getActiveFilterCount() > 0
                ? "Try adjusting your search or filters"
                : "Set up your first recurring transaction"}
            </Text>
            <Button
              backgroundColor="$blue9"
              color="white"
              onPress={() => {
                // Navigate to add recurring transaction
                // router.push("/finance/add-recurring");
              }}
            >
              Add Recurring Transaction
            </Button>
          </YStack>
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
              Filter Recurring Transactions
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

            {/* Frequency Filter */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Frequency
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {(["all", "daily", "weekly", "monthly"] as const).map((freq) => (
                  <Button
                    key={freq}
                    size="$3"
                    variant={tempFilters.frequency === freq ? undefined : "outlined"}
                    backgroundColor={
                      tempFilters.frequency === freq ? "$blue9" : "transparent"
                    }
                    color={tempFilters.frequency === freq ? "white" : "$color"}
                    onPress={() =>
                      setTempFilters((prev) => ({ ...prev, frequency: freq }))
                    }
                    flex={freq === "all" ? 1 : 0}
                    minWidth={freq !== "all" ? "$8" : undefined}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Status Filter */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Status
              </Text>
              <XStack gap="$2">
                {(["all", "active", "paused"] as const).map((status) => (
                  <Button
                    key={status}
                    size="$3"
                    variant={tempFilters.status === status ? undefined : "outlined"}
                    backgroundColor={
                      tempFilters.status === status ? "$blue9" : "transparent"
                    }
                    color={tempFilters.status === status ? "white" : "$color"}
                    onPress={() =>
                      setTempFilters((prev) => ({ ...prev, status }))
                    }
                    flex={1}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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