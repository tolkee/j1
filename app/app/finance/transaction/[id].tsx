import React, { useState, useMemo } from "react";
import {
  YStack,
  XStack,
  Button,
  Text,
  Card,
  Separator,
  AlertDialog,
} from "tamagui";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Copy,
  Share,
  Calendar,
  DollarSign,
  Tag,
  Building,
  Clock,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";

// Import our custom components and hooks
import { useDeleteTransaction } from "../../../services/finance/hooks/useTransactions";
import { useGetCategories } from "../../../services/finance/hooks/useCategories";
import { useGetAccounts } from "../../../services/finance/hooks/useAccounts";
import { api } from "../../../common/lib/api";
import { useAuth } from "../../../services/auth/contexts/AuthContext";
import { GenericId as Id } from "convex/values";
import { DEFAULT_CATEGORY_COLORS } from "../../../services/finance/constants";
import { formatCurrency } from "../../../services/finance/lib/formatCurrency";

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const transactionId = params.id as Id<"transactions">;

  // Data hooks
  const { categories } = useGetCategories();
  const { accounts } = useGetAccounts();
  const { deleteTransaction, isDeleting } = useDeleteTransaction();

  // Get transaction details
  const transaction = useQuery(
    api.finance.transactions.getTransactionById,
    user && transactionId
      ? {
          transactionId: transactionId,
          userId: user._id,
        }
      : "skip"
  );

  // Get related data
  const category = useMemo(() => {
    if (!transaction?.categoryId || !categories) return null;
    return categories.find((cat) => cat._id === transaction.categoryId);
  }, [transaction?.categoryId, categories]);

  const account = useMemo(() => {
    if (!transaction?.accountId || !accounts) return null;
    return accounts.find((acc) => acc._id === transaction.accountId);
  }, [transaction?.accountId, accounts]);

  const handleEdit = () => {
    // TODO: Navigate to transaction edit screen
    router.push(`/finance/transaction/${transactionId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteTransaction(transactionId);
      router.back();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleDuplicate = () => {
    // Navigate to add expense/income with pre-filled data
    const route =
      transaction?.amount && transaction.amount > 0
        ? "/finance/add-income"
        : "/finance/add-expense";

    router.push({
      pathname: route,
      params: {
        accountId: transaction?.accountId,
        amount: Math.abs(transaction?.amount || 0).toString(),
        categoryId: transaction?.categoryId,
        description: transaction?.description || "",
      },
    });
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share transaction details");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!transaction) {
    return (
      <YStack
        flex={1}
        bg="$background"
        paddingTop={insets.top}
        justifyContent="center"
        alignItems="center"
        gap="$4"
      >
        <Text fontSize="$5" fontWeight="600">
          Transaction not found
        </Text>
        <Button
          onPress={() => router.back()}
          backgroundColor="$blue9"
          color="white"
        >
          Go Back
        </Button>
      </YStack>
    );
  }

  const isIncome = transaction.amount > 0;
  const displayAmount = Math.abs(transaction.amount);
  const displayTitle =
    transaction.description || (isIncome ? "Income" : "Expense");

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
          Transaction Details
        </Text>
        <Button size="$3" chromeless icon={Edit3} onPress={handleEdit} />
      </XStack>

      {/* Transaction Details */}
      <YStack flex={1} padding="$4" gap="$4">
        {/* Amount Display */}
        <Card padding="$6" borderRadius="$6" backgroundColor="$color2">
          <YStack alignItems="center" gap="$2">
            <Text
              fontSize="$10"
              fontWeight="bold"
              color={isIncome ? "$green10" : "$red10"}
            >
              {formatCurrency(transaction.amount, account?.currency)}
            </Text>
            <Text fontSize="$5" fontWeight="600" color="$color">
              {displayTitle}
            </Text>
            {transaction.description &&
              transaction.description !== displayTitle && (
                <Text fontSize="$3" color="$color11" textAlign="center">
                  {transaction.description}
                </Text>
              )}
          </YStack>
        </Card>

        {/* Details */}
        <YStack gap="$3">
          {/* Category */}
          {category && (
            <XStack
              alignItems="center"
              justifyContent="space-between"
              padding="$3"
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  width="$3"
                  height="$3"
                  borderRadius="$12"
                  backgroundColor="$color4"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="$3">{category.icon}</Text>
                </YStack>
                <YStack>
                  <Text fontSize="$4" fontWeight="500">
                    Category
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    {category.name}
                  </Text>
                </YStack>
              </XStack>
              <Tag size="$1" color="$color9" />
            </XStack>
          )}

          <Separator />

          {/* Account */}
          {account && (
            <XStack
              alignItems="center"
              justifyContent="space-between"
              padding="$3"
            >
              <XStack alignItems="center" gap="$3">
                <Building size="$1.5" color="$color9" />
                <YStack>
                  <Text fontSize="$4" fontWeight="500">
                    Account
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    {account.name}
                  </Text>
                </YStack>
              </XStack>
            </XStack>
          )}

          <Separator />

          {/* Date */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding="$3"
          >
            <XStack alignItems="center" gap="$3">
              <Calendar size="$1.5" color="$color9" />
              <YStack>
                <Text fontSize="$4" fontWeight="500">
                  Date
                </Text>
                <Text fontSize="$3" color="$color11">
                  {formatDate(transaction.date || transaction._creationTime)}
                </Text>
              </YStack>
            </XStack>
          </XStack>

          <Separator />

          {/* Time */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding="$3"
          >
            <XStack alignItems="center" gap="$3">
              <Clock size="$1.5" color="$color9" />
              <YStack>
                <Text fontSize="$4" fontWeight="500">
                  Time
                </Text>
                <Text fontSize="$3" color="$color11">
                  {formatTime(transaction.date || transaction._creationTime)}
                </Text>
              </YStack>
            </XStack>
          </XStack>

          <Separator />

          {/* Transaction ID */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding="$3"
          >
            <XStack alignItems="center" gap="$3">
              <DollarSign size="$1.5" color="$color9" />
              <YStack>
                <Text fontSize="$4" fontWeight="500">
                  Transaction ID
                </Text>
                <Text fontSize="$2" color="$color11">
                  {transaction._id}
                </Text>
              </YStack>
            </XStack>
          </XStack>
        </YStack>

        {/* Action Buttons */}
        <YStack gap="$3" marginTop="$4">
          <XStack gap="$3">
            <Button
              flex={1}
              variant="outlined"
              icon={Copy}
              onPress={handleDuplicate}
            >
              Duplicate
            </Button>
            <Button
              flex={1}
              variant="outlined"
              icon={Share}
              onPress={handleShare}
            >
              Share
            </Button>
          </XStack>

          <Button
            backgroundColor="$red9"
            color="white"
            icon={Trash2}
            onPress={() => setShowDeleteAlert(true)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </Button>
        </YStack>
      </YStack>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            animation={[
              "quick",
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            x={0}
            scale={1}
            opacity={1}
            y={0}
          >
            <YStack gap="$4">
              <AlertDialog.Title>Delete Transaction</AlertDialog.Title>
              <AlertDialog.Description>
                Are you sure you want to delete this transaction? This action
                cannot be undone.
              </AlertDialog.Description>

              <XStack gap="$3" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined">Cancel</Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    backgroundColor="$red9"
                    color="white"
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialog.Action>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}
