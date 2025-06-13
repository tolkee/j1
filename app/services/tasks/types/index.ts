import { Id } from "@/common/lib/api";

// Core data types matching the backend schema
export interface Project {
  _id: Id<"projects">;
  userId: Id<"users">;
  name: string;
  description?: string;
  color: string;        // Hex color for UI
  icon: string;         // Emoji or icon identifier
  status: "active" | "completed" | "archived";
  isDefault: boolean;   // User's default project
  displayOrder: number; // For sorting
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
  dueDate?: number;     // Optional due date
  completedAt?: number; // Completion timestamp
  tags?: string[];      // Optional tags for organization
  createdAt: number;
  updatedAt: number;
}

// UI-specific types
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
}

export interface TaskFilters {
  status?: Task["status"];
  priority?: Task["priority"];
  projectId?: Id<"projects">;
  search?: string;
  tags?: string[];
  dueDateRange?: {
    start?: number;
    end?: number;
  };
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Task["priority"];
  dueDate?: number;
  tags?: string[];
  projectId: Id<"projects">;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  color: string;
  icon: string;
}

// Context types
export interface TasksContextType {
  // State
  selectedProject: Project | null;
  taskFilters: TaskFilters;
  isLoading: boolean;
  
  // Actions
  setSelectedProject: (project: Project | null) => void;
  setTaskFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  
  // Quick actions
  createQuickTask: (title: string, projectId?: Id<"projects">) => Promise<Id<"tasks">>;
  toggleTaskComplete: (taskId: Id<"tasks">) => Promise<void>;
}

// Hook return types
export interface UseProjectsReturn {
  projects: Project[] | undefined;
  isLoading: boolean;
  createProject: (data: ProjectFormData) => Promise<Id<"projects">>;
  updateProject: (id: Id<"projects">, data: Partial<ProjectFormData>) => Promise<void>;
  deleteProject: (id: Id<"projects">) => Promise<void>;
  reorderProjects: (projectIds: Id<"projects">[]) => Promise<void>;
}

export interface UseTasksReturn {
  tasks: Task[] | undefined;
  isLoading: boolean;
  createTask: (data: TaskFormData) => Promise<Id<"tasks">>;
  updateTask: (id: Id<"tasks">, data: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: Id<"tasks">) => Promise<void>;
  toggleComplete: (id: Id<"tasks">) => Promise<void>;
}

export interface UseTasksStatsReturn {
  stats: ProjectStats | undefined;
  isLoading: boolean;
  overdueTasks: Task[] | undefined;
  dueSoonTasks: Task[] | undefined;
}

// Component prop types
export interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface TaskItemProps {
  task: Task;
  project?: Project;
  onPress?: () => void;
  onToggleComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showProject?: boolean;
}

export interface TaskFormProps {
  task?: Task;
  defaultProjectId?: Id<"projects">;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  projects: Project[];
}

// Utility types
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
export type ProjectStatus = Project["status"];

export interface TaskSortOption {
  key: keyof Task | "project";
  label: string;
  direction: "asc" | "desc";
}

export interface ProjectColor {
  name: string;
  value: string;
  isDark: boolean;
}

export interface ProjectIcon {
  emoji: string;
  name: string;
  category: string;
}