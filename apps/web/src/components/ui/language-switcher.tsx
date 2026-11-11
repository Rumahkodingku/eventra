"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { usePreferencesStore } from "@/stores/preferences";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="text-muted hover:text-ink"
          aria-label="Ubah bahasa"
        >
          <Languages className="size-[18px]" />
          {!compact ? (
            <span className="text-xs font-semibold uppercase">{locale}</span>
          ) : null}
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>Bahasa / Language</DropdownLabel>
        <DropdownItem onSelect={() => setLocale("id")}>
          <span className="w-6 text-xs font-bold">ID</span> Bahasa Indonesia
        </DropdownItem>
        <DropdownItem onSelect={() => setLocale("en")}>
          <span className="w-6 text-xs font-bold">EN</span> English
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
