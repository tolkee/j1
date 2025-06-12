import React, { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Input,
  Sheet,
} from "tamagui";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
} from "@tamagui/lucide-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountsList } from "../../../services/finance/components/AccountsList";
import { AccountForm } from "../../../services/finance/components/AccountForm";
import {
  useGetAccounts,
  useCreateAccount,
} from "../../../services/finance/hooks/useAccounts";
import { GenericId as Id } from "convex/values";
import { formatCurrency } from "../../../services/finance/lib/formatCurrency";

interface Account {
  _id: Id<"bankAccounts">;
  name: string;
  description?: string;
  icon: string;
  currentAmount: number;
  currency?: "USD" | "EUR";
  isDefault: boolean;
  displayOrder: number;
  _creationTime: number;
}

export default function AccountsManagementScreen() {
  const { accounts, isLoading } = useGetAccounts();
  const { createAccount } = useCreateAccount();
  const insets = useSafeAreaInsets();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleAccountPress = (account: Account) => {
    router.push(`/finance/account/${account._id}`);
  };

  const handleCreateAccount = async (data: {
    name: string;
    description?: string;
    icon: string;
    defaultValue: number;
    currency: "USD" | "EUR";
  }) => {
    const result = await createAccount(data);
    if (result.success) {
      setShowCreateForm(false);
    }
    return result;
  };

  // Calculate summary statistics
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.currentAmount,
    0
  );
  const positiveAccounts = accounts.filter(
    (account) => account.currentAmount >= 0
  );
  const negativeAccounts = accounts.filter(
    (account) => account.currentAmount < 0
  );

  // TODO: Handle mixed currencies in total balance display
  // For now, showing in USD but should be enhanced for multi-currency support
  const formatTotalCurrency = (amount: number) => {
    return formatCurrency(amount, "USD");
  };

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
        <Button size="$3" chromeless icon={ArrowLeft} onPress={handleGoBack} />
        <Text fontSize="$6" fontWeight="600" color="$color">
          Accounts Overview
        </Text>
        <YStack width="$5" />
      </XStack>

      <ScrollView flex={1}>
        <YStack gap="$4" padding="$4">
          {/* Account Overview Cards */}
          <YStack gap="$3">
            <XStack gap="$3">
              <Card flex={1} padding="$3" backgroundColor="$blue2">
                <YStack alignItems="center" gap="$2">
                  <Text fontSize="$8" fontWeight="bold" color="$blue11">
                    {formatTotalCurrency(totalBalance)}
                  </Text>
                  <Text fontSize="$3" color="$color11" textAlign="center">
                    Total Balance
                  </Text>
                </YStack>
              </Card>

              <Card flex={1} padding="$3" backgroundColor="$background">
                <YStack alignItems="center" gap="$2">
                  <Text fontSize="$6" fontWeight="bold" color="$color">
                    {accounts.length}
                  </Text>
                  <Text fontSize="$3" color="$color11" textAlign="center">
                    Total Accounts
                  </Text>
                </YStack>
              </Card>
            </XStack>

            <XStack gap="$3">
              <Card flex={1} padding="$3" backgroundColor="$green2">
                <YStack alignItems="center" gap="$2">
                  <XStack alignItems="center" gap="$1">
                    <TrendingUp size="$1" color="$green10" />
                    <Text fontSize="$5" fontWeight="bold" color="$green10">
                      {positiveAccounts.length}
                    </Text>
                  </XStack>
                  <Text fontSize="$3" color="$color11" textAlign="center">
                    Positive Balance
                  </Text>
                </YStack>
              </Card>

              <Card flex={1} padding="$3" backgroundColor="$red2">
                <YStack alignItems="center" gap="$2">
                  <XStack alignItems="center" gap="$1">
                    <TrendingDown size="$1" color="$red10" />
                    <Text fontSize="$5" fontWeight="bold" color="$red10">
                      {negativeAccounts.length}
                    </Text>
                  </XStack>
                  <Text fontSize="$3" color="$color11" textAlign="center">
                    Negative Balance
                  </Text>
                </YStack>
              </Card>
            </XStack>
          </YStack>

          {/* Your Accounts Section */}
          <AccountsList
            accounts={accounts}
            isLoading={isLoading}
            onAccountPress={handleAccountPress}
            onCreateAccount={() => setShowCreateForm(true)}
          />
        </YStack>
      </ScrollView>

      {/* Create Account Form Sheet */}
      <Sheet
        modal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        snapPoints={[90]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay
          backgroundColor="rgba(0,0,0,0.5)"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Handle />
        <Sheet.Frame
          backgroundColor="$background"
          flex={1}
          paddingBottom={insets.bottom}
        >
          <AccountForm
            mode="create"
            onSubmit={handleCreateAccount}
            onCancel={() => setShowCreateForm(false)}
          />
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
