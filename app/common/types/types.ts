// Basic types for the task management app
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: "active" | "completed" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}
