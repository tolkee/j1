import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/common/lib/api";
import type { UseTasksStatsReturn, ProjectStats, Id } from "../types";

interface UseTasksStatsOptions {
  projectId?: Id<"projects">;
}

export function useTasksStats(options: UseTasksStatsOptions = {}): UseTasksStatsReturn {
  const { projectId } = options;
  
  // Queries
  const tasks = useQuery(api.tasks.tasks.list, projectId ? { projectId } : {});
  const overdueTasks = useQuery(api.tasks.tasks.getOverdue, {});
  const dueSoonTasks = useQuery(api.tasks.tasks.getDueSoon, {});

  // Calculate stats from tasks
  const stats = useMemo((): ProjectStats | undefined => {
    if (!tasks) return undefined;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    const todoTasks = tasks.filter(t => t.status === "todo").length;
    
    // Count overdue tasks within the current set
    const now = Date.now();
    const overdue = tasks.filter(t => 
      t.dueDate && 
      t.dueDate < now && 
      t.status !== "completed"
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks: overdue,
    };
  }, [tasks]);

  return {
    stats,
    isLoading: tasks === undefined,
    overdueTasks,
    dueSoonTasks,
  };
}