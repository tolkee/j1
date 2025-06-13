import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "@/common/components/Provider";
import { useAuth } from "@/services/auth/contexts/AuthContext";

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/projects");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="auto" />
      <AppNavigator />
    </Provider>
  );
}