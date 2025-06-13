# 📋 Tasks Service

An example service demonstrating the template patterns for building feature modules. This service provides project and task management functionality.

## 🎯 Purpose

This service serves as a **complete example** of how to build services in the Fullstack Mobile Template. It demonstrates:

- Backend function patterns (CRUD, validation, business logic)
- Frontend component architecture
- State management with React Context
- Custom hooks for data management
- TypeScript type definitions
- Testing patterns

## 🏗 Architecture

### Backend Functions

```
convex/src/tasks/
├── projects.ts     # Project CRUD operations
├── tasks.ts        # Task CRUD operations
└── setup.ts        # Service initialization
```

### Frontend Structure

```
app/services/tasks/
├── README.md       # This file
├── components/     # UI components (to be implemented)
├── contexts/       # React contexts (to be implemented)
├── hooks/          # Custom hooks (to be implemented)
├── types/          # TypeScript types (to be implemented)
└── lib/            # Utilities (to be implemented)
```

## 📊 Data Models

### Project

Projects organize tasks into logical groups.

```typescript
interface Project {
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
```

### Task

Tasks are actionable items within projects.

```typescript
interface Task {
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
```

## 🔧 Backend Functions

### Project Operations

- `projects.list` - List user's projects with optional filtering
- `projects.get` - Get single project by ID
- `projects.create` - Create new project
- `projects.update` - Update existing project
- `projects.remove` - Delete project and all its tasks
- `projects.reorder` - Change project display order
- `projects.getStats` - Get project statistics

### Task Operations

- `tasks.list` - List tasks with filtering options
- `tasks.get` - Get single task by ID
- `tasks.create` - Create new task
- `tasks.update` - Update existing task
- `tasks.remove` - Delete task
- `tasks.toggleComplete` - Toggle task completion
- `tasks.getDueSoon` - Get tasks due soon
- `tasks.getOverdue` - Get overdue tasks
- `tasks.search` - Search tasks by content

### Service Setup

- `setup.initializeTasksService` - Create default project and sample tasks
- `setup.isInitialized` - Check if user has projects
- `setup.reset` - Delete all user data (for testing)
- `setup.getSummary` - Get service statistics and recent activity

## 📱 Frontend Components (To Be Implemented)

This service includes placeholders for frontend components. When implementing your own services, consider creating:

### Core Components

```typescript
// Project components
<ProjectList />          // Display list of projects
<ProjectCard />          // Individual project display
<ProjectForm />          // Create/edit project form
<ProjectSelector />      // Dropdown project selector

// Task components
<TaskList />             // Display list of tasks
<TaskItem />             // Individual task display
<TaskForm />             // Create/edit task form
<TaskFilters />          // Filter and sort tasks

// Layout components
<TasksHeader />          // Service header with stats
<TasksNavigation />      // Service navigation
<TasksEmptyState />      // Empty state display
```

### Custom Hooks

```typescript
// Data management
useProjects()            // Project CRUD operations
useTasks(projectId?)     // Task CRUD operations
useTasksStats()          // Service statistics

// Service state
useTasksService()        // Service-wide state management
useProjectSelection()    // Project selection state
useTaskFilters()         // Task filtering state
```

### Context Provider

```typescript
<TasksProvider>
  {/* Service state and actions */}
  <TasksServiceContent />
</TasksProvider>
```

## 🧪 Testing Examples

The backend includes comprehensive tests demonstrating:

- **CRUD Operations**: Create, read, update, delete
- **User Isolation**: Users can only access their own data
- **Validation**: Input validation and error handling
- **Business Logic**: Complex operations and calculations
- **Access Control**: Permission verification

Example test patterns:

```typescript
test("user isolation", async () => {
  const user1 = t.withIdentity({ subject: "user1" });
  const user2 = t.withIdentity({ subject: "user2" });
  
  await user1.mutation(api.tasks.projects.create, { name: "User 1 Project" });
  await user2.mutation(api.tasks.projects.create, { name: "User 2 Project" });
  
  const user1Projects = await user1.query(api.tasks.projects.list);
  const user2Projects = await user2.query(api.tasks.projects.list);
  
  expect(user1Projects).toHaveLength(1);
  expect(user2Projects).toHaveLength(1);
  expect(user1Projects[0].name).toBe("User 1 Project");
  expect(user2Projects[0].name).toBe("User 2 Project");
});
```

## 🎨 Usage Patterns

### Initialization

```typescript
// Initialize service for new user
const result = await initializeTasksService();
// Creates default project with sample tasks
```

### Basic Operations

```typescript
// Create project
const projectId = await createProject({
  name: "My Project",
  description: "Project description",
  color: "#3b82f6",
  icon: "📋",
});

// Create task
const taskId = await createTask({
  projectId,
  title: "Complete the documentation",
  priority: "high",
  dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // Due in 1 week
});

// List tasks
const tasks = await listTasks({
  projectId,
  status: "todo",
  priority: "high",
});
```

### Advanced Queries

```typescript
// Get overdue tasks
const overdueTasks = await getOverdueTasks();

// Search tasks
const searchResults = await searchTasks({
  query: "documentation",
  projectId: projectId, // Optional: search within specific project
});

// Get project statistics
const stats = await getProjectStats(projectId);
```

## 🔄 Integration with Frontend

### Using in React Components

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/common/lib/api";

function TasksList({ projectId }: { projectId: Id<"projects"> }) {
  const tasks = useQuery(api.tasks.tasks.list, { projectId });
  const toggleComplete = useMutation(api.tasks.tasks.toggleComplete);
  
  return (
    <div>
      {tasks?.map(task => (
        <div key={task._id}>
          <span>{task.title}</span>
          <button onClick={() => toggleComplete({ id: task._id })}>
            {task.status === "completed" ? "Undo" : "Complete"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Updates

All queries automatically update in real-time when data changes:

```typescript
// This component will automatically re-render when tasks change
function TaskCounter({ projectId }: { projectId: Id<"projects"> }) {
  const tasks = useQuery(api.tasks.tasks.list, { projectId });
  const completedCount = tasks?.filter(t => t.status === "completed").length ?? 0;
  
  return <div>Completed: {completedCount}</div>;
}
```

## 🚀 Next Steps

This example service provides a solid foundation. To build your own services:

1. **Study the patterns** used in this service
2. **Copy the structure** for your new service
3. **Modify the data models** for your use case
4. **Implement the frontend components** following the patterns
5. **Write comprehensive tests** for your functions
6. **Document your service** clearly

## 📖 Learning Resources

- Study the backend functions in `convex/src/tasks/`
- Review the tests in `convex/tests/tasks/`
- Check the type definitions in `app/common/types/services.ts`
- Follow the architecture patterns in the main documentation

---

This tasks service demonstrates the full potential of the Fullstack Mobile Template architecture. Use it as a reference for building your own feature-rich services.