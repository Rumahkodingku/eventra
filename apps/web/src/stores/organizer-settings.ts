import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";

interface OrganizerSettings {
  displayName: string;
  description: string;
  email: string;
  website: string;
  instagram: string;
  tiktok: string;
  payoutBank: string;
  payoutAccount: string;
  orderUpdates: boolean;
  eventReminders: boolean;
  newsletter: boolean;
}

interface OrganizerSettingsState {
  settings: OrganizerSettings;
  updateSettings: (settings: Partial<OrganizerSettings>) => void;
  reset: () => void;
}

const initialSettings: OrganizerSettings = {
  displayName: "Rumah Kodingku Live",
  description:
    "Rumah produksi pengalaman live yang menghubungkan musisi, komunitas, dan penonton di seluruh Indonesia.",
  email: "organizer@demo.local",
  website: "https://example.com",
  instagram: "https://instagram.com/example",
  tiktok: "https://tiktok.com/@example",
  payoutBank: "Bank Demo Nusantara",
  payoutAccount: "•••• •••• 4821",
  orderUpdates: true,
  eventReminders: true,
  newsletter: false,
};

export const useOrganizerSettingsStore = create<OrganizerSettingsState>()(
  persist(
    (set) => ({
      settings: initialSettings,
      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),
      reset: () => set({ settings: initialSettings }),
    }),
    {
      name: "eventra-organizer-settings",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
