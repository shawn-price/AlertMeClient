import { type NextRequest, NextResponse } from "next/server"
import { VartechGateway } from "@/lib/sms-gateways/vartech-gateway"
import { rateLimit, requestKeyFromHeaders } from "@/lib/rate-limiter"

/**
 * Send Business Card via SMS
 *
 * Request body:
 * - to: recipient phone number
 * - bank: selected bank name
 * - email: sender's email
 * - phone: sender's phone
 */
export async function POST(request: NextRequest) {
  try {
    const key = requestKeyFromHeaders(request.headers)
    const rl = rateLimit(key)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } }
      )
    }

    const body = await request.json()
    const { to, bank, email, phone } = body

    // Validate required fields
    if (!to || !bank) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, bank",
          details: "Both 'to' and 'bank' fields are required to send a business card.",
        },
        { status: 400 }
      )
    }

    // Get VarTech credentials
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api"
    const senderId = process.env.VARTECH_SENDER_ID || "AlertMe"

    // Validate VarTech credentials
    if (!apiKey || !baseUrl) {
      console.error("VarTech credentials not configured")
      return NextResponse.json(
        {
          success: false,
          error: "SMS service not configured",
          details: "VarTech credentials are missing or invalid. Please check your environment variables.",
        },
        { status: 500 }
      )
    }

    // Format business card message
    const businessCardMessage = `
BUSINESS CARD
━━━━━━━━━━━━━━━
Bank: ${bank}
${email ? `Email: ${email}` : ""}
${phone ? `Phone: ${phone}` : ""}
━━━━━━━━━━━━━━━
Shared via AlertMe
`.trim()

    // Initialize VarTech gateway
    const gateway = new VartechGateway("vartech", {
      apiKey,
      baseUrl,
      senderId,
    })

    // Send message via VarTech
    const response = await gateway.send({
      to,
      message: businessCardMessage,
      from: senderId,
      senderName: senderId,
    })

    if (response.success) {
      console.log(`Business card sent successfully: ${response.messageId}`)
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        status: "sent",
        bank,
        to,
      })
    } else {
      console.error("Business Card SMS Error:", response.error)
      return NextResponse.json(
        {
          success: false,
          error: response.error || "Failed to send business card",
          details: "An error occurred while sending the business card. Please try again later.",
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error("Business Card SMS Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send business card"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: "An error occurred while sending the business card. Please try again later.",
      },
      { status: 500 }
    )
  }
}
