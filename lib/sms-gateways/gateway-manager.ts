import { BaseGateway } from "./base-gateway"
import { VartechGateway } from "./vartech-gateway"
import { GatewayName, GatewayConfig, SMSPayload, FullSMSResponse, SendAttempt } from "./types"

export class SMSGatewayManager {
  private gateways: Map<GatewayName, BaseGateway> = new Map()
  private configs: GatewayConfig[] = []

  constructor(configs: GatewayConfig[]) {
    this.configs = configs.sort((a, b) => a.priority - b.priority)
    this.initializeGateways()
  }

  private initializeGateways() {
    const configMap = new Map(this.configs.map((c) => [c.name, c]))

    // Initialize VarTech gateway instance
    const vartechConfig = configMap.get("vartech")
    this.gateways.set(
      "vartech",
      new VartechGateway("vartech", vartechConfig?.credentials || {}, vartechConfig?.settings)
    )
  }

  /**
   * Send SMS with automatic fallback through configured gateways in priority order
   */
  async send(payload: SMSPayload): Promise<FullSMSResponse> {
    const attempts: SendAttempt[] = []
    const enabledConfigs = this.configs.filter((c) => c.enabled)

    if (enabledConfigs.length === 0) {
      return {
        success: false,
        attempts,
        error: "No SMS gateways enabled",
      }
    }

    for (const config of enabledConfigs) {
      const gateway = this.gateways.get(config.name)
      if (!gateway) continue

      const attempt: SendAttempt = {
        gateway: config.name,
        timestamp: Date.now(),
        status: "pending",
      }
      attempts.push(attempt)

      try {
        const response = await gateway.send(payload)

        if (response.success) {
          attempt.status = "success"
          return {
            success: true,
            messageId: response.messageId,
            attempts,
            finalGateway: config.name,
          }
        } else {
          attempt.status = "failed"
          attempt.error = response.error
        }
      } catch (error) {
        attempt.status = "failed"
        attempt.error = error instanceof Error ? error.message : "Unknown error"
      }

      // Log attempt for debugging
      console.log(`[SMS] ${config.name} attempt: ${attempt.status}`, attempt.error || "")
    }

    // All gateways failed
    return {
      success: false,
      attempts,
      error: `All SMS gateways failed. Last error: ${attempts[attempts.length - 1]?.error || "Unknown"}`,
    }
  }

  /**
   * Test a specific gateway
   */
  async testGateway(gatewayName: GatewayName, testPhoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const gateway = this.gateways.get(gatewayName)
    if (!gateway) {
      return { success: false, error: `Gateway ${gatewayName} not found` }
    }

    try {
      const response = await gateway.send({
        to: testPhoneNumber,
        from: "AlertMe",
        message: "This is a test message from AlertMe. If you received this, SMS gateway is working correctly.",
        senderName: "AlertMe.",
      })

      return {
        success: response.success,
        error: response.error,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Update gateway configuration
   */
  updateConfig(configs: GatewayConfig[]) {
    this.configs = configs.sort((a, b) => a.priority - b.priority)
    this.initializeGateways()
  }

  /**
   * Get current gateway configurations
   */
  getConfigs(): GatewayConfig[] {
    return [...this.configs]
  }
}

// Global instance
let globalManager: SMSGatewayManager | null = null

export function initializeGatewayManager(configs: GatewayConfig[]): SMSGatewayManager {
  globalManager = new SMSGatewayManager(configs)
  return globalManager
}

export function getGatewayManager(): SMSGatewayManager {
  if (!globalManager) {
    // Default configuration if not initialized
    globalManager = new SMSGatewayManager([])
  }
  return globalManager
}
