import React, { useState, useCallback } from "react";
import { RefreshControl } from "react-native";
import { router } from "expo-router";
import { 
  YStack, 
  XStack, 
  Text, 
  Button, 
  ScrollView, 
  H2,
  Spinner,
  Separator
} from "tamagui";
import { Plus, Calendar, CheckCircle, Clock, AlertCircle } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TasksProvider } from "@/services/tasks/contexts/TasksContext";
import { useProjects, useTasks, useTasksStats } from "@/services/tasks/hooks";
import { ProjectCard, TaskItem } from "@/services/tasks/components";
import { sortProjects, sortTasks, filterTasks } from "@/services/tasks/lib/utils";
import type { Task } from "@/services/tasks/types";

function TasksContent() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  // Data hooks
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { stats, overdueTasks, dueSoonTasks } = useTasksStats();

  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "overdue" | "completed">("all");

  const isLoading = projectsLoading || tasksLoading;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Queries will automatically refetch
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Navigation handlers
  const handleCreateTask = () => {
    router.push("/tasks/new");
  };

  const handleProjectPress = (projectId: string) => {
    router.push(`/tasks?project=${projectId}`);
  };

  const handleTaskPress = (taskId: string) => {
    // TODO: Navigate to task detail or edit
    console.log("Task pressed:", taskId);
  };

  // Filter tasks based on selected filter
  const getFilteredTasks = (): Task[] => {
    if (!tasks) return [];
    
    switch (selectedFilter) {
      case "today":
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return filterTasks(tasks, {}).filter(task => 
          task.dueDate && task.dueDate <= today.getTime()
        );
      case "overdue":
        return overdueTasks || [];
      case "completed":
        return filterTasks(tasks, { status: "completed" });
      default:
        return filterTasks(tasks, { status: "todo" }) 
          .concat(filterTasks(tasks, { status: "in_progress" }));
    }
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = sortTasks(filteredTasks, "createdAt", "desc");

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
        <Text fontSize="$4" color="$color11" marginTop="$3">
          Loading your tasks...
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView 
        flex={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
      >
        <YStack space="$6">
          {/* Header */}
          <YStack space="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <H2 color="$color12">Tasks</H2>
              <Button
                size="$3"
                backgroundColor="$blue9"
                color="white"
                icon={Plus}
                onPress={handleCreateTask}
              >
                New Task
              </Button>
            </XStack>

            {/* Quick Stats */}
            {stats && (
              <XStack space="$3" flexWrap="wrap">
                <XStack alignItems="center" space="$2" flex={1} minWidth={120}>
                  <CheckCircle size="$1" color="$green10" />
                  <Text fontSize="$3" color="$color11">
                    {stats.completedTasks} completed
                  </Text>
                </XStack>
                <XStack alignItems="center" space="$2" flex={1} minWidth={120}>
                  <Clock size="$1" color="$blue10" />
                  <Text fontSize="$3" color="$color11">
                    {stats.inProgressTasks} in progress
                  </Text>
                </XStack>
                {stats.overdueTasks > 0 && (
                  <XStack alignItems="center" space="$2" flex={1} minWidth={120}>
                    <AlertCircle size="$1" color="$red10" />
                    <Text fontSize="$3" color="$red10">
                      {stats.overdueTasks} overdue
                    </Text>
                  </XStack>
                )}
              </XStack>
            )}
          </YStack>

          {/* Filter Buttons */}
          <XStack space="$2" flexWrap="wrap">
            {[
              { key: "all", label: "All Tasks", icon: Calendar },
              { key: "today", label: "Due Today", icon: Calendar },
              { key: "overdue", label: "Overdue", icon: AlertCircle },
              { key: "completed", label: "Completed", icon: CheckCircle },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                size="$3"
                variant={selectedFilter === key ? "solid" : "outlined"}
                backgroundColor={selectedFilter === key ? "$blue9" : "transparent"}
                borderColor="$blue9"
                color={selectedFilter === key ? "white" : "$blue9"}
                onPress={() => setSelectedFilter(key as any)}
                icon={<Icon size="$1" />}
              >
                {label}
              </Button>
            ))}
          </XStack>

          {/* Projects Section */}
          {projects && projects.length > 0 && selectedFilter === "all" && (
            <YStack space="$3">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Projects
              </Text>
              <YStack space="$2">
                {sortProjects(projects).slice(0, 3).map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    stats={stats}
                    onPress={() => handleProjectPress(project._id)}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* Tasks Section */}
          <YStack space="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                {selectedFilter === "all" ? "Recent Tasks" : 
                 selectedFilter === "today" ? "Due Today" :
                 selectedFilter === "overdue" ? "Overdue Tasks" :
                 "Completed Tasks"}
              </Text>
              <Text fontSize="$3" color="$color11">
                {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
              </Text>
            </XStack>

            {sortedTasks.length === 0 ? (
              <YStack 
                alignItems="center" 
                justifyContent="center" 
                padding="$6"
                backgroundColor="$color2"
                borderRadius="$4"
              >
                <Calendar size="$3" color="$color9" />
                <Text fontSize="$4" color="$color11" textAlign="center" marginTop="$3">
                  {selectedFilter === "completed" ? "No completed tasks yet" :
                   selectedFilter === "overdue" ? "No overdue tasks" :
                   selectedFilter === "today" ? "No tasks due today" :
                   "No tasks yet"}
                </Text>
                {selectedFilter === "all" && (
                  <Button
                    size="$3"
                    variant="outlined"
                    marginTop="$3"
                    onPress={handleCreateTask}
                  >
                    Create your first task
                  </Button>
                )}
              </YStack>
            ) : (
              <YStack space="$2">
                {sortedTasks.map((task) => {
                  const project = projects?.find(p => p._id === task.projectId);
                  return (
                    <TaskItem
                      key={task._id}
                      task={task}
                      project={project}
                      showProject={true}
                      onPress={() => handleTaskPress(task._id)}
                      onToggleComplete={() => {
                        // This will be handled by the TaskItem component
                        // using the useTasks hook
                      }}
                    />
                  );
                })}
              </YStack>
            )}
          </YStack>

          {/* Due Soon Section */}
          {dueSoonTasks && dueSoonTasks.length > 0 && selectedFilter === "all" && (
            <>
              <Separator />
              <YStack space="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Due Soon
                </Text>
                <YStack space="$2">
                  {dueSoonTasks.slice(0, 3).map((task) => {
                    const project = projects?.find(p => p._id === task.projectId);
                    return (
                      <TaskItem
                        key={task._id}
                        task={task}
                        project={project}
                        showProject={true}
                        onPress={() => handleTaskPress(task._id)}
                      />
                    );
                  })}
                </YStack>
              </YStack>
            </>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}

export default function TasksScreen() {
  return (
    <TasksProvider>
      <TasksContent />
    </TasksProvider>
  );
}