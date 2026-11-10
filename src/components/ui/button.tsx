import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-on-brand hover:bg-brand-hover shadow-[0_10px_30px_-12px_rgba(115,87,246,0.7)]",
        secondary: "bg-ink text-canvas hover:bg-ink/90",
        outline:
          "border border-line bg-surface text-ink hover:border-ink/20 hover:bg-surface-subtle",
        ghost: "text-ink hover:bg-surface-subtle",
        destructive: "bg-danger text-white hover:bg-danger/90",
        lime: "bg-lime text-on-lime hover:bg-lime/90",
        link: "h-auto rounded-none p-0 text-brand-strong underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "size-11 rounded-full p-0",
        "icon-sm": "size-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    const disabledState = disabled || loading;
    return (
      <Slot
        className={cn(
          buttonVariants({ variant, size, className }),
          disabledState && "pointer-events-none opacity-45",
        )}
        aria-disabled={disabledState || undefined}
        aria-busy={loading || undefined}
        tabIndex={disabledState ? -1 : undefined}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
