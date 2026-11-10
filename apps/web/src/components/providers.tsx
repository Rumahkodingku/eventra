"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <I18nProvider>
          {children}
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              className:
                "!rounded-2xl !border !border-line !bg-surface !text-ink !shadow-[0_24px_70px_-32px_rgba(17,19,24,0.45)]",
            }}
          />
        </I18nProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
