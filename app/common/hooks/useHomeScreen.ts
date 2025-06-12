import { useCallback } from "react";
import { router } from "expo-router";
import { getEnabledServices } from "../lib/registry";
import { ServiceNode } from "../types/types";

export function useHomeScreen() {
  const services = getEnabledServices();

  const handleServicePress = useCallback((node: ServiceNode) => {
    // Navigate to service screen
    const route = node.service.route;

    // Track analytics (placeholder for now)
    console.log(`Navigating to service: ${node.service.name}`);

    try {
      router.push(route as any);
    } catch (error) {
      console.warn(`Failed to navigate to ${route}:`, error);
      // Fallback to a generic service screen
      router.push(`/services/${node.service.id}` as any);
    }
  }, []);

  const handleUserMenuPress = useCallback(() => {
    // Handle user menu press (could open a modal or navigate to profile)
    console.log("User menu pressed");
  }, []);

  const handleSettingsPress = useCallback(() => {
    router.push("/settings" as any);
  }, []);

  return {
    services,
    handleServicePress,
    handleUserMenuPress,
    handleSettingsPress,
  };
}
