import React, { useState } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  ScrollView,
  H3,
  H4,
  Separator,
  Input,
} from "tamagui";
import {
  Wallet,
  Building,
  CreditCard,
  PiggyBank,
  Coins,
  CheckCircle,
  ArrowRight,
  Star,
  DollarSign,
} from "@tamagui/lucide-icons";
import { ACCOUNT_ICONS } from "./AccountForm";
import { useCreateAccount } from "../hooks/useAccounts";
import { CURRENCY_OPTIONS, getCurrencySymbol } from "../lib/formatCurrency";

interface AccountTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedAmount: number;
  isPopular?: boolean;
}

const ACCOUNT_TEMPLATES: AccountTemplate[] = [
  {
    id: "checking",
    name: "Checking Account",
    description: "For daily expenses and bill payments",
    icon: "bank",
    suggestedAmount: 1000,
    isPopular: true,
  },
  {
    id: "savings",
    name: "Savings Account",
    description: "For emergency funds and future goals",
    icon: "savings",
    suggestedAmount: 5000,
    isPopular: true,
  },
  {
    id: "wallet",
    name: "Cash Wallet",
    description: "For cash transactions and petty expenses",
    icon: "wallet",
    suggestedAmount: 200,
  },
  {
    id: "credit",
    name: "Credit Card",
    description: "Track credit card spending and payments",
    icon: "credit-card",
    suggestedAmount: -500,
  },
  {
    id: "investment",
    name: "Investment Account",
    description: "For stocks, bonds, and other investments",
    icon: "investment",
    suggestedAmount: 10000,
  },
  {
    id: "digital",
    name: "Digital Wallet",
    description: "PayPal, Venmo, and other digital payments",
    icon: "digital",
    suggestedAmount: 100,
  },
];

interface AccountOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function AccountOnboarding({
  onComplete,
  onSkip,
}: AccountOnboardingProps) {
  const { createAccount } = useCreateAccount();
  const [currentStep, setCurrentStep] = useState<
    "welcome" | "currency" | "templates" | "balances" | "success"
  >("welcome");
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "EUR">(
    "USD"
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customBalances, setCustomBalances] = useState<Record<string, string>>(
    {}
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<string[]>([]);

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates((prev) => {
      const newSelection = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];

      // Initialize balance for newly selected accounts
      if (!prev.includes(templateId) && newSelection.includes(templateId)) {
        const template = ACCOUNT_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
          setCustomBalances((prevBalances) => ({
            ...prevBalances,
            [templateId]: Math.abs(template.suggestedAmount).toString(),
          }));
        }
      }

      return newSelection;
    });
  };

  const handleBalanceChange = (templateId: string, value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    setCustomBalances((prev) => ({
      ...prev,
      [templateId]: numericValue,
    }));
  };

  const handleCreateAccounts = async () => {
    if (selectedTemplates.length === 0) return;

    setIsCreating(true);
    const created: string[] = [];

    try {
      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateId = selectedTemplates[i];
        const template = ACCOUNT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) continue;

        const customBalance = parseFloat(customBalances[templateId] || "0");
        const finalAmount =
          template.suggestedAmount < 0 ? -customBalance : customBalance;

        const result = await createAccount({
          name: template.name,
          description: template.description,
          icon: template.icon,
          defaultValue: finalAmount,
          currency: selectedCurrency,
        });

        if (result.success) {
          created.push(template.name);
        }
      }

      setCreatedAccounts(created);
      setCurrentStep("success");
    } catch (error) {
      console.error("Failed to create accounts:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderWelcomeStep = () => (
    <YStack gap="$6" alignItems="center" padding="$6">
      <Card
        padding="$6"
        backgroundColor="$blue3"
        borderRadius="$8"
        alignItems="center"
        justifyContent="center"
        width={120}
        height={120}
      >
        <Wallet size="$4" color="$blue10" />
      </Card>

      <YStack alignItems="center" gap="$3">
        <H3 textAlign="center" color="$color">
          Welcome to Finance Tracking!
        </H3>
        <Text
          fontSize="$4"
          color="$color11"
          textAlign="center"
          maxWidth={300}
          lineHeight="$2"
        >
          Let's set up your first accounts to start managing your finances
          effectively.
        </Text>
      </YStack>

      <YStack gap="$4" width="100%">
        <Card padding="$4" backgroundColor="$green2">
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <CheckCircle size="$1" color="$green10" />
              <Text fontSize="$4" fontWeight="600" color="$green11">
                Track All Your Money
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              Keep tabs on checking, savings, credit cards, and cash in one
              place
            </Text>
          </YStack>
        </Card>

        <Card padding="$4" backgroundColor="$blue2">
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <CheckCircle size="$1" color="$blue10" />
              <Text fontSize="$4" fontWeight="600" color="$blue11">
                Smart Organization
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              Automatically categorize and track your spending patterns
            </Text>
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$3" width="100%">
        <Button
          size="$4"
          backgroundColor="$green9"
          color="white"
          onPress={() => setCurrentStep("currency")}
          icon={ArrowRight}
        >
          Get Started
        </Button>

        <Button size="$3" variant="outlined" onPress={onSkip}>
          Skip for Now
        </Button>
      </YStack>
    </YStack>
  );

  const renderCurrencyStep = () => (
    <YStack gap="$6" alignItems="center" padding="$6">
      <Card
        padding="$6"
        backgroundColor="$blue3"
        borderRadius="$8"
        alignItems="center"
        justifyContent="center"
        width={120}
        height={120}
      >
        <DollarSign size="$4" color="$blue10" />
      </Card>

      <YStack alignItems="center" gap="$3">
        <H3 textAlign="center" color="$color">
          Choose Your Currency
        </H3>
        <Text
          fontSize="$4"
          color="$color11"
          textAlign="center"
          maxWidth={300}
          lineHeight="$2"
        >
          Select the currency you'll primarily use for your accounts.
        </Text>
      </YStack>

      <YStack gap="$4" width="100%">
        <XStack gap="$3">
          {CURRENCY_OPTIONS.map((option) => {
            const isSelected = selectedCurrency === option.value;

            return (
              <Card
                key={option.value}
                padding="$4"
                backgroundColor={isSelected ? "$blue3" : "$background"}
                borderColor={isSelected ? "$blue8" : "$borderColor"}
                borderWidth={2}
                pressStyle={{ scale: 0.95 }}
                onPress={() => setSelectedCurrency(option.value)}
                flex={1}
                alignItems="center"
                gap="$3"
              >
                <Text
                  fontSize="$8"
                  fontWeight="bold"
                  color={isSelected ? "$blue10" : "$color"}
                >
                  {option.symbol}
                </Text>
                <Text
                  fontSize="$4"
                  textAlign="center"
                  color={isSelected ? "$blue10" : "$color"}
                  fontWeight={isSelected ? "600" : "400"}
                >
                  {option.label}
                </Text>
              </Card>
            );
          })}
        </XStack>
      </YStack>

      <YStack gap="$3" width="100%">
        <Button
          size="$4"
          backgroundColor="$green9"
          color="white"
          onPress={() => setCurrentStep("templates")}
          icon={ArrowRight}
        >
          Continue
        </Button>

        <Button
          size="$3"
          variant="outlined"
          onPress={() => setCurrentStep("welcome")}
        >
          Back
        </Button>
      </YStack>
    </YStack>
  );

  const renderTemplatesStep = () => (
    <ScrollView flex={1}>
      <YStack gap="$4" padding="$4">
        <YStack gap="$2" alignItems="center">
          <H4 textAlign="center">Choose Your Account Types</H4>
          <Text
            fontSize="$3"
            color="$color11"
            textAlign="center"
            maxWidth={300}
          >
            Select the accounts you want to track. You can always add more
            later.
          </Text>
        </YStack>

        <YStack gap="$3">
          {ACCOUNT_TEMPLATES.map((template) => {
            const iconData = ACCOUNT_ICONS.find(
              (icon) => icon.id === template.icon
            );
            const IconComponent = iconData?.icon || Wallet;
            const isSelected = selectedTemplates.includes(template.id);

            return (
              <Card
                key={template.id}
                padding="$4"
                backgroundColor={isSelected ? "$green2" : "$background"}
                borderWidth={2}
                borderColor={isSelected ? "$green8" : "$borderColor"}
                pressStyle={{ scale: 0.98 }}
                onPress={() => handleTemplateToggle(template.id)}
              >
                <XStack alignItems="center" gap="$4">
                  <Card
                    padding="$3"
                    backgroundColor={isSelected ? "$green3" : "$blue3"}
                    borderRadius="$4"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconComponent
                      size="$1.5"
                      color={isSelected ? "$green10" : "$blue10"}
                    />
                  </Card>

                  <YStack flex={1} gap="$1">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$5" fontWeight="600" color="$color">
                        {template.name}
                      </Text>
                      {template.isPopular && (
                        <Card
                          backgroundColor="$yellow3"
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$3"
                        >
                          <XStack alignItems="center" gap="$1">
                            <Star size="$0.5" color="$yellow9" />
                            <Text fontSize="$1" color="$yellow11">
                              Popular
                            </Text>
                          </XStack>
                        </Card>
                      )}
                    </XStack>

                    <Text fontSize="$3" color="$color11">
                      {template.description}
                    </Text>
                  </YStack>

                  {isSelected && <CheckCircle size="$1.5" color="$green10" />}
                </XStack>
              </Card>
            );
          })}
        </YStack>

        <Separator marginVertical="$4" />

        <YStack gap="$3">
          <Text fontSize="$4" fontWeight="600" textAlign="center">
            Selected: {selectedTemplates.length} account
            {selectedTemplates.length !== 1 ? "s" : ""}
          </Text>

          <YStack gap="$3">
            <Button
              size="$4"
              backgroundColor="$green9"
              color="white"
              onPress={() => setCurrentStep("balances")}
              disabled={selectedTemplates.length === 0 || isCreating}
            >
              {isCreating
                ? "Setting Balances..."
                : `Set Balances for ${selectedTemplates.length} Account${selectedTemplates.length !== 1 ? "s" : ""}`}
            </Button>

            <Button
              size="$3"
              variant="outlined"
              onPress={() => setCurrentStep("currency")}
              disabled={isCreating}
            >
              Back
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );

  const renderBalancesStep = () => {
    const currencySymbol = getCurrencySymbol(selectedCurrency);

    return (
      <ScrollView flex={1}>
        <YStack gap="$4" padding="$4">
          <YStack gap="$2" alignItems="center">
            <H4 textAlign="center">Enter Starting Balances</H4>
            <Text
              fontSize="$3"
              color="$color11"
              textAlign="center"
              maxWidth={300}
            >
              Enter the starting balance for each selected account in{" "}
              {selectedCurrency}.
            </Text>
          </YStack>

          <YStack gap="$3">
            {selectedTemplates.map((templateId) => {
              const template = ACCOUNT_TEMPLATES.find(
                (t) => t.id === templateId
              );
              if (!template) return null;

              return (
                <Card
                  key={templateId}
                  padding="$4"
                  backgroundColor="$background"
                >
                  <YStack gap="$3">
                    <XStack alignItems="center" gap="$4">
                      <Card
                        padding="$3"
                        backgroundColor="$blue3"
                        borderRadius="$4"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <DollarSign size="$1.5" color="$blue10" />
                      </Card>

                      <YStack flex={1} gap="$1">
                        <Text fontSize="$5" fontWeight="600" color="$color">
                          {template.name}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$4" color="$color11">
                        {currencySymbol}
                      </Text>
                      <Input
                        flex={1}
                        value={customBalances[templateId] || ""}
                        onChangeText={(value) =>
                          handleBalanceChange(templateId, value)
                        }
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                    </XStack>
                  </YStack>
                </Card>
              );
            })}
          </YStack>

          <Separator marginVertical="$4" />

          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" textAlign="center">
              Selected: {selectedTemplates.length} account
              {selectedTemplates.length !== 1 ? "s" : ""}
            </Text>

            <YStack gap="$3">
              <Button
                size="$4"
                backgroundColor="$green9"
                color="white"
                onPress={handleCreateAccounts}
                disabled={selectedTemplates.length === 0 || isCreating}
              >
                {isCreating
                  ? "Creating Accounts..."
                  : `Create ${selectedTemplates.length} Account${selectedTemplates.length !== 1 ? "s" : ""}`}
              </Button>

              <Button
                size="$3"
                variant="outlined"
                onPress={() => setCurrentStep("templates")}
                disabled={isCreating}
              >
                Back
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    );
  };

  const renderSuccessStep = () => (
    <YStack gap="$6" alignItems="center" padding="$6">
      <Card
        padding="$6"
        backgroundColor="$green3"
        borderRadius="$8"
        alignItems="center"
        justifyContent="center"
        width={120}
        height={120}
      >
        <CheckCircle size="$4" color="$green10" />
      </Card>

      <YStack alignItems="center" gap="$3">
        <H3 textAlign="center" color="$green11">
          Accounts Created Successfully!
        </H3>
        <Text
          fontSize="$4"
          color="$color11"
          textAlign="center"
          maxWidth={300}
          lineHeight="$2"
        >
          You're all set! You can now start tracking your finances.
        </Text>
      </YStack>

      <Card padding="$4" backgroundColor="$blue2" width="100%">
        <YStack gap="$3">
          <Text fontSize="$4" fontWeight="600" color="$blue11">
            Created Accounts:
          </Text>
          {createdAccounts.map((accountName, index) => (
            <XStack key={index} alignItems="center" gap="$2">
              <CheckCircle size="$0.75" color="$green10" />
              <Text fontSize="$3" color="$color">
                {accountName}
              </Text>
            </XStack>
          ))}
        </YStack>
      </Card>

      <YStack gap="$4" width="100%">
        <Text fontSize="$3" color="$color11" textAlign="center">
          Next steps:
        </Text>
        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            • Add your first transaction
          </Text>
          <Text fontSize="$3" color="$color11">
            • Set up categories and budgets
          </Text>
          <Text fontSize="$3" color="$color11">
            • Explore financial insights
          </Text>
        </YStack>
      </YStack>

      <Button
        size="$4"
        backgroundColor="$green9"
        color="white"
        onPress={onComplete}
        width="100%"
      >
        Start Using Finance Tracker
      </Button>
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      {currentStep === "welcome" && renderWelcomeStep()}
      {currentStep === "currency" && renderCurrencyStep()}
      {currentStep === "templates" && renderTemplatesStep()}
      {currentStep === "balances" && renderBalancesStep()}
      {currentStep === "success" && renderSuccessStep()}
    </YStack>
  );
}
