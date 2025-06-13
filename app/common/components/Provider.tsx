import { useColorScheme, Platform } from "react-native";
import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { CurrentToast } from "./CurrentToast";
import { config } from "../../tamagui.config";
import { convex } from "../lib/convex";
import { AuthProvider } from "@/services/auth/contexts/AuthContext";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  let colorScheme: "light" | "dark" = "light";
  try {
    colorScheme = useColorScheme() ?? "light";
  } catch (error) {
    console.warn("useColorScheme failed in Provider:", error);
    colorScheme = "light";
  }

  return (
    <ConvexAuthProvider
      client={convex}
      storage={
        Platform.OS === "android" || Platform.OS === "ios"
          ? secureStorage
          : undefined
      }
    >
      <AuthProvider>
        <TamaguiProvider
          config={config}
          defaultTheme={colorScheme === "dark" ? "dark" : "light"}
          {...rest}
        >
          <ToastProvider
            swipeDirection="horizontal"
            duration={6000}
            native={
              [
                // uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go
                // 'mobile'
              ]
            }
          >
            {children}
            <CurrentToast />
            <ToastViewport top="$8" left={0} right={0} />
          </ToastProvider>
        </TamaguiProvider>
      </AuthProvider>
    </ConvexAuthProvider>
  );
}

// Default export for the Provider component
export default Provider;
