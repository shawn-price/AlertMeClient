import { NextRequest, NextResponse } from "next/server"
import { VartechGateway } from "@/lib/sms-gateways/vartech-gateway"

/**
 * POST /api/sms/test
 * Test the VarTech SMS gateway with a test message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json({ error: "Missing required field: phoneNumber" }, { status: 400 })
    }

    // Get VarTech credentials from environment variables
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api"
    const senderId = process.env.VARTECH_SENDER_ID || "AlertMe"

    // Check if VarTech is configured
    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "VarTech SMS service not configured",
          details: "Please configure VARTECH_API_KEY and VARTECH_BASE_URL environment variables",
        },
        { status: 500 }
      )
    }

    // Initialize VarTech gateway
    const gateway = new VartechGateway("vartech", {
      apiKey,
      baseUrl,
      senderId,
    })

    // Send test SMS
    const response = await gateway.send({
      to: phoneNumber,
      message: "Test SMS from AlertMe. If you received this, the VarTech SMS gateway is working correctly.",
      from: senderId,
      senderName: senderId,
    })

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully",
        messageId: response.messageId,
        phoneNumber,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.error || "Failed to send test SMS",
        },
        { status: 500 }
      )
    }
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
