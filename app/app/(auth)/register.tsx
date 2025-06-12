import React, { useState } from "react";
import {
  Alert,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import {
  Text,
  Input,
  Spinner,
  YStack,
  XStack,
  Button,
  H2,
  ScrollView,
} from "tamagui";
import { Mail, Lock, User, UserPlus } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../services/auth/contexts/AuthContext";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { signUp, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const validateForm = () => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.push("Please enter a valid email address");
    }

    if (!name.trim()) {
      errors.push("Name is required");
    } else if (name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    if (!password.trim()) {
      errors.push("Password is required");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Please fix the following errors:",
        validationErrors.join("\n")
      );
      return;
    }

    try {
      await signUp(email.trim(), password.trim(), name.trim());
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const getFieldError = (field: string) => {
    return validationErrors.find((error) =>
      error.toLowerCase().includes(field.toLowerCase())
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

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

      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          flex={1}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$8" alignItems="center" minHeight="100%">
            <YStack alignItems="center" gap="$4">
              <YStack
                padding="$4"
                backgroundColor="$green3"
                borderRadius="$10"
                alignItems="center"
                justifyContent="center"
                width={80}
                height={80}
              >
                <UserPlus size="$3" color="$green10" />
              </YStack>

              <YStack alignItems="center" gap="$2">
                <H2 color="$color" textAlign="center">
                  Welcome to the Workshop
                </H2>
                <Text
                  fontSize="$4"
                  color="$color11"
                  textAlign="center"
                  maxWidth={280}
                  lineHeight="$2"
                >
                  Time to build your digital assistant — no arc reactor
                  required, just an email
                </Text>
              </YStack>
            </YStack>

            <YStack gap="$4" width="100%" maxWidth={400}>
              <YStack gap="$2">
                <Text fontSize="$3" color="$color11" fontWeight="500">
                  Email
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$color3"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={getFieldError("email") ? 1 : 0}
                  borderColor="$red9"
                >
                  <Mail size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
                {getFieldError("email") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("email")}
                  </Text>
                )}
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$color11" fontWeight="500">
                  Full Name
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$color3"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={getFieldError("name") ? 1 : 0}
                  borderColor="$red9"
                >
                  <User size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    autoCapitalize="words"
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
                {getFieldError("name") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("name")}
                  </Text>
                )}
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$color11" fontWeight="500">
                  Password
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$color3"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={getFieldError("password") ? 1 : 0}
                  borderColor="$red9"
                >
                  <Lock size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
                {getFieldError("password") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("password")}
                  </Text>
                )}
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$color11" fontWeight="500">
                  Confirm Password
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$color3"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={getFieldError("passwords do not match") ? 1 : 0}
                  borderColor="$red9"
                >
                  <Lock size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
                {getFieldError("passwords do not match") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("passwords do not match")}
                  </Text>
                )}
              </YStack>

              <Button
                onPress={handleRegister}
                disabled={isLoading}
                backgroundColor="$green9"
                borderRadius="$4"
                paddingVertical="$4"
                paddingHorizontal="$6"
                marginTop="$3"
                height="auto"
                minHeight="$5"
              >
                {isLoading ? (
                  <XStack alignItems="center" gap="$2">
                    <Spinner color="white" size="small" />
                    <Text color="white" fontSize="$4" fontWeight="600">
                      Creating Account...
                    </Text>
                  </XStack>
                ) : (
                  <Text color="white" fontSize="$4" fontWeight="600">
                    Create Account
                  </Text>
                )}
              </Button>
            </YStack>

            <XStack alignItems="center" gap="$2" paddingBottom="$4">
              <Text fontSize="$4" color="$color11">
                Already have an account?
              </Text>
              <Button
                onPress={handleLogin}
                backgroundColor="transparent"
                paddingHorizontal="$0"
                paddingVertical="$0"
                height="auto"
              >
                <Text fontSize="$4" color="$blue10" fontWeight="600">
                  Sign In
                </Text>
              </Button>
            </XStack>
          </YStack>
        </ScrollView>
      </TouchableWithoutFeedback>
    </YStack>
  );
}
