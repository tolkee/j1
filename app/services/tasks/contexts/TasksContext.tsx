import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@/common/lib/api";
import type { 
  TasksContextType, 
  Project, 
  TaskFilters,
  Id 
} from "../types";

const TasksContext = createContext<TasksContextType | undefined>(undefined);

interface TasksProviderProps {
  children: ReactNode;
}

export function TasksProvider({ children }: TasksProviderProps) {
  // State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const createTaskMutation = useMutation(api.tasks.tasks.create);
  const toggleCompleteMutation = useMutation(api.tasks.tasks.toggleComplete);

  // Actions
  const clearFilters = useCallback(() => {
    setTaskFilters({});
  }, []);

  const createQuickTask = useCallback(async (
    title: string, 
    projectId?: Id<"projects">
  ): Promise<Id<"tasks">> => {
    if (!title.trim()) {
      throw new Error("Task title is required");
    }

    // Use selected project if no projectId provided
    const targetProjectId = projectId || selectedProject?._id;
    if (!targetProjectId) {
      throw new Error("No project selected");
    }

    setIsLoading(true);
    try {
      const taskId = await createTaskMutation({
        projectId: targetProjectId,
        title: title.trim(),
        priority: "medium",
      });
      return taskId;
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, createTaskMutation]);

  const toggleTaskComplete = useCallback(async (taskId: Id<"tasks">): Promise<void> => {
    setIsLoading(true);
    try {
      await toggleCompleteMutation({ id: taskId });
    } finally {
      setIsLoading(false);
    }
  }, [toggleCompleteMutation]);

  const value: TasksContextType = {
    // State
    selectedProject,
    taskFilters,
    isLoading,
    
    // Actions
    setSelectedProject,
    setTaskFilters,
    clearFilters,
    
    // Quick actions
    createQuickTask,
    toggleTaskComplete,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext(): TasksContextType {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasksContext must be used within a TasksProvider");
  }
  return context;
}