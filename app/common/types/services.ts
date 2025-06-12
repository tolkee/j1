import { GenericId as Id } from "convex/values";

// Example service types - Task Management
export interface Project {
  _id: Id<"projects">;
  userId: Id<"users">;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: "active" | "completed" | "archived";
  isDefault: boolean;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  _id: Id<"tasks">;
  userId: Id<"users">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: number;
  completedAt?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TasksServiceSummary {
  isInitialized: boolean;
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    highPriorityTasks: number;
    recentlyCreatedTasks: number;
    recentlyCompletedTasks: number;
  };
  recentProjects: Project[];
  recentTasks: Task[];
}

// Generic service interfaces for template reference
export interface ServiceSetupStatus {
  isInitialized: boolean;
  hasData: boolean;
  itemCount: number;
  lastActivity?: number;
}

// Add your own service types here following these patterns
