import React, { useState } from "react";
import { View, H2, Text, Button, Input, TextArea, XStack, YStack, Select } from "tamagui";
import { ArrowLeft, Save, ChevronDown } from "@tamagui/lucide-icons";
import { Link, router } from "expo-router";

export default function NewTaskScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleSave = () => {
    // TODO: Connect to Convex API to save task
    console.log("Saving task:", { title, description, priority });
    router.back();
  };

  return (
    <View flex={1} padding="$4" background="$background">
      {/* Header */}
      <XStack alignItems="center" marginBottom="$4" gap="$3">
        <Link href="/tasks" asChild>
          <Button size="$3" variant="ghost" icon={ArrowLeft} />
        </Link>
        <H2 color="$color" flex={1}>New Task</H2>
        <Button size="$3" theme="green" icon={Save} onPress={handleSave}>
          Save
        </Button>
      </XStack>

      {/* Form */}
      <YStack gap="$4" flex={1}>
        {/* Title */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Title</Text>
          <Input
            placeholder="Enter task title..."
            value={title}
            onChangeText={setTitle}
            size="$4"
          />
        </YStack>

        {/* Description */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Description</Text>
          <TextArea
            placeholder="Enter task description (optional)..."
            value={description}
            onChangeText={setDescription}
            minHeight={100}
            size="$4"
          />
        </YStack>

        {/* Priority */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Priority</Text>
          <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
            <Select.Trigger width="100%" iconAfter={ChevronDown}>
              <Select.Value placeholder="Select priority" />
            </Select.Trigger>

            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Item index={0} value="low">
                    <Select.ItemText>Low</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={1} value="medium">
                    <Select.ItemText>Medium</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={2} value="high">
                    <Select.ItemText>High</Select.ItemText>
                  </Select.Item>
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>
      </YStack>
    </View>
  );
}