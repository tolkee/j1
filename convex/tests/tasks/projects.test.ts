import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import { api } from "../../src/_generated/api";
import schema from "../../src/schema";
import { modules } from "../modules";

describe("projects functions", () => {
  let t: ReturnType<typeof convexTest>;
  
  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("create and list projects", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create a project
    const projectId = await asUser.mutation(api.tasks.projects.create, {
      name: "Test Project",
      description: "A test project",
      color: "#3b82f6",
      icon: "📋",
    });

    expect(projectId).toBeDefined();

    // List projects
    const projects = await asUser.query(api.tasks.projects.list);
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Test Project");
    expect(projects[0].userId).toBe("user123");
    expect(projects[0].status).toBe("active");
    expect(projects[0].isDefault).toBe(true); // First project is default
  });

  test("user isolation", async () => {
    const user1 = t.withIdentity({ subject: "user1" });
    const user2 = t.withIdentity({ subject: "user2" });

    // User 1 creates project
    await user1.mutation(api.tasks.projects.create, {
      name: "User 1 Project",
      color: "#3b82f6",
      icon: "📋",
    });

    // User 2 creates project
    await user2.mutation(api.tasks.projects.create, {
      name: "User 2 Project",
      color: "#ef4444",
      icon: "📁",
    });

    // Each user should only see their own projects
    const user1Projects = await user1.query(api.tasks.projects.list);
    const user2Projects = await user2.query(api.tasks.projects.list);

    expect(user1Projects).toHaveLength(1);
    expect(user2Projects).toHaveLength(1);
    expect(user1Projects[0].name).toBe("User 1 Project");
    expect(user2Projects[0].name).toBe("User 2 Project");
  });

  test("duplicate name validation", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create first project
    await asUser.mutation(api.tasks.projects.create, {
      name: "Unique Project",
      color: "#3b82f6",
      icon: "📋",
    });

    // Try to create project with same name
    await expect(
      asUser.mutation(api.tasks.projects.create, {
        name: "Unique Project",
        color: "#ef4444",
        icon: "📁",
      })
    ).rejects.toThrow("already exists");
  });

  test("empty name validation", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    await expect(
      asUser.mutation(api.tasks.projects.create, {
        name: "",
        color: "#3b82f6",
        icon: "📋",
      })
    ).rejects.toThrow("name is required");

    await expect(
      asUser.mutation(api.tasks.projects.create, {
        name: "   ",
        color: "#3b82f6",
        icon: "📋",
      })
    ).rejects.toThrow("name is required");
  });

  test("update project", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create project
    const projectId = await asUser.mutation(api.tasks.projects.create, {
      name: "Original Name",
      description: "Original description",
      color: "#3b82f6",
      icon: "📋",
    });

    // Update project
    await asUser.mutation(api.tasks.projects.update, {
      id: projectId,
      name: "Updated Name",
      description: "Updated description",
      status: "completed",
    });

    // Verify update
    const updated = await asUser.query(api.tasks.projects.get, { id: projectId });
    expect(updated.name).toBe("Updated Name");
    expect(updated.description).toBe("Updated description");
    expect(updated.status).toBe("completed");
  });

  test("delete project", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create project
    const projectId = await asUser.mutation(api.tasks.projects.create, {
      name: "Project to Delete",
      color: "#3b82f6",
      icon: "📋",
    });

    // Verify it exists
    const projects = await asUser.query(api.tasks.projects.list);
    expect(projects).toHaveLength(1);

    // Delete project
    await asUser.mutation(api.tasks.projects.remove, { id: projectId });

    // Verify it's deleted
    const projectsAfterDelete = await asUser.query(api.tasks.projects.list);
    expect(projectsAfterDelete).toHaveLength(0);
  });

  test("access control", async () => {
    const user1 = t.withIdentity({ subject: "user1" });
    const user2 = t.withIdentity({ subject: "user2" });

    // User 1 creates project
    const projectId = await user1.mutation(api.tasks.projects.create, {
      name: "User 1 Project",
      color: "#3b82f6",
      icon: "📋",
    });

    // User 2 tries to access User 1's project
    await expect(
      user2.query(api.tasks.projects.get, { id: projectId })
    ).rejects.toThrow("Access denied");

    // User 2 tries to update User 1's project
    await expect(
      user2.mutation(api.tasks.projects.update, {
        id: projectId,
        name: "Hacked Name",
      })
    ).rejects.toThrow("Access denied");

    // User 2 tries to delete User 1's project
    await expect(
      user2.mutation(api.tasks.projects.remove, { id: projectId })
    ).rejects.toThrow("Access denied");
  });

  test("display order assignment", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create multiple projects
    const project1Id = await asUser.mutation(api.tasks.projects.create, {
      name: "First Project",
      color: "#3b82f6",
      icon: "📋",
    });

    const project2Id = await asUser.mutation(api.tasks.projects.create, {
      name: "Second Project",
      color: "#ef4444",
      icon: "📁",
    });

    const project3Id = await asUser.mutation(api.tasks.projects.create, {
      name: "Third Project",
      color: "#10b981",
      icon: "📝",
    });

    // Verify display orders
    const projects = await asUser.query(api.tasks.projects.list);
    expect(projects).toHaveLength(3);
    
    const sortedProjects = projects.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    expect(sortedProjects[0].name).toBe("First Project");
    expect(sortedProjects[0].displayOrder).toBe(1);
    expect(sortedProjects[0].isDefault).toBe(true);
    
    expect(sortedProjects[1].name).toBe("Second Project");
    expect(sortedProjects[1].displayOrder).toBe(2);
    expect(sortedProjects[1].isDefault).toBe(false);
    
    expect(sortedProjects[2].name).toBe("Third Project");
    expect(sortedProjects[2].displayOrder).toBe(3);
    expect(sortedProjects[2].isDefault).toBe(false);
  });

  test("reorder projects", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create projects
    const project1Id = await asUser.mutation(api.tasks.projects.create, {
      name: "Project A",
      color: "#3b82f6",
      icon: "📋",
    });

    const project2Id = await asUser.mutation(api.tasks.projects.create, {
      name: "Project B",
      color: "#ef4444",
      icon: "📁",
    });

    const project3Id = await asUser.mutation(api.tasks.projects.create, {
      name: "Project C",
      color: "#10b981",
      icon: "📝",
    });

    // Reorder: B, C, A
    await asUser.mutation(api.tasks.projects.reorder, {
      projectIds: [project2Id, project3Id, project1Id],
    });

    // Verify new order
    const projects = await asUser.query(api.tasks.projects.list);
    expect(projects[0].name).toBe("Project B");
    expect(projects[0].displayOrder).toBe(1);
    
    expect(projects[1].name).toBe("Project C");
    expect(projects[1].displayOrder).toBe(2);
    
    expect(projects[2].name).toBe("Project A");
    expect(projects[2].displayOrder).toBe(3);
  });

  test("filter projects by status", async () => {
    const asUser = t.withIdentity({ subject: "user123" });

    // Create projects with different statuses
    const activeProjectId = await asUser.mutation(api.tasks.projects.create, {
      name: "Active Project",
      color: "#3b82f6",
      icon: "📋",
    });

    const completedProjectId = await asUser.mutation(api.tasks.projects.create, {
      name: "Completed Project",
      color: "#ef4444",
      icon: "📁",
    });

    // Update one to completed
    await asUser.mutation(api.tasks.projects.update, {
      id: completedProjectId,
      status: "completed",
    });

    // Filter by active status
    const activeProjects = await asUser.query(api.tasks.projects.list, {
      status: "active",
    });
    expect(activeProjects).toHaveLength(1);
    expect(activeProjects[0].name).toBe("Active Project");

    // Filter by completed status
    const completedProjects = await asUser.query(api.tasks.projects.list, {
      status: "completed",
    });
    expect(completedProjects).toHaveLength(1);
    expect(completedProjects[0].name).toBe("Completed Project");

    // Get all projects
    const allProjects = await asUser.query(api.tasks.projects.list);
    expect(allProjects).toHaveLength(2);
  });
});