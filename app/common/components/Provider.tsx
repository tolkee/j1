import React, { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import * as SecureStore from 'expo-secure-store';
import { convex } from '@/common/lib/convex';
import { AuthProvider } from '@/services/auth/contexts/AuthContext';

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexAuthProvider>
  );
}