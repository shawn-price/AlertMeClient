import { GatewayName, GatewayResponse, SMSPayload } from "./types"

export abstract class BaseGateway {
  protected name: GatewayName
  protected credentials: Record<string, string>
  protected timeout: number = 10000

  constructor(name: GatewayName, credentials: Record<string, string>, timeout?: number) {
    this.name = name
    this.credentials = credentials
    if (timeout) this.timeout = timeout
  }

  abstract send(payload: SMSPayload): Promise<GatewayResponse>

  protected async makeRequest(
    url: string,
    options: RequestInit,
    timeout: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  protected sanitizeSenderName(bankName: string): string {
    // Remove non-alphanumeric characters, keep spaces and dots
    const sanitized = bankName.replace(/[^a-zA-Z0-9\s.]/g, "").trim()
    // Take first 11 chars to leave room for the dot
    const truncated = sanitized.substring(0, 11)
    // Return with trailing dot
    return `${truncated}.`
  }

  protected formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "")
    // If it starts with 0 (Nigeria), replace with 234
    if (digitsOnly.startsWith("0")) {
      return `234${digitsOnly.substring(1)}`
    }
    // If it doesn't start with country code, assume Nigeria
    if (!digitsOnly.startsWith("234")) {
      return `234${digitsOnly}`
    }
    return digitsOnly
  }

  protected createErrorResponse(error: Error): GatewayResponse {
    return {
      success: false,
      gatewayName: this.name,
      error: error.message,
      timestamp: Date.now(),
    }
  }
}
