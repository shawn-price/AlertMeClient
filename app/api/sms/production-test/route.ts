import { NextRequest, NextResponse } from "next/server"
import { productionAlerts } from "@/lib/production-alerts"

/**
 * POST /api/sms/production-test
 * Test production SMS alert sending with real VarTech credentials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, testType = "transaction" } = body

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: phoneNumber",
        },
        { status: 400 }
      )
    }

    // Verify VarTech credentials are configured
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "VarTech credentials not configured",
          details:
            "VARTECH_API_KEY and VARTECH_BASE_URL environment variables are required for production SMS.",
        },
        { status: 500 }
      )
    }

    let result

    switch (testType) {
      case "transaction":
        // Send test transaction alert
        result = await productionAlerts.sendTransactionAlert({
          type: "debit",
          senderName: "Test User",
          senderBank: "Ecobank",
          senderPhone: phoneNumber,
          recipientName: "Test Recipient",
          recipientBank: "Ecobank",
          recipientPhone: phoneNumber,
          recipientAccountNumber: "0812345678",
          amount: 5000,
          balance: 95000,
          reference: `TEST-${Date.now()}`,
          narration: "Test Transaction Alert",
          timestamp: new Date().toISOString(),
        })
        break

      case "notification":
        // Send test notification
        result = await productionAlerts.sendNotificationSMS(
          phoneNumber,
          "🔔 Test Notification from AlertMe - SMS gateway is working correctly!"
        )
        result = {
          success: (result as any).success,
          messageId: (result as any).messageId,
          smsStatus: (result as any).success ? "sent" : "failed",
        }
        break

      case "verification":
        // Send test verification code
        result = await productionAlerts.sendVerificationSMS(phoneNumber, "123456")
        result = {
          success: (result as any).success,
          messageId: (result as any).messageId,
          smsStatus: (result as any).success ? "sent" : "failed",
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown test type: ${testType}`,
            availableTypes: ["transaction", "notification", "verification"],
          },
          { status: 400 }
        )
    }

    if (result.success || (result as any).smsStatus === "sent") {
      return NextResponse.json({
        success: true,
        message: `Production SMS test sent successfully (${testType})`,
        result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test SMS",
          result,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Production SMS Test] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
