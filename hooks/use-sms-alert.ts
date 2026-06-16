import { useCallback } from "react"
import { useAlertToast } from "@/components/alert-toast-provider"
import { dataStore } from "@/lib/data-store"
import { SendAttempt } from "@/lib/sms-gateways/types"
import { formatGatewayName } from "@/lib/alert-toast-context"

export interface SendSMSAlertOptions {
  to: string
  message: string
  senderBankName?: string
  recipientBank?: string
  showProgress?: boolean
}

export function useSMSAlert() {
  const { showAlertToast, updateAlertToast } = useAlertToast()

  const sendAlert = useCallback(
    async (options: SendSMSAlertOptions) => {
      const { to, message, senderBankName = "AlertMe", recipientBank = "Bank", showProgress = true } = options

      // Format sender name: alphanumeric bank name + dot
      const sanitizeSenderName = (name: string): string => {
        const sanitized = name.replace(/[^a-zA-Z0-9\s.]/g, "").trim()
        const truncated = sanitized.substring(0, 11)
        return `${truncated}.`
      }

      const senderName = sanitizeSenderName(recipientBank || senderBankName)

      // Show initial pending toast
      let toastId: string | null = null

      if (showProgress) {
        toastId = showAlertToast({
          type: "pending",
          title: "Sending transaction alert...",
          description: `Preparing to send SMS via configured gateways`,
          dismissible: false,
        })
      }

      try {
        // Get SMS gateway configurations
        const configs = dataStore.getSMSGatewayConfigs?.()
        if (!configs || configs.length === 0) {
          if (toastId) {
            updateAlertToast(toastId, {
              type: "failed",
              title: "SMS gateway not configured",
              description: "Please configure SMS gateways in settings",
            })
          }
          return { success: false, error: "No SMS gateways configured" }
        }

        const enabledConfigs = configs.filter((c) => c.enabled)
        if (enabledConfigs.length === 0) {
          if (toastId) {
            updateAlertToast(toastId, {
              type: "failed",
              title: "No active SMS gateways",
              description: "Please enable at least one SMS gateway in settings",
            })
          }
          return { success: false, error: "No SMS gateways enabled" }
        }

        // Update toast to show we're sending
        if (toastId && showProgress) {
          updateAlertToast(toastId, {
            type: "attempting",
            title: "Sending transaction alert...",
            description: `Attempting to send via ${enabledConfigs.length} gateway(s)`,
            currentAttempt: {
              gateway: enabledConfigs[0].name,
              index: 0,
              total: enabledConfigs.length,
            },
            attempts: [],
          })
        }

        // Send SMS via API with gateway configurations
        const response = await fetch("/api/sms/send-with-gateways", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            message,
            from: senderBankName,
            senderName,
            gatewayConfigs: enabledConfigs,
          }),
        })

        const result = await response.json()

        if (toastId && showProgress) {
          if (result.success) {
            const successAttempt = result.attempts?.find((a: SendAttempt) => a.status === "success")
            updateAlertToast(toastId, {
              type: "success",
              title: "Alert sent successfully",
              description: `Transaction alert sent via ${successAttempt ? formatGatewayName(successAttempt.gateway) : "SMS gateway"}`,
              attempts: result.attempts || [],
              duration: 4000,
            })
          } else {
            updateAlertToast(toastId, {
              type: "failed",
              title: "Failed to send alert",
              description: result.error || "All SMS gateways failed",
              attempts: result.attempts || [],
            })
          }
        }

        return result
      } catch (error) {
        if (toastId && showProgress) {
          updateAlertToast(toastId, {
            type: "failed",
            title: "Error sending alert",
            description: error instanceof Error ? error.message : "An unknown error occurred",
          })
        }
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      }
    },
    [showAlertToast, updateAlertToast]
  )

  return { sendAlert }
}
