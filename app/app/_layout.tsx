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
      <Stack.Screen name="tasks" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="tasks/new" 
        options={{ 
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: true,
          animationTypeForReplace: 'push'
        }} 
      />
      <Stack.Screen 
        name="tasks/edit/[taskId]" 
        options={{ 
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: true,
          animationTypeForReplace: 'push'
        }} 
      />
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