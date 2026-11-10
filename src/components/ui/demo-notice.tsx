import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

export function DemoNotice({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs leading-relaxed",
        tone === "dark"
          ? "border-white/10 bg-white/5 text-paper/70"
          : "border-line bg-surface-subtle text-muted",
        className,
      )}
    >
      <FlaskConical
        className="mt-0.5 size-4 shrink-0 text-brand-strong"
        aria-hidden
      />
      <p>{children}</p>
    </div>
  );
}
