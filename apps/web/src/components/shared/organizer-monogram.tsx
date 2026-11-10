import { cn } from "@/lib/cn";

const palettes = [
  "bg-brand-soft text-brand-strong",
  "bg-lime text-on-lime",
  "bg-midnight text-paper",
  "bg-info/12 text-info",
];

export function OrganizerMonogram({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  const palette =
    palettes[
      [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
        palettes.length
    ];
  const dimensions =
    size === "sm"
      ? "size-9 text-xs"
      : size === "lg"
        ? "size-14 text-lg"
        : "size-11 text-sm";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl font-display font-semibold tracking-tight",
        dimensions,
        palette,
        className,
      )}
      aria-hidden
    >
      {initials || "EV"}
    </span>
  );
}
