import React, { useState } from "react";
import { View, XStack, YStack, Text, Avatar, Button } from "tamagui";
import { User, LogOut, Settings, Moon, Sun } from "@tamagui/lucide-icons";
import { useAuth } from "../../../services/auth/contexts/AuthContext";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingUserControlsProps {
  onLogout?: () => void;
}

export function FloatingUserControls({
  onLogout,
}: FloatingUserControlsProps = {}) {
  const { user, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      signOut();
    }
  };

  const handleToggleTheme = () => {
    // Theme toggle logic would go here
    console.log("Toggle theme");
  };

  const handleSettings = () => {
    console.log("Open settings");
  };

  const handleProfile = () => {
    console.log("Open profile");
  };

  if (!user) return null;

  return (
    <View
      position="absolute"
      top={insets.top + 24}
      right="$4"
      background="$background"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      padding="$3"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.3}
      shadowRadius={8}
      style={{ elevation: 8 }}
    >
      <XStack gap="$3" minWidth={200} alignItems="center">
        <Avatar circular size="$4" background="$blue10">
          <Avatar.Fallback>
            <User size="$1" color="white" />
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1}>
          <Text fontSize="$4" fontWeight="600" color="$color" numberOfLines={1}>
            {user.preferredName || user.name}
          </Text>
          <Text fontSize="$2" color="$color" numberOfLines={1} opacity={0.7}>
            {user.email}
          </Text>
        </YStack>

        <Button
          onPress={handleLogout}
          variant="outlined"
          size="$2"
          circular
          icon={LogOut}
          aria-label="Logout"
        />

        <Button
          size="$3"
          variant="outlined"
          circular
          icon={colorScheme === "dark" ? Sun : Moon}
          onPress={handleToggleTheme}
        />

        <Button
          size="$3"
          variant="outlined"
          circular
          icon={Settings}
          onPress={handleSettings}
        />
      </XStack>
    </View>
  );
}
