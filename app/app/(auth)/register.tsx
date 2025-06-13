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
import { User, Lock, UserPlus, Eye, EyeOff } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../services/auth/contexts/AuthContext";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { signUp, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const validateForm = () => {
    const errors: string[] = [];

    if (!username.trim()) {
      errors.push("Username is required");
    } else if (username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (!password.trim()) {
      errors.push("Password is required");
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
      await signUp(username.trim(), password.trim());
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                  Create your account
                </H2>
                <Text
                  fontSize="$4"
                  color="$color11"
                  textAlign="center"
                  maxWidth={280}
                  lineHeight="$2"
                >
                  Join us to start organizing your tasks and boost your productivity
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
                  borderWidth={getFieldError("username") ? 1 : 0}
                  borderColor="$red9"
                >
                  <User size="$1" color="$color11" />
                  <Input
                    flex={1}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                </XStack>
                {getFieldError("username") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("username")}
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
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    backgroundColor="transparent"
                    borderWidth={0}
                    paddingHorizontal="$3"
                    fontSize="$4"
                  />
                  <Button
                    onPress={togglePasswordVisibility}
                    backgroundColor="transparent"
                    padding="$2"
                    height="auto"
                    minHeight="auto"
                  >
                    {showPassword ? (
                      <EyeOff size="$1" color="$color11" />
                    ) : (
                      <Eye size="$1" color="$color11" />
                    )}
                  </Button>
                </XStack>
                {getFieldError("password") && (
                  <Text fontSize="$2" color="$red10">
                    {getFieldError("password")}
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
