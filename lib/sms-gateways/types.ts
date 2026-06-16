"use strict"

export type GatewayName = "infobip" | "smsglobal" | "easysendsms" | "telnyx"

export interface GatewayConfig {
  name: GatewayName
  enabled: boolean
  priority: number
  credentials: Record<string, string>
  endpoint?: string
  timeout?: number
}

export interface GatewayCredentials {
  infobip: {
    apiKey: string
    username: string
    baseUrl: string
  }
  smsglobal: {
    apiKey: string
    endpoint: string
  }
  easysendsms: {
    apiKey: string
    username: string
    endpoint: string
  }
  telnyx: {
    apiKey: string
    messagingProfileId: string
    endpoint: string
  }
}

export interface SMSPayload {
  to: string
  message: string
  from: string
  senderName?: string
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
  icon?: string
}

export const GATEWAY_PROVIDERS: Record<GatewayName, GatewayProvider> = {
  infobip: {
    name: "infobip",
    displayName: "Infobip",
    loginUrl: "https://www.infobip.com/login",
    signupUrl: "https://www.infobip.com/signup",
    documentationUrl: "https://www.infobip.com/docs/sms",
    credentialsRequired: ["apiKey", "username", "baseUrl"],
  },
  smsglobal: {
    name: "smsglobal",
    displayName: "SMSGlobal",
    loginUrl: "https://www.smsglobal.com/login",
    signupUrl: "https://www.smsglobal.com/signup",
    documentationUrl: "https://www.smsglobal.com/api-documentation",
    credentialsRequired: ["apiKey", "endpoint"],
  },
  easysendsms: {
    name: "easysendsms",
    displayName: "EasySendSMS",
    loginUrl: "https://www.easysendsms.com/login",
    signupUrl: "https://www.easysendsms.com/signup",
    documentationUrl: "https://www.easysendsms.com/api-docs",
    credentialsRequired: ["apiKey", "username", "endpoint"],
  },
  telnyx: {
    name: "telnyx",
    displayName: "Telnyx",
    loginUrl: "https://portal.telnyx.com/",
    signupUrl: "https://portal.telnyx.com/signup",
    documentationUrl: "https://developers.telnyx.com/docs/sms",
    credentialsRequired: ["apiKey", "messagingProfileId", "endpoint"],
  },
}
