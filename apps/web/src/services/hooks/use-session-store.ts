"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User, UserRole } from "@/domain/types";
import { apiMode, userRepository } from "@/services/repositories";
import type { RegisterInput } from "@/services/repositories/types";
import { demoCredentials } from "@/stores/session";

export { demoCredentials };

interface SessionState {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; user?: User | null }>;
  loginDemo: (role: UserRole) => Promise<User>;
  register: (input: RegisterInput) => Promise<{
    ok: boolean;
    error?: string;
    user?: User;
  }>;
  logout: () => Promise<void>;
  updateProfile: (
    input: Partial<Pick<User, "name" | "email" | "phone">>,
  ) => Promise<void>;
}

export function useSessionStore<T>(selector: (state: SessionState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["session"],
    queryFn: userRepository.me,
    initialData: apiMode ? undefined : null,
  });

  const state = useMemo<SessionState>(
    () => ({
      user: query.data ?? null,
      login: async (email, password) => {
        const result = await userRepository.login({ email, password });
        queryClient.setQueryData(["session"], result.user ?? null);
        return result;
      },
      loginDemo: async (role) => {
        const user = await userRepository.loginDemo(role);
        queryClient.setQueryData(["session"], user);
        return user;
      },
      register: async (input) => {
        const result = await userRepository.register(input);
        if (result.user) queryClient.setQueryData(["session"], result.user);
        return result;
      },
      logout: async () => {
        await userRepository.logout();
        queryClient.setQueryData(["session"], null);
      },
      updateProfile: async (input) => {
        await userRepository.updateProfile(input);
        await queryClient.invalidateQueries({ queryKey: ["session"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
