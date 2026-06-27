import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, requestKeyFromHeaders } from "@/lib/rate-limiter"

// Server-only endpoint to verify VarTech credentials without sending an SMS.
// Use this to confirm API key and base URL are valid.

export async function GET(request: NextRequest) {
  // lightweight rate-limit to prevent abuse of the verify endpoint
  const key = requestKeyFromHeaders(request.headers)
  const rl = rateLimit(key)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } }
    )
  }
  try {
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api"

    if (!apiKey || !baseUrl) {
      console.error("VarTech credentials not configured")
      return NextResponse.json({ success: false, error: "VarTech not configured" }, { status: 500 })
    }

    // Perform a simple health check by fetching from the VarTech API
    const response = await fetch(`${baseUrl}/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }).catch(() => null)

    if (!response || !response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to reach VarTech API",
          baseUrl,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      gateway: "VarTech SMS",
      baseUrl,
      status: "connected",
    })
  } catch (error: unknown) {
    console.error("VarTech Verify Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to verify VarTech credentials"
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
