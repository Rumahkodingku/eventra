"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_180ms_ease-out] data-[state=closed]:animate-[fade-out_140ms_ease-in]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-surface p-6 text-ink shadow-lift data-[state=open]:animate-[dialog-in_200ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_140ms_ease-in] sm:p-8",
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "right" | "left" | "bottom";
}) {
  const sideClass =
    side === "left"
      ? "left-0 top-0 h-full w-[min(88vw,380px)] data-[state=open]:animate-[slide-in-left_260ms_var(--ease-drawer)]"
      : side === "bottom"
        ? "bottom-0 left-0 right-0 max-h-[88svh] w-full rounded-t-3xl data-[state=open]:animate-[slide-up_260ms_var(--ease-drawer)]"
        : "right-0 top-0 h-full w-[min(88vw,420px)] data-[state=open]:animate-[slide-in-right_260ms_var(--ease-drawer)]";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_180ms_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 overflow-y-auto border-line bg-surface p-5 text-ink shadow-lift data-[state=closed]:animate-[fade-out_140ms_ease-in]",
          sideClass,
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogHeader({
  title,
  description,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-2 pr-8", className)}>
      <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </DialogTitle>
      {description ? (
        <DialogDescription className="text-sm leading-relaxed text-muted">
          {description}
        </DialogDescription>
      ) : null}
    </div>
  );
}
