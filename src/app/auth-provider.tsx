"use client";

import { authApi, type User } from "@/lib/api";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const refreshUser = useCallback(
    async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    queryClient.setQueryData(["auth", "me"], null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: sessionQuery.data ?? null,
      loading: sessionQuery.isPending,
      refreshUser,
      logout,
    }),
    [sessionQuery.data, sessionQuery.isPending, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
