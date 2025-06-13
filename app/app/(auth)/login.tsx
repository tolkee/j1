import React, { useState } from "react";
import {
  Alert,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import { Text, Input, Spinner, YStack, XStack, Button, H2 } from "tamagui";
import { User, Lock, Bot } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../services/auth/contexts/AuthContext";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      await signIn(username.trim(), password.trim());
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Login failed"
      );
    }
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
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
        <YStack flex={1} justifyContent="center" paddingHorizontal="$6">
          <YStack gap="$8" alignItems="center">
            <YStack alignItems="center" gap="$4">
              <YStack
                padding="$4"
                backgroundColor="$blue3"
                borderRadius="$10"
                alignItems="center"
                justifyContent="center"
                width={80}
                height={80}
              >
                <Bot size="$3" color="$blue10" />
              </YStack>

              <YStack alignItems="center" gap="$2">
                <H2 color="$color" textAlign="center">
                  Welcome back
                </H2>
                <Text
                  fontSize="$4"
                  color="$color11"
                  textAlign="center"
                  maxWidth={280}
                  lineHeight="$2"
                >
                  Sign in to manage your tasks and stay organized
                </Text>
              </YStack>
            </YStack>

            <YStack gap="$4" width="100%" maxWidth={400}>
              <YStack gap="$2">
                <Text fontSize="$3" color="$color11" fontWeight="500">
                  Username
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$color3"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                >
                  <User size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
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
                >
                  <Lock size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
              </YStack>

              <Button
                onPress={handleLogin}
                disabled={isLoading}
                backgroundColor="$blue9"
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
                      Signing In...
                    </Text>
                  </XStack>
                ) : (
                  <Text color="white" fontSize="$4" fontWeight="600">
                    Sign In
                  </Text>
                )}
              </Button>
            </YStack>

            <XStack alignItems="center" gap="$2">
              <Text fontSize="$4" color="$color11">
                Don't have an account?
              </Text>
              <Button
                onPress={handleRegister}
                backgroundColor="transparent"
                paddingHorizontal="$0"
                paddingVertical="$0"
                height="auto"
              >
                <Text fontSize="$4" color="$blue10" fontWeight="600">
                  Create Account
                </Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </TouchableWithoutFeedback>
    </YStack>
  );
}
