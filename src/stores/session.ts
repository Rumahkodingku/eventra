import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "@/data/seed";
import type { User, UserRole } from "@/domain/types";
import { createId } from "@/lib/ids";
import { safeStorage } from "@/lib/storage";

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
}

interface SessionState {
  user: User | null;
  registeredUsers: User[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
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

const demoCustomer =
  seedData.users.find((user) => user.role === "CUSTOMER") ?? seedData.users[0];
const demoOrganizer =
  seedData.users.find((user) => user.role === "ORGANIZER") ??
  seedData.users[1] ??
  seedData.users[0];

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      registeredUsers: [],
      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const known = [...seedData.users, ...get().registeredUsers].find(
          (user) => user.email.toLowerCase() === normalized,
        );
        if (!known || password !== "demo12345") {
          return { ok: false, error: "invalid" };
        }
        set({ user: known });
        return { ok: true };
      },
      loginDemo: (role) => {
        const user = role === "ORGANIZER" ? demoOrganizer : demoCustomer;
        set({ user });
        return user;
      },
      register: (input) => {
        const normalized = input.email.trim().toLowerCase();
        const exists = [...seedData.users, ...get().registeredUsers].some(
          (user) => user.email.toLowerCase() === normalized,
        );
        if (exists) return { ok: false, error: "exists" };
        if (!input.name.trim() || !normalized) {
          return { ok: false, error: "required" };
        }
        const user: User = {
          id: createId("user"),
          name: input.name.trim(),
          email: normalized,
          phone: input.phone?.trim(),
          role: "CUSTOMER",
          locale: "id",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          user,
          registeredUsers: [...state.registeredUsers, user],
        }));
        return { ok: true, user };
      },
      logout: () => set({ user: null }),
      updateProfile: (input) =>
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...input };
          return {
            user: updated,
            registeredUsers: state.registeredUsers.map((user) =>
              user.id === updated.id ? updated : user,
            ),
          };
        }),
    }),
    {
      name: "eventra-session",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

export const demoCredentials = {
  customer: demoCustomer,
  organizer: demoOrganizer,
  password: "demo12345",
};
