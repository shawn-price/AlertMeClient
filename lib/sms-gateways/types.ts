"use strict"

export type GatewayName = "vartech"

export interface GatewayConfig {
  name: GatewayName
  enabled: boolean
  priority: number
  credentials: Record<string, string>
  settings?: {
    timeout?: number
    retryAttempts?: number
    retryDelayMs?: number
  }
}

export interface GatewayCredentials {
  vartech: {
    apiKey: string
    baseUrl: string
    senderId: string
  }
}

export interface SMSPayload {
  to: string
  message: string
  from: string
  senderName?: string
  customFields?: Record<string, any>
}

export interface GatewayResponse {
  success: boolean
  gatewayName: GatewayName
  messageId?: string
  error?: string
  statusCode?: number
  timestamp: number
}

export interface SendAttempt {
  gateway: GatewayName
  timestamp: number
  status: "pending" | "success" | "failed"
  error?: string
}

export interface FullSMSResponse {
  success: boolean
  messageId?: string
  attempts: SendAttempt[]
  finalGateway?: GatewayName
  error?: string
}

export interface GatewayProvider {
  name: GatewayName
  displayName: string
  loginUrl: string
  signupUrl: string
  documentationUrl: string
  credentialsRequired: string[]
  advancedSettings?: string[]
  icon?: string
}

export const GATEWAY_PROVIDERS: Record<GatewayName, GatewayProvider> = {
  vartech: {
    name: "vartech",
    displayName: "VarTech SMS",
    loginUrl: "https://sms.thevartech.com/login",
    signupUrl: "https://sms.thevartech.com/signup",
    documentationUrl: "https://sms.thevartech.com/api-doc",
    credentialsRequired: ["apiKey", "baseUrl", "senderId"],
    advancedSettings: ["timeout", "retryAttempts", "retryDelayMs"],
  },
}
