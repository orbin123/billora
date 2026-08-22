"use client";

import { createContext, type ReactNode, useContext } from "react";

export type AuthUser = {
  id: number;
  name: string;
  role: "admin" | "cashier";
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Session loading and auth actions will be connected when the auth feature is built.
  const value: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    login: async () => undefined,
    logout: async () => undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
