import { NextRequest, NextResponse } from "next/server"
import { VartechGateway } from "@/lib/sms-gateways/vartech-gateway"

interface TestResult {
  name: string
  status: "pass" | "fail" | "skip"
  message: string
  duration: number
  details?: Record<string, any>
}

/**
 * GET /api/sms/test-suite
 * Run comprehensive VarTech SMS gateway tests
 */
export async function GET(request: NextRequest) {
  const results: TestResult[] = []
  const startTime = Date.now()

  // Test 1: Environment Check
  results.push(testEnvironmentConfig())

  // Test 2: Gateway Initialization
  results.push(testGatewayInit())

  // Test 3: Verify Endpoint
  const verifyResult = await testVerifyEndpoint()
  results.push(verifyResult)

  // Test 4: Send Endpoint (Demo Mode)
  const sendResult = await testSendEndpoint()
  results.push(sendResult)

  // Test 5: Settings Configuration
  const settingsResult = await testSettingsEndpoint()
  results.push(settingsResult)

  const totalDuration = Date.now() - startTime
  const passCount = results.filter((r) => r.status === "pass").length
  const failCount = results.filter((r) => r.status === "fail").length

  return NextResponse.json({
    summary: {
      totalTests: results.length,
      passed: passCount,
      failed: failCount,
      skipped: results.filter((r) => r.status === "skip").length,
      totalDuration,
      timestamp: new Date().toISOString(),
    },
    results,
  })
}

function testEnvironmentConfig(): TestResult {
  const startTime = Date.now()

  try {
    const apiKey = process.env.VARTECH_API_KEY
    const baseUrl = process.env.VARTECH_BASE_URL
    const senderId = process.env.VARTECH_SENDER_ID
    const demoMode = process.env.SMS_DEMO_MODE

    if (apiKey && baseUrl) {
      return {
        name: "Environment Configuration",
        status: "pass",
        message: "VarTech credentials are configured",
        duration: Date.now() - startTime,
        details: {
          apiKeySet: !!apiKey,
          baseUrlSet: !!baseUrl,
          senderIdSet: !!senderId,
          demoMode: demoMode === "true",
        },
      }
    } else if (demoMode === "true") {
      return {
        name: "Environment Configuration",
        status: "pass",
        message: "Running in demo mode (no real credentials needed)",
        duration: Date.now() - startTime,
        details: {
          apiKeySet: false,
          baseUrlSet: false,
          demoMode: true,
        },
      }
    } else {
      return {
        name: "Environment Configuration",
        status: "fail",
        message: "VarTech credentials not configured and demo mode disabled",
        duration: Date.now() - startTime,
        details: {
          apiKeySet: !!apiKey,
          baseUrlSet: !!baseUrl,
          senderIdSet: !!senderId,
          demoMode: demoMode === "true",
        },
      }
    }
  } catch (error) {
    return {
      name: "Environment Configuration",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

function testGatewayInit(): TestResult {
  const startTime = Date.now()

  try {
    const apiKey = process.env.VARTECH_API_KEY || "test_key"
    const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api"
    const senderId = process.env.VARTECH_SENDER_ID || "AlertMe"

    const gateway = new VartechGateway("vartech", {
      apiKey,
      baseUrl,
      senderId,
    })

    return {
      name: "Gateway Initialization",
      status: "pass",
      message: "VarTech gateway initialized successfully",
      duration: Date.now() - startTime,
      details: {
        gateway: "VarTech",
        baseUrl,
        senderId,
      },
    }
  } catch (error) {
    return {
      name: "Gateway Initialization",
      status: "fail",
      message: error instanceof Error ? error.message : "Failed to initialize gateway",
      duration: Date.now() - startTime,
    }
  }
}

async function testVerifyEndpoint(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const response = await fetch("http://localhost:3000/api/sms/verify", {
      method: "GET",
    }).catch(() => null)

    if (!response) {
      return {
        name: "Verify Endpoint",
        status: "skip",
        message: "Could not connect to verify endpoint (dev server may not be running)",
        duration: Date.now() - startTime,
      }
    }

    const data = await response.json()

    if (data.success) {
      return {
        name: "Verify Endpoint",
        status: "pass",
        message: "Gateway verification successful",
        duration: Date.now() - startTime,
        details: data,
      }
    } else {
      return {
        name: "Verify Endpoint",
        status: "fail",
        message: data.error || "Verification failed",
        duration: Date.now() - startTime,
        details: data,
      }
    }
  } catch (error) {
    return {
      name: "Verify Endpoint",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testSendEndpoint(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const response = await fetch("http://localhost:3000/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "+234801234567",
        message: "Test SMS from VarTech Test Suite",
        type: "test",
      }),
    }).catch(() => null)

    if (!response) {
      return {
        name: "Send Endpoint",
        status: "skip",
        message: "Could not connect to send endpoint (dev server may not be running)",
        duration: Date.now() - startTime,
      }
    }

    const data = await response.json()

    if (data.success) {
      return {
        name: "Send Endpoint",
        status: "pass",
        message: "SMS sent successfully",
        duration: Date.now() - startTime,
        details: {
          messageId: data.messageId,
          status: data.status,
          demo: data.demo || false,
        },
      }
    } else {
      return {
        name: "Send Endpoint",
        status: "fail",
        message: data.error || "Failed to send SMS",
        duration: Date.now() - startTime,
        details: data,
      }
    }
  } catch (error) {
    return {
      name: "Send Endpoint",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testSettingsEndpoint(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const response = await fetch("http://localhost:3000/api/settings/vartech-config", {
      method: "GET",
    }).catch(() => null)

    if (!response) {
      return {
        name: "Settings Endpoint",
        status: "skip",
        message: "Could not connect to settings endpoint (dev server may not be running)",
        duration: Date.now() - startTime,
      }
    }

    const data = await response.json()

    if (data.baseUrl) {
      return {
        name: "Settings Endpoint",
        status: "pass",
        message: "Settings retrieved successfully",
        duration: Date.now() - startTime,
        details: {
          enabled: data.enabled,
          baseUrl: data.baseUrl,
          senderId: data.senderId,
          timeout: data.timeout,
          retryAttempts: data.retryAttempts,
        },
      }
    } else {
      return {
        name: "Settings Endpoint",
        status: "fail",
        message: "Invalid settings response",
        duration: Date.now() - startTime,
        details: data,
      }
    }
  } catch (error) {
    return {
      name: "Settings Endpoint",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}
