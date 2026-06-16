import { NextRequest, NextResponse } from "next/server"
import { SMSGatewayManager, GatewayConfig, SMSPayload } from "@/lib/sms-gateways"

/**
 * POST /api/sms/send-with-gateways
 * Send SMS with automatic fallback through configured gateways
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, from, senderName, gatewayConfigs } = body

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, message" },
        { status: 400 }
      )
    }

    if (!gatewayConfigs || gatewayConfigs.length === 0) {
      return NextResponse.json(
        { error: "No SMS gateway configurations provided" },
        { status: 400 }
      )
    }

    // Initialize gateway manager with provided configs
    const manager = new SMSGatewayManager(gatewayConfigs as GatewayConfig[])

    // Prepare SMS payload
    const payload: SMSPayload = {
      to,
      message,
      from: from || "AlertMe",
      senderName: senderName || from || "AlertMe.",
    }

    // Send SMS with automatic fallback
    const result = await manager.send(payload)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[SMS Send Route] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send SMS",
        attempts: [],
      },
      { status: 500 }
    )
  }
}
