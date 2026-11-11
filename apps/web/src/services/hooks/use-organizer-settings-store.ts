"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiMode, organizerSettingsRepository } from "@/services/repositories";
import type { OrganizerSettings } from "@/stores/organizer-settings";
import { useOrganizerSettingsStore as useRawOrganizerSettingsStore } from "@/stores/organizer-settings";

interface OrganizerSettingsState {
  settings: OrganizerSettings;
  updateSettings: (settings: Partial<OrganizerSettings>) => void;
  saveSettings: (settings: OrganizerSettings) => Promise<void>;
  reset: () => Promise<void>;
}

export function useOrganizerSettingsStore<T>(
  selector: (state: OrganizerSettingsState) => T,
): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["organizer-settings"],
    queryFn: organizerSettingsRepository.get,
    initialData: apiMode
      ? undefined
      : useRawOrganizerSettingsStore.getState().settings,
  });

  const state = useMemo<OrganizerSettingsState>(
    () => ({
      settings: query.data ?? useRawOrganizerSettingsStore.getState().settings,
      updateSettings: (settings) => {
        useRawOrganizerSettingsStore.getState().updateSettings(settings);
        queryClient.setQueryData<OrganizerSettings>(
          ["organizer-settings"],
          (current) =>
            ({ ...(current ?? {}), ...settings }) as OrganizerSettings,
        );
      },
      saveSettings: async (settings) => {
        if (apiMode) {
          await organizerSettingsRepository.update(settings);
        } else {
          useRawOrganizerSettingsStore.getState().updateSettings(settings);
        }
        await queryClient.invalidateQueries({
          queryKey: ["organizer-settings"],
        });
      },
      reset: async () => {
        if (apiMode) {
          await organizerSettingsRepository.reset();
        } else {
          useRawOrganizerSettingsStore.getState().reset();
        }
        await queryClient.invalidateQueries({
          queryKey: ["organizer-settings"],
        });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
