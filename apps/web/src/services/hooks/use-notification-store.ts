"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Notification } from "@/domain/types";
import { apiMode, notificationRepository } from "@/services/repositories";
import { useNotificationStore as useRawNotificationStore } from "@/stores/notifications";

interface NotificationState {
  notifications: Notification[];
  addNotification: (input: {
    userId?: string;
    type: Notification["type"];
    title: string;
    message: string;
    targetUrl?: string;
  }) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId?: string) => Promise<void>;
  reset: () => void;
}

export function useNotificationStore<T>(
  selector: (state: NotificationState) => T,
): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationRepository.list,
    initialData: apiMode ? undefined : seedData.notifications,
  });

  const state = useMemo<NotificationState>(
    () => ({
      notifications: query.data ?? [],
      addNotification: (input) => {
        if (apiMode) return;
        useRawNotificationStore.getState().addNotification(input);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      markRead: async (id) => {
        if (apiMode) {
          await notificationRepository.markRead(id);
        } else {
          useRawNotificationStore.getState().markRead(id);
        }
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      markAllRead: async (userId) => {
        if (apiMode) {
          await notificationRepository.markAllRead();
        } else {
          useRawNotificationStore.getState().markAllRead(userId);
        }
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      reset: () => {
        useRawNotificationStore.getState().reset();
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
