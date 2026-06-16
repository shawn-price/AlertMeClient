import { BaseGateway } from "./base-gateway"
import { GatewayResponse, SMSPayload } from "./types"

export class EasySendSMSGateway extends BaseGateway {
  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      if (!this.credentials.apiKey || !this.credentials.username) {
        throw new Error("Missing EasySendSMS credentials: apiKey and username required")
      }

      const endpoint = this.credentials.endpoint || "https://www.easysendsms.com/api/bulk-sms"
      const formattedPhone = this.formatPhoneNumber(payload.to)
      const senderName = this.sanitizeSenderName(payload.senderName || payload.from)

      const requestBody = new URLSearchParams({
        username: this.credentials.username,
        api_key: this.credentials.apiKey,
        to: formattedPhone,
        message: payload.message,
        sender: senderName,
      })

      const response = await this.makeRequest(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      })

      if (!response.ok) {
        throw new Error(`EasySendSMS API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json() as any

      // EasySendSMS returns: { success: 1, message_id: "xxx" } on success
      if (!data.success) {
        throw new Error(`EasySendSMS error: ${data.error || "Unknown error"}`)
      }

      return {
        success: true,
        gatewayName: "easysendsms",
        messageId: data.message_id || data.id,
        statusCode: response.status,
        timestamp: Date.now(),
      }
    } catch (error) {
      return this.createErrorResponse(error as Error)
    }
  }
}
