import React, { useState, useCallback } from "react";
import { YStack, XStack, Button, Text, Sheet } from "tamagui";
import { ChevronDown, Check } from "@tamagui/lucide-icons";
import { GenericId as Id } from "convex/values";
import { formatCurrency } from "../lib/formatCurrency";

interface Account {
  _id: Id<"bankAccounts">;
  name: string;
  icon: string;
  currentAmount: number;
  currency: "USD" | "EUR";
  isDefault: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: Id<"bankAccounts"> | null;
  onAccountSelect: (accountId: Id<"bankAccounts">) => void;
  onCreateAccount?: () => void;
}

export function AccountSelector({
  accounts,
  selectedAccount,
  onAccountSelect,
  onCreateAccount,
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccountData = accounts.find(
    (acc) => acc._id === selectedAccount
  );

  const handleAccountSelect = useCallback(
    (accountId: Id<"bankAccounts">) => {
      onAccountSelect(accountId);
      setIsOpen(false);
    },
    [onAccountSelect]
  );

  return (
    <YStack gap="$2">
      <Text fontSize="$4" fontWeight="600" color="$color">
        Account
      </Text>

      {/* Selected Account Display */}
      <Button
        size="$4"
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
        pressStyle={{
          backgroundColor: "$backgroundHover",
        }}
        onPress={() => setIsOpen(true)}
      >
        <XStack flex={1} alignItems="center" justifyContent="space-between">
          {selectedAccountData ? (
            <XStack alignItems="center" gap="$3">
              <Text fontSize="$6">{selectedAccountData.icon}</Text>
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="500" color="$color">
                  {selectedAccountData.name}
                </Text>
                <Text fontSize="$3" color="$color11">
                  {formatCurrency(
                    selectedAccountData.currentAmount,
                    selectedAccountData.currency
                  )}
                </Text>
              </YStack>
            </XStack>
          ) : (
            <Text fontSize="$4" color="$color11">
              Select an account
            </Text>
          )}
          <ChevronDown size="$1" color="$color11" />
        </XStack>
      </Button>

      {/* Account Selection Sheet */}
      <Sheet
        modal
        open={isOpen}
        onOpenChange={setIsOpen}
        snapPoints={[50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$4" gap="$3">
          <Text
            fontSize="$6"
            fontWeight="600"
            color="$color"
            textAlign="center"
          >
            Select Account
          </Text>

          <YStack gap="$2">
            {accounts.map((account) => (
              <Button
                key={account._id}
                size="$4"
                backgroundColor={
                  selectedAccount === account._id ? "$blue2" : "$background"
                }
                borderColor={
                  selectedAccount === account._id ? "$blue8" : "$borderColor"
                }
                borderWidth={1}
                borderRadius="$4"
                pressStyle={{
                  backgroundColor: "$backgroundHover",
                }}
                onPress={() => handleAccountSelect(account._id)}
              >
                <XStack
                  flex={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <XStack alignItems="center" gap="$3">
                    <Text fontSize="$6">{account.icon}</Text>
                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize="$4" fontWeight="500" color="$color">
                          {account.name}
                        </Text>
                        {account.isDefault && (
                          <Text fontSize="$2" color="$blue10" fontWeight="600">
                            DEFAULT
                          </Text>
                        )}
                      </XStack>
                      <Text fontSize="$3" color="$color11">
                        {formatCurrency(
                          account.currentAmount,
                          account.currency
                        )}
                      </Text>
                    </YStack>
                  </XStack>
                  {selectedAccount === account._id && (
                    <Check size="$1" color="$blue10" />
                  )}
                </XStack>
              </Button>
            ))}

            {/* Create Account Option */}
            {onCreateAccount && (
              <Button
                size="$4"
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$4"
                borderStyle="dashed"
                pressStyle={{
                  backgroundColor: "$backgroundHover",
                }}
                onPress={() => {
                  setIsOpen(false);
                  onCreateAccount();
                }}
              >
                <XStack alignItems="center" gap="$3">
                  <Text fontSize="$6">➕</Text>
                  <Text fontSize="$4" color="$color">
                    Add New Account
                  </Text>
                </XStack>
              </Button>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
