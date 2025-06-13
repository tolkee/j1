import React, { createContext, useContext, ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../common/lib/api";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { signIn: authSignIn, signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  const isLoading = user === undefined;
  const isAuthenticated = !!user;

  const signIn = async (username: string, password: string) => {
    await authSignIn("password", { email: username, password, flow: "signIn" });
  };

  const signUp = async (username: string, password: string) => {
    await authSignIn("password", { email: username, password, flow: "signUp" });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
