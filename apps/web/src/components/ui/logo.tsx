import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

type LogoVariant = "auto" | "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

const fullLogoHeight: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-9 sm:h-10",
  lg: "h-11 sm:h-12",
};

const markSize: Record<LogoSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
};

export function Logo({
  className,
  variant = "auto",
  invert = false,
  compact = false,
  priority = false,
  size = "md",
}: {
  className?: string;
  variant?: LogoVariant;
  /** Backwards-compatible alias for a dark background. */
  invert?: boolean;
  compact?: boolean;
  priority?: boolean;
  size?: LogoSize;
}) {
  const resolved = invert ? "dark" : variant;
  const imageClass = cn(
    "w-auto transition-transform duration-300 group-hover:scale-[1.02]",
    fullLogoHeight[size],
  );

  if (compact) {
    return (
      <Link
        href="/"
        className={cn(
          "group inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
          className,
        )}
        aria-label={brand.homeLabel}
      >
        <Image
          src={brand.assets.mark}
          alt=""
          width={1305}
          height={1205}
          priority={priority}
          className={cn(
            "rounded-xl drop-shadow-[0_8px_18px_rgba(115,87,246,0.35)]",
            markSize[size],
          )}
        />
      </Link>
    );
  }

  const lightImage = (
    <Image
      src={brand.assets.lightLogo}
      alt={brand.logoAlt}
      width={2172}
      height={724}
      priority={priority}
      className={cn(imageClass, resolved === "auto" && "dark:hidden")}
    />
  );

  const darkImage = (
    <Image
      src={brand.assets.darkLogo}
      alt={brand.logoAlt}
      width={2172}
      height={724}
      priority={priority}
      className={cn(
        imageClass,
        resolved === "auto" ? "hidden dark:block" : "block",
      )}
    />
  );

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
        className,
      )}
    >
      {resolved === "auto" || resolved === "light" ? lightImage : null}
      {resolved === "auto" || resolved === "dark" ? darkImage : null}
    </Link>
  );
}
