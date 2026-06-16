import { BaseGateway } from "./base-gateway"
import { GatewayResponse, SMSPayload } from "./types"

export class InfobipGateway extends BaseGateway {
  async send(payload: SMSPayload): Promise<GatewayResponse> {
    try {
      if (!this.credentials.apiKey || !this.credentials.baseUrl) {
        throw new Error("Missing Infobip credentials: apiKey and baseUrl required")
      }

      const baseUrl = this.credentials.baseUrl.replace(/\/$/, "") // Remove trailing slash
      const url = `${baseUrl}/sms/2/text/advanced`

      const formattedPhone = this.formatPhoneNumber(payload.to)
      const senderName = payload.senderName || payload.from

      const requestBody = {
        messages: [
          {
            destinations: [
              {
                to: formattedPhone,
              },
            ],
            from: senderName,
            text: payload.message,
          },
        ],
      }

      const response = await this.makeRequest(url, {
        method: "POST",
        headers: {
          Authorization: `App ${this.credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Infobip API error: ${response.status} - ${errorData?.requestError?.serviceException?.messageId || response.statusText}`)
      }

      const data = (await response.json()) as any
      const messageId = data.messages?.[0]?.messageId

      return {
        success: true,
        gatewayName: "infobip",
        messageId,
        statusCode: response.status,
        timestamp: Date.now(),
      }
    } catch (error) {
      return this.createErrorResponse(error as Error)
    }
  }
}
