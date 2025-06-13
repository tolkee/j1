import type { Task, Project, TaskPriority, TaskStatus, ProjectColor, ProjectIcon } from "../types";

// Date utilities
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays === -1) {
    return "Tomorrow";
  } else if (diffInDays > 0 && diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 0 && diffInDays > -7) {
    return `In ${Math.abs(diffInDays)} days`;
  } else {
    return date.toLocaleDateString();
  }
}

export function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = timestamp - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return `Overdue by ${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? 's' : ''}`;
  } else if (diffInDays === 0) {
    return "Due today";
  } else if (diffInDays === 1) {
    return "Due tomorrow";
  } else if (diffInDays <= 7) {
    return `Due in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  } else {
    return `Due ${date.toLocaleDateString()}`;
  }
}

export function isOverdue(dueDate: number): boolean {
  return dueDate < Date.now();
}

export function isDueSoon(dueDate: number, daysThreshold = 3): boolean {
  const now = Date.now();
  const threshold = now + (daysThreshold * 24 * 60 * 60 * 1000);
  return dueDate <= threshold && dueDate >= now;
}

// Priority utilities
export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "#ef4444"; // red
    case "medium":
      return "#f59e0b"; // orange
    case "low":
      return "#10b981"; // green
    default:
      return "#6b7280"; // gray
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Normal";
  }
}

// Status utilities
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "completed":
      return "#10b981"; // green
    case "in_progress":
      return "#3b82f6"; // blue
    case "todo":
      return "#6b7280"; // gray
    default:
      return "#6b7280";
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "todo":
      return "To Do";
    default:
      return "Unknown";
  }
}

// Task utilities
export function getTaskProgress(tasks: Task[]): { completed: number; total: number; percentage: number } {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

export function sortTasks(tasks: Task[], sortBy: keyof Task = "createdAt", direction: "asc" | "desc" = "desc"): Task[] {
  return [...tasks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return direction === "asc" ? 1 : -1;
    if (bVal === undefined) return direction === "asc" ? -1 : 1;
    
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function filterTasks(tasks: Task[], filters: {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  tags?: string[];
}): Task[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(search);
      const descMatch = task.description?.toLowerCase().includes(search);
      if (!titleMatch && !descMatch) {
        return false;
      }
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const taskTags = task.tags || [];
      const hasMatchingTag = filters.tags.some(tag => taskTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
}

// Project utilities
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    // Default project first
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    
    // Then by display order
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    
    // Finally by name
    return a.name.localeCompare(b.name);
  });
}

// Predefined colors and icons
export const PROJECT_COLORS: ProjectColor[] = [
  { name: "Blue", value: "#3b82f6", isDark: false },
  { name: "Green", value: "#10b981", isDark: false },
  { name: "Purple", value: "#8b5cf6", isDark: false },
  { name: "Pink", value: "#ec4899", isDark: false },
  { name: "Orange", value: "#f59e0b", isDark: false },
  { name: "Red", value: "#ef4444", isDark: false },
  { name: "Indigo", value: "#6366f1", isDark: false },
  { name: "Teal", value: "#14b8a6", isDark: false },
  { name: "Gray", value: "#6b7280", isDark: true },
  { name: "Slate", value: "#475569", isDark: true },
];

export const PROJECT_ICONS: ProjectIcon[] = [
  { emoji: "📋", name: "Clipboard", category: "work" },
  { emoji: "📝", name: "Memo", category: "work" },
  { emoji: "💼", name: "Briefcase", category: "work" },
  { emoji: "🏠", name: "House", category: "personal" },
  { emoji: "🛒", name: "Shopping", category: "personal" },
  { emoji: "🎯", name: "Target", category: "goals" },
  { emoji: "🚀", name: "Rocket", category: "goals" },
  { emoji: "📚", name: "Books", category: "learning" },
  { emoji: "💡", name: "Bulb", category: "ideas" },
  { emoji: "🎨", name: "Art", category: "creative" },
  { emoji: "🏃", name: "Running", category: "health" },
  { emoji: "💪", name: "Muscle", category: "health" },
  { emoji: "🌟", name: "Star", category: "favorites" },
  { emoji: "⭐", name: "Star2", category: "favorites" },
  { emoji: "📊", name: "Chart", category: "business" },
  { emoji: "💰", name: "Money", category: "finance" },
];

// Validation utilities
export function validateTaskTitle(title: string): string | null {
  if (!title.trim()) {
    return "Task title is required";
  }
  if (title.length > 200) {
    return "Task title must be less than 200 characters";
  }
  return null;
}

export function validateProjectName(name: string): string | null {
  if (!name.trim()) {
    return "Project name is required";
  }
  if (name.length > 100) {
    return "Project name must be less than 100 characters";
  }
  return null;
}