"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Notification } from "@/domain/types";
import { notificationRepository } from "@/services/mock";
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
  markRead: (id: string) => void;
  markAllRead: (userId?: string) => void;
  reset: () => void;
}

export function useNotificationStore<T>(
  selector: (state: NotificationState) => T,
): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationRepository.list,
    initialData: seedData.notifications,
  });

  const state = useMemo<NotificationState>(
    () => ({
      notifications: query.data ?? [],
      addNotification: (input) => {
        useRawNotificationStore.getState().addNotification(input);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      markRead: (id) => {
        useRawNotificationStore.getState().markRead(id);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
      markAllRead: (userId) => {
        useRawNotificationStore.getState().markAllRead(userId);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
