import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale, Preferences } from "@/domain/types";
import { safeStorage } from "@/lib/storage";

interface PreferencesState extends Preferences {
  setLocale: (locale: Locale) => void;
  setCity: (city: string) => void;
  setNotificationPref: (
    key: keyof Preferences["notificationPrefs"],
    value: boolean,
  ) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: "id",
      city: "Jakarta",
      notificationPrefs: {
        orderUpdates: true,
        eventReminders: true,
        newsletter: true,
      },
      setLocale: (locale) => set({ locale }),
      setCity: (city) => set({ city }),
      setNotificationPref: (key, value) =>
        set((state) => ({
          notificationPrefs: { ...state.notificationPrefs, [key]: value },
        })),
    }),
    {
      name: "eventra-preferences",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
