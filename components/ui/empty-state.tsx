import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/**
 * Shared empty-state pattern: explains what is missing and what the user
 * can do next, per the UI Context feedback-state requirements.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-10",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5 touch-target" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
