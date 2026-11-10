import { cn } from "@/lib/cn";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-sm font-medium text-ink"
        >
          {label}
          {required ? (
            <span className="text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
