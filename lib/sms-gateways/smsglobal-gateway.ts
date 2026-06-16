import { BaseGateway } from "./base-gateway"
import { GatewayResponse, SMSPayload } from "./types"

export class SMSGlobalGateway extends BaseGateway {
  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      if (!this.credentials.apiKey) {
        throw new Error("Missing SMSGlobal credentials: apiKey required")
      }

      const endpoint = this.credentials.endpoint || "https://api.smsglobal.com/http-api/send"
      const formattedPhone = this.formatPhoneNumber(payload.to)
      const senderName = this.sanitizeSenderName(payload.senderName || payload.from)

      const params = new URLSearchParams({
        key: this.credentials.apiKey,
        to: formattedPhone,
        from: senderName,
        text: payload.message,
      })

      const response = await this.makeRequest(`${endpoint}?${params.toString()}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`SMSGlobal API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.text()
      // SMSGlobal returns: success:messageId on success
      const isSuccess = data.startsWith("success:")
      
      if (!isSuccess) {
        throw new Error(`SMSGlobal error: ${data}`)
      }

      const messageId = data.split(":")?.[1] || undefined

      return {
        success: true,
        gatewayName: "smsglobal",
        messageId,
        statusCode: response.status,
        timestamp: Date.now(),
      }
    } catch (error) {
      return this.createErrorResponse(error as Error)
    }
  }
}
