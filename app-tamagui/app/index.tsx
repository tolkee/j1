import React from "react";
import { View, H1, Text, Button, XStack } from "tamagui";
import { Link } from "expo-router";
import { Plus, CheckSquare } from "@tamagui/lucide-icons";

export default function HomeScreen() {
  return (
    <View flex={1} padding="$4" background="$background">
      {/* Header */}
      <View marginBottom="$6">
        <H1 color="$color" marginBottom="$2">
          Task Manager
        </H1>
        <Text color="$color" opacity={0.7}>
          Organize your tasks and projects efficiently
        </Text>
      </View>

      {/* Quick Actions */}
      <XStack gap="$4" marginBottom="$6">
        <Link href="/tasks" asChild>
          <Button flex={1} size="$5" theme="blue" icon={CheckSquare}>
            View Tasks
          </Button>
        </Link>
        
        <Link href="/tasks?action=new" asChild>
          <Button flex={1} size="$5" theme="green" icon={Plus}>
            Add Task
          </Button>
        </Link>
      </XStack>

      {/* Recent Activity Placeholder */}
      <View flex={1} backgroundColor="$background025" borderRadius="$4" padding="$4">
        <Text fontSize="$6" fontWeight="600" marginBottom="$3">
          Recent Activity
        </Text>
        <Text color="$color" opacity={0.6}>
          Your recent tasks and projects will appear here
        </Text>
      </View>
    </View>
  );
}
