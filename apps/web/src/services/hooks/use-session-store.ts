"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User, UserRole } from "@/domain/types";
import { userRepository } from "@/services/mock";
import type { RegisterInput } from "@/services/repositories/types";
import {
  demoCredentials,
  useSessionStore as useRawSessionStore,
} from "@/stores/session";

export { demoCredentials };

interface SessionState {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => { ok: boolean; error?: string; user?: User | null };
  loginDemo: (role: UserRole) => User;
  register: (input: RegisterInput) => {
    ok: boolean;
    error?: string;
    user?: User;
  };
  logout: () => void;
  updateProfile: (
    input: Partial<Pick<User, "name" | "email" | "phone">>,
  ) => void;
}

export function useSessionStore<T>(selector: (state: SessionState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["session"],
    queryFn: userRepository.me,
    initialData: null,
  });

  const state = useMemo<SessionState>(
    () => ({
      user: query.data ?? null,
      login: (email, password) => {
        const result = useRawSessionStore.getState().login(email, password);
        void queryClient.invalidateQueries({ queryKey: ["session"] });
        return { ...result, user: useRawSessionStore.getState().user };
      },
      loginDemo: (role) => {
        const user = useRawSessionStore.getState().loginDemo(role);
        void queryClient.invalidateQueries({ queryKey: ["session"] });
        return user;
      },
      register: (input) => {
        const result = useRawSessionStore.getState().register(input);
        void queryClient.invalidateQueries({ queryKey: ["session"] });
        return result;
      },
      logout: () => {
        useRawSessionStore.getState().logout();
        void queryClient.invalidateQueries({ queryKey: ["session"] });
      },
      updateProfile: (input) => {
        useRawSessionStore.getState().updateProfile(input);
        void queryClient.invalidateQueries({ queryKey: ["session"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
