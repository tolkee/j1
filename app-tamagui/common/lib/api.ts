import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  auth: {
    isAuthenticated: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    signIn: FunctionReference<
      "action",
      "public",
      {
        calledBy?: string;
        params?: any;
        provider?: string;
        refreshToken?: string;
        verifier?: string;
      },
      any
    >;
    signOut: FunctionReference<"action", "public", Record<string, never>, any>;
  };
  tasks: {
    projects: {
      list: FunctionReference<
        "query",
        "public",
        { limit?: number; status?: "active" | "completed" | "archived" },
        any
      >;
      get: FunctionReference<"query", "public", { id: Id<"projects"> }, any>;
      create: FunctionReference<
        "mutation",
        "public",
        { color: string; description?: string; icon: string; name: string },
        any
      >;
      update: FunctionReference<
        "mutation",
        "public",
        {
          color?: string;
          description?: string;
          icon?: string;
          id: Id<"projects">;
          name?: string;
          status?: "active" | "completed" | "archived";
        },
        any
      >;
      remove: FunctionReference<
        "mutation",
        "public",
        { id: Id<"projects"> },
        any
      >;
      reorder: FunctionReference<
        "mutation",
        "public",
        { projectIds: Array<Id<"projects">> },
        any
      >;
      getStats: FunctionReference<
        "query",
        "public",
        { id: Id<"projects"> },
        any
      >;
      generateWeeklySummary: FunctionReference<
        "mutation",
        "public",
        Record<string, never>,
        any
      >;
    };
    setup: {
      initializeTasksService: FunctionReference<
        "mutation",
        "public",
        Record<string, never>,
        any
      >;
      isInitialized: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        any
      >;
      reset: FunctionReference<
        "mutation",
        "public",
        { confirmReset: boolean },
        any
      >;
      getSummary: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        any
      >;
    };
    tasks: {
      list: FunctionReference<
        "query",
        "public",
        {
          limit?: number;
          priority?: "low" | "medium" | "high";
          projectId?: Id<"projects">;
          status?: "todo" | "in_progress" | "completed";
        },
        any
      >;
      get: FunctionReference<"query", "public", { id: Id<"tasks"> }, any>;
      create: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          dueDate?: number;
          priority: "low" | "medium" | "high";
          projectId: Id<"projects">;
          tags?: Array<string>;
          title: string;
        },
        any
      >;
      update: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          dueDate?: number;
          id: Id<"tasks">;
          priority?: "low" | "medium" | "high";
          status?: "todo" | "in_progress" | "completed";
          tags?: Array<string>;
          title?: string;
        },
        any
      >;
      remove: FunctionReference<"mutation", "public", { id: Id<"tasks"> }, any>;
      toggleComplete: FunctionReference<
        "mutation",
        "public",
        { id: Id<"tasks"> },
        any
      >;
      getDueSoon: FunctionReference<"query", "public", { days?: number }, any>;
      getOverdue: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        any
      >;
      search: FunctionReference<
        "query",
        "public",
        { projectId?: Id<"projects">; query: string },
        any
      >;
      cleanupOldTasks: FunctionReference<
        "mutation",
        "public",
        Record<string, never>,
        any
      >;
    };
  };
  users: {
    getAllUsers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"users">;
        createdAt?: number;
        email?: string;
        emailVerified?: number;
        image?: string;
        updatedAt?: number;
        username?: string;
      }>
    >;
    getUserSettings: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      {
        _creationTime: number;
        _id: Id<"userSettings">;
        language?: string;
        notificationsEnabled?: boolean;
        theme?: "light" | "dark";
        userId: Id<"users">;
      } | null
    >;
    updateUserSettings: FunctionReference<
      "mutation",
      "public",
      {
        language?: string;
        notificationsEnabled?: boolean;
        theme?: "light" | "dark";
        userId: Id<"users">;
      },
      { message: string; success: boolean }
    >;
    deleteUser: FunctionReference<
      "mutation",
      "public",
      { userId: Id<"users"> },
      { message: string; success: boolean }
    >;
    getCurrentUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      {
        _creationTime: number;
        _id: Id<"users">;
        createdAt?: number;
        email?: string;
        emailVerified?: number;
        image?: string;
        updatedAt?: number;
        username?: string;
      } | null
    >;
    updateProfile: FunctionReference<
      "mutation",
      "public",
      { email?: string; username?: string },
      any
    >;
    initializeUserData: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
};
export type InternalApiType = {};
