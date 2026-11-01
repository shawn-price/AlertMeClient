"use client"

import { useEffect, useState } from "react"
import { AlertToastState } from "@/lib/alert-toast-context"
import { X, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react"

interface AlertToastProps {
  toast: AlertToastState
  onDismiss: () => void
}

export function AlertToast({ toast, onDismiss }: AlertToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (toast.type === "success" && toast.duration !== 0) {
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300)
      }, toast.duration || 4000)

      return () => clearTimeout(timeout)
    }
  }, [toast, onDismiss])

  if (!isVisible) return null

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      case "attempting":
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin" />
      case "info":
        return <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
      default:
        return null
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "failed":
        return "bg-red-50 border-red-200"
      case "attempting":
      case "pending":
        return "bg-blue-50 border-blue-200"
      case "info":
        return "bg-muted/50 border-border"
      default:
        return "bg-card border-border"
    }
  }

  return (
    <div
      className={`relative rounded-lg border p-4 shadow-md transition-all duration-300 animate-in slide-in-from-right-2 ${getBgColor()}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{toast.title}</h3>

          {toast.description && <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>}

          {/* Action button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {(toast.dismissible !== false || toast.type === "failed") && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-muted-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
