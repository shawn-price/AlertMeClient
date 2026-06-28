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
    this.baseUrl = credentials.baseUrl || "https://sms.thevartech.com/api"
    this.senderId = credentials.senderId || "AlertMe"
    this.retryAttempts = settings?.retryAttempts || 3
    this.retryDelayMs = settings?.retryDelayMs || 1000
    this.timeout = settings?.timeout || 30000
  }

  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(payload.to)

      // VarTech API endpoint and payload structure based on documentation
      const url = `${this.baseUrl}/send`
      const body = {
        recipient: formattedPhone,
        sender_id: payload.senderName || this.senderId,
        message: payload.message,
      }

      let lastError: Error | null = null

      // Retry logic for transient failures
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          console.log(`[VarTech] Attempt ${attempt}/${this.retryAttempts}: Sending to ${formattedPhone}`)
          console.log(`[VarTech] Request URL: ${url}`)
          console.log(`[VarTech] Request headers: Content-Type: application/json, Authorization: Bearer [REDACTED]`)

          const response = await this.makeRequest(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
          })

          console.log(`[VarTech] Response status: ${response.status} ${response.statusText}`)
          console.log(`[VarTech] Response headers: Content-Type: ${response.headers.get("content-type")}`)

          // Validate content-type before parsing as JSON
          const contentType = response.headers.get("content-type") || ""
          const isJsonResponse = contentType.includes("application/json")

          let data: any = null
          let responseText = ""

          if (isJsonResponse) {
            try {
              data = await response.json()
              console.log(`[VarTech] Parsed JSON response:`, data)
            } catch (parseError) {
              responseText = await response.text()
              console.error(
                `[VarTech] Failed to parse JSON despite content-type header. Raw response (first 500 chars): ${responseText.substring(0, 500)}`
              )
              throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
            }
          } else {
            // Response is not JSON - likely HTML error page
            responseText = await response.text()
            console.error(
              `[VarTech] API returned non-JSON response (Content-Type: ${contentType}). Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`
            )

            const errorMsg = `VarTech API returned ${contentType || "unknown content-type"} instead of JSON (HTTP ${response.status}). This typically indicates a server error or misconfigured endpoint.`
            lastError = new Error(errorMsg)

            // Retry on 5xx errors
            if (response.status >= 500 && attempt < this.retryAttempts) {
              console.log(`[VarTech] Retrying after ${this.retryDelayMs * attempt}ms due to server error`)
              await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt))
              continue
            }

            break
          }

          // At this point we have valid JSON
          if (response.ok && data.success) {
            console.log(`[VarTech] Success response: messageId = ${data.message_id || data.id}`)
            return {
              success: true,
              gatewayName: this.name,
              messageId: data.message_id || data.id || `vartech_${Date.now()}`,
              statusCode: response.status,
              timestamp: Date.now(),
            }
          }

          // Handle API-level errors (non-2xx status or success: false)
          if (!response.ok) {
            lastError = new Error(
              `VarTech API Error (${response.status}): ${data.message || data.error || "Unknown error"}`
            )
            console.error(`[VarTech] API error:`, lastError.message)

            // Retry only on 5xx errors or timeout-related issues
            if (response.status >= 500 && attempt < this.retryAttempts) {
              console.log(`[VarTech] Retrying after ${this.retryDelayMs * attempt}ms due to server error (${response.status})`)
              await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt))
              continue
            }

            break
          }

          // If response is ok but success is false, this is an application error
          lastError = new Error(data.message || data.error || "VarTech API returned false success")
          console.error(`[VarTech] Application error:`, lastError.message)
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          console.error(`[VarTech] Exception on attempt ${attempt}:`, lastError.message)

          // Retry on network errors
          if (attempt < this.retryAttempts && this.isRetryableError(lastError)) {
            console.log(`[VarTech] Retrying after ${this.retryDelayMs * attempt}ms due to retryable error`)
            await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt))
            continue
          }

          break
        }
      }

      console.error(`[VarTech] Failed after ${this.retryAttempts} attempts. Final error: ${lastError?.message}`)
      return this.createErrorResponse(lastError || new Error("Failed to send SMS"))
    } catch (error) {
      const finalError = error instanceof Error ? error : new Error(String(error))
      console.error(`[VarTech] Unexpected error in send():`, finalError.message)
      return this.createErrorResponse(finalError)
    }
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
