import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const toneByStatus: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PUBLISHED: "success",
  ACTIVE: "success",
  VALID: "success",
  CONFIRMED: "success",
  PAID: "success",
  AVAILABLE: "success",
  CHECKED_IN: "success",
  DRAFT: "neutral",
  PENDING: "warning",
  PENDING_PAYMENT: "warning",
  UNPAID: "warning",
  PROCESSING: "warning",
  PAUSED: "warning",
  LIMITED: "warning",
  SOLD_OUT: "danger",
  CANCELLED: "danger",
  PAYMENT_FAILED: "danger",
  FAILED: "danger",
  EXPIRED: "danger",
  USED: "info",
  ENDED: "neutral",
  INACTIVE: "neutral",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant={toneByStatus[status] ?? "neutral"}
      className={cn(className)}
    >
      {label}
    </Badge>
  );
}
