import { cn } from "@/lib/cn";

export function TableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn(
        "w-full min-w-[680px] border-collapse text-left text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-line bg-surface-subtle/70", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("transition-colors hover:bg-surface-subtle/60", className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("px-4 py-3.5 align-middle text-ink", className)}
      {...props}
    />
  );
}
