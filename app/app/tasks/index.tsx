import React, { useState } from "react";
import { View, H2, Text, Button, XStack, YStack, ScrollView } from "tamagui";
import { Plus, Filter, Search } from "@tamagui/lucide-icons";
import { Link } from "expo-router";

export default function TasksScreen() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  return (
    <View flex={1} padding="$4" background="$background">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
        <H2 color="$color">Tasks</H2>
        <Link href="/tasks/new" asChild>
          <Button size="$3" theme="green" icon={Plus}>
            Add Task
          </Button>
        </Link>
      </XStack>

      {/* Filter Tabs */}
      <XStack gap="$2" marginBottom="$4">
        <Button 
          size="$3" 
          variant={filter === "all" ? "outlined" : "ghost"}
          onPress={() => setFilter("all")}
        >
          All
        </Button>
        <Button 
          size="$3" 
          variant={filter === "active" ? "outlined" : "ghost"}
          onPress={() => setFilter("active")}
        >
          Active
        </Button>
        <Button 
          size="$3" 
          variant={filter === "completed" ? "outlined" : "ghost"}
          onPress={() => setFilter("completed")}
        >
          Completed
        </Button>
      </XStack>

      {/* Tasks List */}
      <ScrollView flex={1}>
        <YStack gap="$3">
          {/* Placeholder for empty state */}
          <View 
            backgroundColor="$background025" 
            borderRadius="$4" 
            padding="$4" 
            alignItems="center"
            justifyContent="center"
            minHeight={200}
          >
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">
              No tasks yet
            </Text>
            <Text color="$color" opacity={0.6} textAlign="center" marginBottom="$4">
              Get started by creating your first task
            </Text>
            <Link href="/tasks/new" asChild>
              <Button theme="blue" icon={Plus}>
                Create Task
              </Button>
            </Link>
          </View>
        </YStack>
      </ScrollView>
    </View>
  );
}