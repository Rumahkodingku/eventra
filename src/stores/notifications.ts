import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "@/data/seed";
import type { Notification } from "@/domain/types";
import { createId } from "@/lib/ids";
import { safeStorage } from "@/lib/storage";

interface NewNotification {
  userId?: string;
  type: Notification["type"];
  title: string;
  message: string;
  targetUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (input: NewNotification) => void;
  markRead: (id: string) => void;
  markAllRead: (userId?: string) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: seedData.notifications,
      addNotification: (input) =>
        set((state) => ({
          notifications: [
            {
              id: createId("notif"),
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...state.notifications,
          ],
        })),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id
              ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
              : item,
          ),
        })),
      markAllRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            !userId || item.userId === userId
              ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
              : item,
          ),
        })),
      reset: () => set({ notifications: seedData.notifications }),
    }),
    {
      name: "eventra-notifications",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
