import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@/common/lib/api';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { signIn: authSignIn, signOut: authSignOut } = useAuthActions();
  
  // Get current user
  const user = useQuery(api.users.getCurrentUser);
  const isLoading = user === undefined;
  const isAuthenticated = user !== null;

  const signIn = async (username: string, password: string) => {
    try {
      // First try to sign in
      await authSignIn('password', { 
        username, 
        password,
        flow: 'signIn'
      });
    } catch (error) {
      // If user doesn't exist, create account automatically (for demo purposes)
      console.log('User not found, creating account for:', username);
      await authSignIn('password', { 
        username, 
        password,
        email: `${username}@example.com`,
        flow: 'signUp'
      });
    }
  };

  const signOut = async () => {
    await authSignOut();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}