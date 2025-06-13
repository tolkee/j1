import React, { useState } from "react";
import { router } from "expo-router";
import { 
  YStack, 
  XStack, 
  Text, 
  Button, 
  Input, 
  TextArea,
  ScrollView,
  H3,
  Separator,
  Spinner
} from "tamagui";
import { ArrowLeft, Calendar, Flag, Tag, Save } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TasksProvider } from "@/services/tasks/contexts/TasksContext";
import { useProjects, useTasks } from "@/services/tasks/hooks";
import { ProjectSelector } from "@/services/tasks/components";
import { validateTaskTitle, getPriorityColor } from "@/services/tasks/lib/utils";
import type { TaskPriority, TaskStatus, Id } from "@/services/tasks/types";

function NewTaskContent() {
  const insets = useSafeAreaInsets();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { createTask, isLoading: tasksLoading } = useTasks();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>();
  const [dueDate, setDueDate] = useState<string>("");
  const [tags, setTags] = useState("");

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [titleError, setTitleError] = useState("");

  const isLoading = projectsLoading || tasksLoading;

  // Validation
  const validateForm = (): boolean => {
    const titleValidation = validateTaskTitle(title);
    if (!titleValidation.isValid) {
      setTitleError(titleValidation.error || "Invalid title");
      return false;
    }
    setTitleError("");
    return true;
  };

  // Handlers
  const handleCreateTask = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        projectId,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
      };

      await createTask(taskData);
      router.back();
    } catch (error) {
      console.error("Failed to create task:", error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
        <Text fontSize="$4" color="$color11" marginTop="$3">
          Loading...
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView 
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 16,
        }}
      >
        <YStack space="$6">
          {/* Header */}
          <YStack space="$3">
            <XStack alignItems="center" space="$3">
              <Button
                size="$3"
                variant="ghost"
                circular
                icon={ArrowLeft}
                onPress={handleBack}
              />
              <H3 color="$color12" flex={1}>New Task</H3>
              <Button
                size="$3"
                backgroundColor="$blue9"
                color="white"
                icon={Save}
                onPress={handleCreateTask}
                disabled={isCreating || !title.trim()}
                opacity={isCreating || !title.trim() ? 0.5 : 1}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </XStack>
          </YStack>

          {/* Basic Info */}
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="600" color="$color12">
              Basic Information
            </Text>

            {/* Title */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Title *
              </Text>
              <Input
                size="$4"
                placeholder="What needs to be done?"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (titleError) setTitleError("");
                }}
                borderColor={titleError ? "$red8" : "$color7"}
                backgroundColor="$background"
                autoFocus
              />
              {titleError && (
                <Text fontSize="$3" color="$red10">
                  {titleError}
                </Text>
              )}
            </YStack>

            {/* Description */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Description
              </Text>
              <TextArea
                size="$4"
                placeholder="Add more details about this task..."
                value={description}
                onChangeText={setDescription}
                numberOfLines={4}
                backgroundColor="$background"
                borderColor="$color7"
              />
            </YStack>
          </YStack>

          <Separator />

          {/* Organization */}
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="600" color="$color12">
              Organization
            </Text>

            {/* Project */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Project
              </Text>
              <ProjectSelector
                projects={projects || []}
                selectedProjectId={projectId}
                onProjectSelect={setProjectId}
                placeholder="Select a project (optional)"
              />
            </YStack>

            {/* Priority */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Priority
              </Text>
              <XStack space="$2" flexWrap="wrap">
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                  <Button
                    key={p}
                    size="$3"
                    variant={priority === p ? "solid" : "outlined"}
                    backgroundColor={priority === p ? getPriorityColor(p) : "transparent"}
                    borderColor={getPriorityColor(p)}
                    color={priority === p ? "white" : getPriorityColor(p)}
                    onPress={() => setPriority(p)}
                    icon={<Flag size="$1" />}
                    textTransform="capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Status */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Status
              </Text>
              <XStack space="$2" flexWrap="wrap">
                {(["todo", "in_progress"] as TaskStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="$3"
                    variant={status === s ? "solid" : "outlined"}
                    backgroundColor={status === s ? "$blue9" : "transparent"}
                    borderColor="$blue9"
                    color={status === s ? "white" : "$blue9"}
                    onPress={() => setStatus(s)}
                    textTransform="capitalize"
                  >
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Tags */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Tags
              </Text>
              <Input
                size="$4"
                placeholder="Add tags separated by commas (e.g., urgent, meeting, research)"
                value={tags}
                onChangeText={setTags}
                backgroundColor="$background"
                borderColor="$color7"
                icon={<Tag size="$1" />}
              />
              <Text fontSize="$2" color="$color10">
                Separate multiple tags with commas
              </Text>
            </YStack>
          </YStack>

          <Separator />

          {/* Schedule */}
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="600" color="$color12">
              Schedule
            </Text>

            {/* Due Date */}
            <YStack space="$2">
              <Text fontSize="$4" fontWeight="500" color="$color11">
                Due Date
              </Text>
              <Input
                size="$4"
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
                backgroundColor="$background"
                borderColor="$color7"
                icon={<Calendar size="$1" />}
              />
              <Text fontSize="$2" color="$color10">
                Optional: Set a due date for this task
              </Text>
            </YStack>
          </YStack>

          {/* Actions */}
          <YStack space="$3">
            <Button
              size="$4"
              backgroundColor="$blue9"
              color="white"
              icon={Save}
              onPress={handleCreateTask}
              disabled={isCreating || !title.trim()}
              opacity={isCreating || !title.trim() ? 0.5 : 1}
            >
              {isCreating ? "Creating Task..." : "Create Task"}
            </Button>
            
            <Button
              size="$4"
              variant="outlined"
              onPress={handleBack}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

export default function NewTaskScreen() {
  return (
    <TasksProvider>
      <NewTaskContent />
    </TasksProvider>
  );
}