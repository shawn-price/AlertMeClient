import { type NextRequest, NextResponse } from "next/server"
import { VartechGateway } from "@/lib/sms-gateways/vartech-gateway"
import { rateLimit, requestKeyFromHeaders } from "@/lib/rate-limiter"
import { validateBeneficiaryPhone } from "@/lib/platform-phone-config"

export async function POST(request: NextRequest) {
  try {
    // Simple in-memory rate limiting (per-IP)
    const key = requestKeyFromHeaders(request.headers)
    const rl = rateLimit(key)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } }
      )
    }

    const body = await request.json()
    const { to, message, type } = body

    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, message",
          details: "Both 'to' and 'message' fields are required to send an SMS.",
        },
        { status: 400 }
      )
    }

    // Validate phone number format
    // Accept various formats: +234XXX, 0XXX, or just 234XXX
    const phoneRegex = /^(\+234|234|0)?[0-9]{10,}$/
    const cleanedPhone = String(to).replace(/\s+/g, "")
    
    if (!phoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number format",
          details: "Phone number must be in format: +234XXXXXXXXXX, 0XXXXXXXXXX, or 234XXXXXXXXXX (Nigerian numbers only)",
          received: to,
        },
        { status: 400 }
      )
    }

    // Get VarTech credentials from environment variables
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/smsModule"
    const senderId = process.env.VARTECH_SENDER_ID || "AlertMe"

    // Check if VarTech is configured
    const isConfigured = apiKey && baseUrl

    // Demo mode: Only active if explicitly enabled
    const isDemoMode = process.env.SMS_DEMO_MODE === "true"

    if (isDemoMode) {
      // Generate a mock message ID
      const mockMessageId = `DEMO_${Date.now()}_${Math.random().toString(36).substring(7)}`

      console.log(`[DEMO MODE] SMS simulated successfully: ${mockMessageId}`)
      console.log(`[DEMO MODE] To: ${to}, Message: ${message.substring(0, 50)}...`)

      return NextResponse.json({
        success: true,
        messageId: mockMessageId,
        status: "demo",
        type: type || "general",
        demo: true,
        details: "SMS sent in demo mode",
      })
    }

    // Validate VarTech credentials for production
    if (!isConfigured) {
      console.error("VarTech credentials not configured for production")
      return NextResponse.json(
        {
          success: false,
          error: "SMS service not configured",
          details:
            "VarTech credentials are missing. Please set VARTECH_API_KEY and VARTECH_BASE_URL environment variables, or set SMS_DEMO_MODE=true for testing.",
        },
        { status: 500 }
      )
    }

    // Validate VarTech credentials
    if (!apiKey || !baseUrl) {
      console.error("VarTech credentials not configured")
      return NextResponse.json(
        {
          success: false,
          error: "SMS service not configured",
          details:
            "VarTech credentials are missing or invalid. Please check your environment variables or set SMS_DEMO_MODE=true.",
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

    // Send SMS via VarTech
    const response = await gateway.send({
      to,
      message,
      from: senderId,
      senderName: senderId,
    })

    if (response.success) {
      console.log(`[VarTech] SMS sent successfully: ${response.messageId}`)
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        status: "sent",
        type: type || "general",
      })
    } else {
      console.error(`[VarTech] SMS send failed:`, response.error)
      return NextResponse.json(
        {
          success: false,
          error: response.error || "Failed to send SMS",
          details: "An error occurred while sending the SMS via VarTech. Please try again later.",
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error("[VarTech] SMS Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send SMS"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: "An error occurred while sending the SMS. Please try again later.",
      },
      { status: 500 }
    )
  }
}
