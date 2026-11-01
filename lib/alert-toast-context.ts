export type AlertToastType = "pending" | "attempting" | "success" | "failed" | "info"

export interface AlertToastState {
  id: string
  type: AlertToastType
  title: string
  description?: string
  progress?: number
  dismissible?: boolean
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface AlertToastContextType {
  toasts: AlertToastState[]
  showAlertToast: (options: Omit<AlertToastState, "id">) => string
  updateAlertToast: (id: string, updates: Partial<AlertToastState>) => void
  dismissAlertToast: (id: string) => void
  clearAllToasts: () => void
}

// Helper to generate unique IDs
export function generateToastId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
