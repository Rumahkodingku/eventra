import type { User } from "@/domain/types";
import { api } from "@/services/api/client";
import type {
  RegisterInput,
  UserRepository,
} from "@/services/repositories/types";

interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: User["role"];
  locale: User["locale"];
  created_at?: string;
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    locale: user.locale,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "error" in error) {
    const envelope = error as { error?: { code?: string; message?: string } };
    return envelope.error?.code ?? "REQUEST_FAILED";
  }
  return "REQUEST_FAILED";
}

export const apiUserRepository: UserRepository = {
  me: async () => {
    let result = await api.GET("/auth/me");
    if (result.response.status === 401) {
      const refreshed = await api.POST("/auth/refresh");
      if (refreshed.error) return null;
      result = await api.GET("/auth/me");
    }
    return result.data?.user ? mapUser(result.data.user) : null;
  },
  login: async ({ email, password }) => {
    const result = await api.POST("/auth/login", {
      body: { email, password },
    });
    if (result.error || !result.data) {
      return { ok: false, error: errorMessage(result.error), user: null };
    }
    return { ok: true, user: mapUser(result.data.user) };
  },
  loginDemo: async (role) => {
    const email =
      role === "ORGANIZER" ? "organizer@demo.local" : "customer@demo.local";
    const result = await api.POST("/auth/login", {
      body: { email, password: "demo12345" },
    });
    if (result.error || !result.data) {
      throw new Error(errorMessage(result.error));
    }
    return mapUser(result.data.user);
  },
  register: async (input: RegisterInput) => {
    const result = await api.POST("/auth/register", {
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password ?? "demo12345",
      },
    });
    if (result.error || !result.data) {
      return { ok: false, error: errorMessage(result.error) };
    }
    return { ok: true, user: mapUser(result.data.user) };
  },
  logout: async () => {
    await api.POST("/auth/logout");
  },
  logoutAll: async () => {
    await api.POST("/auth/logout-all");
  },
  updateProfile: async (input) => {
    await api.PATCH("/account/profile", {
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone,
      },
    });
  },
};
