import type { components } from "@eventra/api-client";
import { api } from "@/services/api/client";
import type { OrganizerSettingsRepository } from "@/services/repositories/types";
import type { OrganizerSettings } from "@/stores/organizer-settings";

type ApiSettings = components["schemas"]["OrganizerSettings"];

function mapSettings(settings: ApiSettings): OrganizerSettings {
  return {
    displayName: settings.display_name,
    description: settings.description ?? "",
    email: settings.email ?? "",
    website: settings.website ?? "",
    instagram: settings.instagram ?? "",
    tiktok: settings.tiktok ?? "",
    payoutBank: settings.payout_bank ?? "",
    payoutAccount: settings.payout_account ?? "",
    orderUpdates: settings.order_updates ?? true,
    eventReminders: settings.event_reminders ?? true,
    newsletter: settings.newsletter ?? false,
  };
}

function toInput(settings: OrganizerSettings) {
  return {
    display_name: settings.displayName,
    description: settings.description,
    email: settings.email,
    website: settings.website,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    order_updates: settings.orderUpdates,
    event_reminders: settings.eventReminders,
    newsletter: settings.newsletter,
  };
}

const defaults: OrganizerSettings = {
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

export const apiOrganizerSettingsRepository: OrganizerSettingsRepository = {
  get: async () => {
    const result = await api.GET("/organizer/settings");
    if (result.error || !result.data) {
      throw new Error("Could not load settings.");
    }
    return mapSettings(result.data);
  },
  update: async (settings) => {
    const result = await api.PATCH("/organizer/settings", {
      body: toInput(settings),
    });
    if (result.error) {
      throw new Error("Could not save settings.");
    }
  },
  reset: async () => {
    const result = await api.PATCH("/organizer/settings", {
      body: toInput(defaults),
    });
    if (result.error) {
      throw new Error("Could not reset settings.");
    }
  },
};
