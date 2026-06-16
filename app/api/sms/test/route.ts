import { NextRequest, NextResponse } from "next/server"
import { SMSGatewayManager, GatewayConfig, GatewayName } from "@/lib/sms-gateways"

/**
 * POST /api/sms/test
 * Test a specific SMS gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gateway, phoneNumber, gatewayConfigs } = body

    // Validate required fields
    if (!gateway || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: gateway, phoneNumber" },
        { status: 400 }
      )
    }

    if (!gatewayConfigs || gatewayConfigs.length === 0) {
      return NextResponse.json(
        { error: "No SMS gateway configurations provided" },
        { status: 400 }
      )
    }

    // Initialize gateway manager
    const manager = new SMSGatewayManager(gatewayConfigs as GatewayConfig[])

    // Test the specific gateway
    const result = await manager.testGateway(gateway as GatewayName, phoneNumber)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[SMS Test Route] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to test gateway",
      },
      { status: 500 }
    )
  }
}
