"use strict"

import { generateFormattedDebitAlert, generateFormattedCreditAlert } from "@/lib/alert-templates"
import { actionLogger } from "@/lib/action-logger"

export interface TransactionAlertPayload {
  type: "debit" | "credit"
  senderName: string
  senderBank: string
  senderPhone?: string
  recipientName: string
  recipientBank: string
  recipientPhone: string
  recipientAccountNumber?: string
  amount: number
  balance: number
  reference: string
  narration?: string
  timestamp?: string
}

export interface AlertSendResult {
  success: boolean
  messageId?: string
  smsStatus: "sent" | "failed" | "pending"
  error?: string
  debitAlertSent?: boolean
  creditAlertSent?: boolean
  debitMessageId?: string
  creditMessageId?: string
}

/**
 * Production alert service for sending transaction notifications via SMS
 * Sends both debit and credit alerts for transactions
 */
export class ProductionAlertService {
  private static readonly SMS_API_ENDPOINT = "/api/sms/send"

  /**
   * Send transaction alert via SMS
   * For debit: Sends alert to sender's phone
   * For credit: Sends alert to receiver's phone
   */
  static async sendTransactionAlert(payload: TransactionAlertPayload): Promise<AlertSendResult> {
    const result: AlertSendResult = {
      success: false,
      smsStatus: "pending",
      debitAlertSent: false,
      creditAlertSent: false,
    }

    try {
      // Generate formatted alerts
      const debitAlert = generateFormattedDebitAlert(
        payload.amount,
        payload.senderBank,
        payload.recipientName,
        payload.recipientPhone,
        payload.recipientAccountNumber,
        payload.balance,
        payload.reference,
        payload.senderBank
      )

      const creditAlert = generateFormattedCreditAlert(
        payload.amount,
        payload.senderName,
        payload.senderBank,
        payload.balance,
        payload.reference,
        payload.recipientBank
      )

      // Send debit alert to sender
      if (payload.senderPhone) {
        try {
          const debitResponse = await this.sendSMS(payload.senderPhone, debitAlert, "debit")
          if (debitResponse.success) {
            result.debitAlertSent = true
            result.debitMessageId = debitResponse.messageId
            console.log(`[ProductionAlert] Debit alert sent to ${payload.senderPhone}:`, debitResponse.messageId)

            if (actionLogger) {
              actionLogger.log("Debit Alert Sent", "success", "success", {
                recipient: payload.senderPhone,
                messageId: debitResponse.messageId,
                amount: payload.amount,
              })
            }
          } else {
            console.error(`[ProductionAlert] Failed to send debit alert:`, debitResponse.error)
            if (actionLogger) {
              actionLogger.logError("Debit Alert Failed", new Error(debitResponse.error || "Unknown error"), {
                recipient: payload.senderPhone,
              })
            }
          }
        } catch (error) {
          console.error(`[ProductionAlert] Error sending debit alert:`, error)
        }
      }

      // Send credit alert to receiver
      if (payload.recipientPhone) {
        try {
          const creditResponse = await this.sendSMS(payload.recipientPhone, creditAlert, "credit")
          if (creditResponse.success) {
            result.creditAlertSent = true
            result.creditMessageId = creditResponse.messageId
            console.log(`[ProductionAlert] Credit alert sent to ${payload.recipientPhone}:`, creditResponse.messageId)

            if (actionLogger) {
              actionLogger.log("Credit Alert Sent", "success", "success", {
                recipient: payload.recipientPhone,
                messageId: creditResponse.messageId,
                amount: payload.amount,
              })
            }
          } else {
            console.error(`[ProductionAlert] Failed to send credit alert:`, creditResponse.error)
            if (actionLogger) {
              actionLogger.logError("Credit Alert Failed", new Error(creditResponse.error || "Unknown error"), {
                recipient: payload.recipientPhone,
              })
            }
          }
        } catch (error) {
          console.error(`[ProductionAlert] Error sending credit alert:`, error)
        }
      }

      // Determine overall result
      result.success = result.debitAlertSent || result.creditAlertSent
      result.smsStatus = result.success ? "sent" : "failed"

      return result
    } catch (error) {
      console.error("[ProductionAlert] Unexpected error:", error)
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.smsStatus = "failed"

      if (actionLogger) {
        actionLogger.logError("Transaction Alert Service Error", error as Error)
      }

      return result
    }
  }

  /**
   * Send a single SMS message
   */
  private static async sendSMS(
    to: string,
    message: string,
    type: string
  ): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const response = await fetch(this.SMS_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          message,
          type,
        }),
      })

      // Get response text first to handle HTML error pages
      const responseText = await response.text()

      let data: Record<string, any>
      try {
        data = JSON.parse(responseText)
      } catch {
        // If response is not JSON (likely HTML error page), return generic error
        console.error(`[ProductionAlert] Non-JSON response from SMS API:`, responseText.substring(0, 100))
        return {
          success: false,
          error: `API Error: HTTP ${response.status}`,
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: data.success || false,
        messageId: data.messageId,
        error: data.error,
      }
    } catch (error) {
      console.error(`[ProductionAlert] SMS API error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  /**
   * Send immediate notification SMS
   */
  static async sendNotificationSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    return this.sendSMS(to, message, "notification")
  }

  /**
   * Send business card SMS
   */
  static async sendBusinessCardSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    return this.sendSMS(to, message, "business-card")
  }

  /**
   * Send verification code SMS
   */
  static async sendVerificationSMS(to: string, code: string): Promise<{ success: boolean; messageId?: string }> {
    const message = `Your AlertMe verification code is: ${code}. Do not share this code with anyone.`
    return this.sendSMS(to, message, "verification")
  }
}

// Export singleton instance
export const productionAlerts = ProductionAlertService
