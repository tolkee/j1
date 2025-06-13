import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/common/lib/api";
import type { UseTasksReturn, TaskFormData, TaskFilters, Id } from "../types";

interface UseTasksOptions {
  projectId?: Id<"projects">;
  filters?: TaskFilters;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { projectId, filters } = options;
  
  // Queries
  const tasks = useQuery(api.tasks.tasks.list, {
    projectId,
    status: filters?.status,
    priority: filters?.priority,
    limit: 100, // Add reasonable limit
  });
  
  // Mutations
  const createMutation = useMutation(api.tasks.tasks.create);
  const updateMutation = useMutation(api.tasks.tasks.update);
  const deleteMutation = useMutation(api.tasks.tasks.remove);
  const toggleCompleteMutation = useMutation(api.tasks.tasks.toggleComplete);

  // Actions
  const createTask = useCallback(async (data: TaskFormData): Promise<Id<"tasks">> => {
    return await createMutation({
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      tags: data.tags,
    });
  }, [createMutation]);

  const updateTask = useCallback(async (
    id: Id<"tasks">, 
    data: Partial<TaskFormData>
  ): Promise<void> => {
    await updateMutation({
      id,
      ...data,
    });
  }, [updateMutation]);

  const deleteTask = useCallback(async (id: Id<"tasks">): Promise<void> => {
    await deleteMutation({ id });
  }, [deleteMutation]);

  const toggleComplete = useCallback(async (id: Id<"tasks">): Promise<void> => {
    await toggleCompleteMutation({ id });
  }, [toggleCompleteMutation]);

  return {
    tasks,
    isLoading: tasks === undefined,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}