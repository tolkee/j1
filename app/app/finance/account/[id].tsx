import React, { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Alert, StatusBar } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  Spinner,
  H4,
  Separator,
} from "tamagui";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Settings,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../../services/auth/contexts/AuthContext";
import {
  useDeleteAccount,
  useSetDefaultAccount,
} from "../../../services/finance/hooks/useAccounts";
import { ACCOUNT_ICONS } from "../../../services/finance/components/AccountForm";
import { formatCurrency } from "../../../services/finance/lib/formatCurrency";
import { RecurringTransactionCard } from "../../../services/finance/components/RecurringTransactionCard";
import { RecurringTransactionModal } from "../../../services/finance/components/RecurringTransactionModal";

import { GenericId as Id } from "convex/values";

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { deleteAccount } = useDeleteAccount();
  const { setDefaultAccount } = useSetDefaultAccount();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // Validate ID parameter
  const isValidId = id && typeof id === 'string' && id.length > 0;
  
  // Fetch account details only if we have a valid ID and user
  const account = useQuery(
    api.finance.accounts.getAccountById,
    user && isValidId
      ? {
          accountId: id as Id<"bankAccounts">,
          userId: user._id,
        }
      : "skip"
  );

  const handleGoBack = () => {
    router.back();
  };

  const handleEditAccount = () => {
    // Navigate to edit account (this would be implemented later)
    router.push(`/finance/account/${id}/edit`);
  };

  const handleAddTransaction = () => {
    // Navigate to add transaction with this account pre-selected
    router.push({
      pathname: "/finance/add-expense",
      params: { accountId: id },
    });
  };

  const handleSetDefault = async () => {
    if (!account || account.isDefault) return;

    try {
      const result = await setDefaultAccount(account._id);
      if (result.success) {
        Alert.alert("Success", "Default account updated successfully");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to set default account");
    }
  };

  const handleDeleteAccount = () => {
    if (!account) return;

    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteAccount(account._id);
              if (result.success) {
                Alert.alert("Success", "Account deleted successfully", [
                  {
                    text: "OK",
                    onPress: () => router.replace("/finance/accounts"),
                  },
                ]);
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle invalid ID parameter
  if (!isValidId) {
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

        {/* Simple Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$3"
        >
          <Button
            size="$5"
            circular
            backgroundColor="transparent"
            icon={ArrowLeft}
            color="white"
            onPress={handleGoBack}
          />
          <YStack width="$5" />
        </XStack>

        <YStack
          alignItems="center"
          justifyContent="center"
          flex={1}
          padding="$4"
        >
          <Text fontSize="$5" textAlign="center" color="$color11">
            Invalid account ID. Please check the URL and try again.
          </Text>
          <Button marginTop="$4" onPress={handleGoBack}>
            Go Back
          </Button>
        </YStack>
      </YStack>
    );
  }

  // Show loading spinner while fetching account data
  if (!account && user && isValidId) {
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
        <YStack alignItems="center" justifyContent="center" flex={1}>
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$3" color="$color11">
            Loading account details...
          </Text>
        </YStack>
      </YStack>
    );
  }

  // Handle case where account is not found or user doesn't have permission
  if (!account) {
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

        {/* Simple Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$3"
        >
          <Button
            size="$5"
            circular
            backgroundColor="transparent"
            icon={ArrowLeft}
            color="white"
            onPress={handleGoBack}
          />
          <YStack width="$5" />
        </XStack>

        <YStack
          alignItems="center"
          justifyContent="center"
          flex={1}
          padding="$4"
        >
          <Text fontSize="$5" textAlign="center" color="$color11">
            This account could not be found or you don't have permission to view
            it.
          </Text>
          <Button marginTop="$4" onPress={handleGoBack}>
            Go Back
          </Button>
        </YStack>
      </YStack>
    );
  }

  const iconData = ACCOUNT_ICONS.find((icon) => icon.id === account.icon);
  const IconComponent = iconData?.icon || ACCOUNT_ICONS[0].icon;
  const isPositive = account.currentAmount >= 0;

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

      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4">
        <Button size="$3" chromeless icon={ArrowLeft} onPress={handleGoBack} />
        <XStack alignItems="center" gap="$2">
          <Text fontSize="$6" fontWeight="600" color="$color">
            {account?.name || "Account Details"}
          </Text>
          {account?.isDefault && (
            <Star size="$1" color="$yellow9" fill="$yellow9" />
          )}
        </XStack>
        <YStack width="$5" />
      </XStack>

      <ScrollView flex={1}>
        <YStack gap="$4" padding="$4">
          {/* Account Summary Card */}
          <Card padding="$4" backgroundColor="$blue2">
            <YStack gap="$3" alignItems="center">
              <Card
                padding="$3"
                backgroundColor="$blue3"
                borderRadius="$6"
                alignItems="center"
                justifyContent="center"
              >
                <IconComponent size="$2" color="$blue10" />
              </Card>

              <YStack alignItems="center" gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Text
                    fontSize="$8"
                    fontWeight="bold"
                    color={isPositive ? "$green10" : "$red10"}
                  >
                    {formatCurrency(account.currentAmount, account.currency)}
                  </Text>
                  {isPositive ? (
                    <TrendingUp size="$1" color="$green10" />
                  ) : (
                    <TrendingDown size="$1" color="$red10" />
                  )}
                </XStack>

                <Text fontSize="$4" color="$color11">
                  Current Balance
                </Text>

                {account.isDefault && (
                  <Card
                    backgroundColor="$green9"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$4"
                  >
                    <XStack alignItems="center" gap="$2">
                      <Star size="$0.75" color="white" />
                      <Text fontSize="$3" color="white" fontWeight="600">
                        Default Account
                      </Text>
                    </XStack>
                  </Card>
                )}
              </YStack>
            </YStack>
          </Card>

          {/* Recurring Transactions Card */}
          <RecurringTransactionCard
            accountId={account._id}
            currency={account.currency}
            onAddRecurring={() => setIsRecurringModalOpen(true)}
            onViewRecurring={(recurringTransactionId) => {
              // Navigate to recurring transaction details
              // This would be implemented later
              console.log("View recurring transaction:", recurringTransactionId);
            }}
          />

          {/* Account Statistics */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600">
              Account Info
            </Text>

            <Card padding="$4">
              <YStack gap="$3">
                {account.description && (
                  <>
                    <XStack
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Text color="$color11">Description</Text>
                      <Text fontWeight="600" flex={1} textAlign="right">
                        {account.description}
                      </Text>
                    </XStack>

                    <Separator />
                  </>
                )}

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11">Initial Balance</Text>
                  <Text fontWeight="600" color="$blue10">
                    {formatCurrency(account.defaultValue, account.currency)}
                  </Text>
                </XStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11">Transaction Count</Text>
                  <Text fontWeight="600">{account.transactionCount || 0}</Text>
                </XStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11">Account Created</Text>
                  <Text fontWeight="600">
                    {formatDate(account._creationTime)}
                  </Text>
                </XStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11">Account Type</Text>
                  <Text fontWeight="600">{iconData?.name || "Wallet"}</Text>
                </XStack>
              </YStack>
            </Card>
          </YStack>

          {/* Account Actions */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600">
              Account Actions
            </Text>

            <Card padding="$4">
              <YStack gap="$3">
                {!account.isDefault && (
                  <>
                    <Text fontSize="$4" fontWeight="600">
                      Set as Default Account
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      Make this your default account for new transactions.
                    </Text>
                    <Button
                      backgroundColor="$blue9"
                      color="white"
                      icon={Star}
                      onPress={handleSetDefault}
                    >
                      Set as Default
                    </Button>

                    <Separator />
                  </>
                )}

                <Text fontSize="$4" fontWeight="600">
                  Edit Account
                </Text>
                <Text fontSize="$3" color="$color11">
                  Modify account name, description, or icon.
                </Text>
                <Button
                  backgroundColor="$color8"
                  color="white"
                  icon={Settings}
                  onPress={handleEditAccount}
                >
                  Edit Account
                </Button>
              </YStack>
            </Card>
          </YStack>

          {/* Danger Zone */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" color="$red10">
              Danger Zone
            </Text>

            <Card padding="$4" borderColor="$red8" borderWidth={1}>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="600" color="$red10">
                  Delete Account
                </Text>
                <Text fontSize="$3" color="$color11">
                  Permanently delete this account and all its transactions. This
                  action cannot be undone.
                </Text>
                <Button
                  backgroundColor="$red9"
                  color="white"
                  icon={Trash2}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Recurring Transaction Modal */}
      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        accountId={account._id}
        onSuccess={() => {
          // Modal will close automatically
          // Data will refresh automatically via real-time subscriptions
        }}
      />
    </YStack>
  );
}
