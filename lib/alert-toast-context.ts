import { GatewayName, SendAttempt } from "./sms-gateways/types"

export type AlertToastType = "pending" | "attempting" | "success" | "failed" | "info"

export interface AlertToastState {
  id: string
  type: AlertToastType
  title: string
  description?: string
  currentAttempt?: {
    gateway: GatewayName
    index: number
    total: number
  }
  attempts?: SendAttempt[]
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

// Helper to format gateway display name
export function formatGatewayName(gateway: GatewayName): string {
  const names: Record<GatewayName, string> = {
    infobip: "Infobip",
    smsglobal: "SMSGlobal",
    easysendsms: "EasySendSMS",
    telnyx: "Telnyx",
  }
  return names[gateway] || gateway
}

// Helper to create attempt messages
export function createAttemptMessage(attempts: SendAttempt[]): string {
  const successful = attempts.filter((a) => a.status === "success")
  const failed = attempts.filter((a) => a.status === "failed")
  const pending = attempts.filter((a) => a.status === "pending")

  if (successful.length > 0) {
    return `Sent via ${formatGatewayName(successful[0].gateway)}`
  }

  if (failed.length > 0 && pending.length === 0) {
    return `Attempting fallback... (${failed.length} failed)`
  }

  if (pending.length > 0) {
    return `Retrying gateway... (${attempts.filter((a) => a.status !== "pending").length}/${attempts.length} attempted)`
  }

  return `Processing (${attempts.length} attempts)`
}
