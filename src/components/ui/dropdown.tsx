"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[70] min-w-48 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-lift",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:bg-surface-subtle data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownCheckItem({
  checked,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem> & {
  checked: boolean;
}) {
  return (
    <DropdownPrimitive.CheckboxItem
      checked={checked}
      className="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:bg-surface-subtle data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      {...props}
    >
      <span className="grid size-4 place-items-center">
        <DropdownPrimitive.ItemIndicator>
          <Check className="size-4 text-brand-strong" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
}

export function DropdownSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("my-1 h-px bg-line", className)}
      {...props}
    />
  );
}

export function DropdownLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        "px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export { ChevronDown };
