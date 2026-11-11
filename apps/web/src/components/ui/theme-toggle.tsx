"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const Icon =
    !mounted || theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ubah tema"
          className="text-muted hover:text-ink"
        >
          <Icon className="size-[18px]" />
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>Tema</DropdownLabel>
        <DropdownItem onSelect={() => setTheme("light")}>
          <Sun className="size-4" /> Terang
        </DropdownItem>
        <DropdownItem onSelect={() => setTheme("dark")}>
          <Moon className="size-4" /> Gelap
        </DropdownItem>
        <DropdownItem onSelect={() => setTheme("system")}>
          <Monitor className="size-4" /> Sistem
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
