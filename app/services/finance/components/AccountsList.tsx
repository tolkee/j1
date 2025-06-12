import React, { useState, useRef, useEffect } from "react";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  ScrollView,
  Spinner,
} from "tamagui";
import { Plus, Star, TrendingUp, TrendingDown } from "@tamagui/lucide-icons";
import { GenericId as Id } from "convex/values";
import { ACCOUNT_ICONS } from "./AccountForm";
import { formatCurrency } from "../lib/formatCurrency";

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

interface AccountsListProps {
  accounts: Account[];
  isLoading: boolean;
  onAccountPress: (account: Account) => void;
  onCreateAccount: () => void;
}

function AccountCard({
  account,
  onPress,
}: {
  account: Account;
  onPress: () => void;
}) {
  const iconData = ACCOUNT_ICONS.find((icon) => icon.id === account.icon);
  const IconComponent = iconData?.icon || ACCOUNT_ICONS[0].icon;

  const isPositive = account.currentAmount >= 0;

  return (
    <Card
      padding="$4"
      marginBottom="$2"
      backgroundColor="$background"
      borderWidth={1}
      borderColor={account.isDefault ? "$green8" : "$borderColor"}
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
    >
      <XStack alignItems="center" gap="$4">
        {/* Left section - Icon */}
        <Card
          padding="$3"
          backgroundColor={account.isDefault ? "$green3" : "$blue3"}
          borderRadius="$4"
          alignItems="center"
          justifyContent="center"
        >
          <IconComponent
            size="$1.5"
            color={account.isDefault ? "$green10" : "$blue10"}
          />
        </Card>

        {/* Center section - Account info */}
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$5" fontWeight="600" color="$color">
              {account.name}
            </Text>
            {account.isDefault && (
              <Star size="$0.75" color="$yellow9" fill="$yellow9" />
            )}
          </XStack>

          {account.description && (
            <Text fontSize="$3" color="$color11" numberOfLines={1}>
              {account.description}
            </Text>
          )}

          <XStack alignItems="center" gap="$2">
            <Text
              fontSize="$4"
              fontWeight="600"
              color={isPositive ? "$green10" : "$red10"}
            >
              {formatCurrency(account.currentAmount, account.currency)}
            </Text>
            {isPositive ? (
              <TrendingUp size="$0.75" color="$green10" />
            ) : (
              <TrendingDown size="$0.75" color="$red10" />
            )}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}

function EmptyState({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      gap="$4"
      padding="$6"
      marginTop="$8"
    >
      <Card
        padding="$4"
        backgroundColor="$blue3"
        borderRadius="$8"
        alignItems="center"
        justifyContent="center"
      >
        <Plus size="$3" color="$blue10" />
      </Card>

      <YStack alignItems="center" gap="$2">
        <Text fontSize="$6" fontWeight="600" textAlign="center">
          No Accounts Yet
        </Text>
        <Text
          fontSize="$4"
          color="$color11"
          textAlign="center"
          maxWidth={250}
          lineHeight="$1"
        >
          Create your first account to start tracking your finances
        </Text>
      </YStack>

      <Button
        size="$4"
        backgroundColor="$green9"
        color="white"
        icon={Plus}
        onPress={onCreateAccount}
      >
        Create First Account
      </Button>
    </YStack>
  );
}

export function AccountsList({
  accounts,
  isLoading,
  onAccountPress,
  onCreateAccount,
}: AccountsListProps) {
  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" color="$green9" />
        <Text marginTop="$3" color="$color11">
          Loading accounts...
        </Text>
      </YStack>
    );
  }

  // Sort accounts: default first, then by display order, then by creation time
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a._creationTime - b._creationTime;
  });

  if (sortedAccounts.length === 0) {
    return <EmptyState onCreateAccount={onCreateAccount} />;
  }

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.currentAmount,
    0
  );

  return (
    <ScrollView flex={1}>
      <YStack gap="$4">
        <Text fontSize="$5" fontWeight="600" marginBottom="$3">
          Your Accounts
        </Text>
        {/* Add Account Button */}
        <Button
          size="$4"
          backgroundColor="$green9"
          color="white"
          icon={Plus}
          onPress={onCreateAccount}
          marginBottom="$5"
        >
          Add New Account
        </Button>

        {/* Accounts List */}
        <YStack gap="$2">
          {sortedAccounts.map((account) => (
            <AccountCard
              key={account._id}
              account={account}
              onPress={() => onAccountPress(account)}
            />
          ))}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
