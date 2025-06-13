import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/common/lib/api";
import type { UseProjectsReturn, ProjectFormData, Id } from "../types";

export function useProjects(): UseProjectsReturn {
  // Queries
  const projects = useQuery(api.tasks.projects.list, {});
  
  // Mutations
  const createMutation = useMutation(api.tasks.projects.create);
  const updateMutation = useMutation(api.tasks.projects.update);
  const deleteMutation = useMutation(api.tasks.projects.remove);
  const reorderMutation = useMutation(api.tasks.projects.reorder);

  // Actions
  const createProject = useCallback(async (data: ProjectFormData): Promise<Id<"projects">> => {
    return await createMutation({
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
    });
  }, [createMutation]);

  const updateProject = useCallback(async (
    id: Id<"projects">, 
    data: Partial<ProjectFormData>
  ): Promise<void> => {
    await updateMutation({
      id,
      ...data,
    });
  }, [updateMutation]);

  const deleteProject = useCallback(async (id: Id<"projects">): Promise<void> => {
    await deleteMutation({ id });
  }, [deleteMutation]);

  const reorderProjects = useCallback(async (projectIds: Id<"projects">[]): Promise<void> => {
    await reorderMutation({ projectIds });
  }, [reorderMutation]);

  return {
    projects,
    isLoading: projects === undefined,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}