"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect } from "react";
import { messages } from "@/i18n/messages";
import { usePreferencesStore } from "@/stores/preferences";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = usePreferencesStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="Asia/Jakarta"
    >
      {children}
    </NextIntlClientProvider>
  );
}
