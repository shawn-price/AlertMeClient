import { BaseGateway } from "./base-gateway"
import { GatewayResponse, SMSPayload } from "./types"

export class TelnyxGateway extends BaseGateway {
  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      if (!this.credentials.apiKey || !this.credentials.messagingProfileId) {
        throw new Error("Missing Telnyx credentials: apiKey and messagingProfileId required")
      }

      const endpoint = this.credentials.endpoint || "https://api.telnyx.com/v2/messages"
      const formattedPhone = this.formatPhoneNumber(payload.to)
      const senderName = this.sanitizeSenderName(payload.senderName || payload.from)

      const requestBody = {
        from: senderName,
        to: `+${formattedPhone}`,
        text: payload.message,
        messaging_profile_id: this.credentials.messagingProfileId,
        type: "SMS",
      }

      const response = await this.makeRequest(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any
        const errorMsg = errorData?.errors?.[0]?.detail || response.statusText
        throw new Error(`Telnyx API error: ${response.status} - ${errorMsg}`)
      }

      const data = (await response.json()) as any
      const messageId = data.data?.id

      return {
        success: true,
        gatewayName: "telnyx",
        messageId,
        statusCode: response.status,
        timestamp: Date.now(),
      }
    } catch (error) {
      return this.createErrorResponse(error as Error)
    }
  }
}
