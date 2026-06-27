import { NextRequest, NextResponse } from "next/server"

interface VartechConfig {
  enabled: boolean
  apiKey: string
  baseUrl: string
  senderId: string
  timeout: number
  retryAttempts: number
  retryDelayMs: number
}

// In-memory storage for demo/development
// In production, this should be stored in a database or persistent storage
let configStore: VartechConfig | null = null

/**
 * GET /api/settings/vartech-config
 * Retrieve current VarTech configuration
 */
export async function GET(request: NextRequest) {
  try {
    // If we have a stored config, return it
    if (configStore) {
      return NextResponse.json(configStore)
    }

    // Otherwise, return config from environment variables
    const config: VartechConfig = {
      enabled: process.env.VARTECH_ENABLED !== "false",
      apiKey: process.env.VARTECH_API_KEY || "",
      baseUrl: process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api",
      senderId: process.env.VARTECH_SENDER_ID || "AlertMe",
      timeout: parseInt(process.env.VARTECH_TIMEOUT || "30000"),
      retryAttempts: parseInt(process.env.VARTECH_RETRY_ATTEMPTS || "3"),
      retryDelayMs: parseInt(process.env.VARTECH_RETRY_DELAY_MS || "1000"),
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("[VarTech Config] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve VarTech configuration" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/vartech-config
 * Update VarTech configuration (stores in memory for demo)
 * In production, you should validate auth and persist to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const config: VartechConfig = {
      enabled: body.enabled ?? true,
      apiKey: body.apiKey || "",
      baseUrl: body.baseUrl || "https://sms.thevartech.com/api",
      senderId: body.senderId || "AlertMe",
      timeout: body.timeout || 30000,
      retryAttempts: body.retryAttempts || 3,
      retryDelayMs: body.retryDelayMs || 1000,
    }

    // Validate required fields
    if (!config.apiKey || !config.baseUrl) {
      return NextResponse.json(
        { error: "API Key and Base URL are required" },
        { status: 400 }
      )
    }

    // Store in memory (for demo)
    configStore = config

    // Log configuration update (without exposing sensitive data)
    console.log(
      `[VarTech Config] Updated configuration: enabled=${config.enabled}, senderId=${config.senderId}`
    )

    return NextResponse.json({
      success: true,
      message: "VarTech configuration updated successfully",
      config: {
        enabled: config.enabled,
        baseUrl: config.baseUrl,
        senderId: config.senderId,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        retryDelayMs: config.retryDelayMs,
      },
    })
  } catch (error) {
    console.error("[VarTech Config] POST Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update VarTech configuration" },
      { status: 500 }
    )
  }
}
