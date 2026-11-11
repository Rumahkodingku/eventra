"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { organizerSettingsRepository } from "@/services/mock";
import type { OrganizerSettings } from "@/stores/organizer-settings";
import { useOrganizerSettingsStore as useRawOrganizerSettingsStore } from "@/stores/organizer-settings";

interface OrganizerSettingsState {
  settings: OrganizerSettings;
  updateSettings: (settings: Partial<OrganizerSettings>) => void;
  reset: () => void;
}

export function useOrganizerSettingsStore<T>(
  selector: (state: OrganizerSettingsState) => T,
): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["organizer-settings"],
    queryFn: organizerSettingsRepository.get,
    initialData: useRawOrganizerSettingsStore.getState().settings,
  });

  const state = useMemo<OrganizerSettingsState>(
    () => ({
      settings: query.data ?? useRawOrganizerSettingsStore.getState().settings,
      updateSettings: (settings) => {
        useRawOrganizerSettingsStore.getState().updateSettings(settings);
        void queryClient.invalidateQueries({
          queryKey: ["organizer-settings"],
        });
      },
      reset: () => {
        useRawOrganizerSettingsStore.getState().reset();
        void queryClient.invalidateQueries({
          queryKey: ["organizer-settings"],
        });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
