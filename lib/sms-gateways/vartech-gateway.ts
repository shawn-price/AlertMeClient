import { BaseGateway } from "./base-gateway"
import { GatewayResponse, SMSPayload } from "./types"

export class VartechGateway extends BaseGateway {
  private apiKey: string
  private baseUrl: string
  private senderId: string
  private retryAttempts: number
  private retryDelayMs: number

  constructor(name: "vartech", credentials: Record<string, string>, settings?: Record<string, any>) {
    super(name, credentials)
    this.apiKey = credentials.apiKey || ""
    this.baseUrl = credentials.baseUrl || "https://sms.thevartech.com/smsModule"
    this.senderId = credentials.senderId || "AlertMe"
    this.retryAttempts = settings?.retryAttempts || 3
    this.retryDelayMs = settings?.retryDelayMs || 1000
    this.timeout = settings?.timeout || 30000
  }

  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(payload.to)

      // VarTech smsModule API endpoint - new endpoint
      const url = `${this.baseUrl}/sms/send/singleMessage`
      
      // Build flexible payload that can be customized based on requirements
      const body = this.buildPayload(formattedPhone, payload)

      let lastError: Error | null = null

      // Retry logic for transient failures
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const response = await this.makeRequest(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
          })

          const data = await response.json()

          if (response.ok && (data.success || data.statusCode === 200 || data.code === "00")) {
            return {
              success: true,
              gatewayName: this.name,
              messageId: data.message_id || data.messageId || data.id || `vartech_${Date.now()}`,
              statusCode: response.status,
              timestamp: Date.now(),
            }
          }

          // Handle API-level errors
          if (!response.ok) {
            lastError = new Error(
              `VarTech API Error (${response.status}): ${data.message || data.description || "Unknown error"}`
            )

            // Retry only on 5xx errors or timeout-related issues
            if (response.status >= 500 && attempt < this.retryAttempts) {
              await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt))
              continue
            }

            break
          }

          // If response is ok but indicates failure, this is an application error
          lastError = new Error(data.message || data.description || "VarTech API returned failed status")
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          // Retry on network errors
          if (attempt < this.retryAttempts && this.isRetryableError(lastError)) {
            await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt))
            continue
          }

          break
        }
      }

      return this.createErrorResponse(lastError || new Error("Failed to send SMS"))
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Build the payload for singleMessage endpoint
   * Supports flexible payload structure that can be extended based on API requirements
   */
  private buildPayload(phoneNumber: string, payload: SMSPayload): Record<string, any> {
    // Core payload structure for singleMessage endpoint
    const body: Record<string, any> = {
      recipient: phoneNumber,
      senderName: payload.senderName || this.senderId,
      message: payload.message,
    }

    // Support dynamic payload fields passed through payload.customFields
    if (payload.customFields) {
      Object.assign(body, payload.customFields)
    }

    return body
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("network") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("500")
    )
  }
}
