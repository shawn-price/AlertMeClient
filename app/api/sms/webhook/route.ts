import { type NextRequest, NextResponse } from "next/server"
import { appendWebhookEvent } from "@/lib/webhook-store"
import { incrementWebhookEvent } from "@/lib/metrics"

/**
 * VarTech SMS webhook endpoint for message status callbacks and delivery notifications.
 * VarTech can send delivery reports via webhook.
 * Configure webhook URL in VarTech dashboard to receive delivery status updates.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let payload: Record<string, any> = {}

    // Parse request body (VarTech sends JSON data)
    if (contentType.includes("application/json")) {
      payload = await request.json()
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text()
      const sp = new URLSearchParams(text)
      for (const [k, v] of sp) {
        payload[k] = v
      }
    } else {
      try {
        payload = await request.json()
      } catch (e) {
        console.warn("Unable to parse webhook body")
        return NextResponse.json(
          { success: false, error: "Invalid request format" },
          { status: 400 }
        )
      }
    }

    // Extract VarTech delivery report fields
    const messageId = payload["message_id"] || payload["messageId"] || payload["id"]
    const status = payload["status"] || payload["delivery_status"] || "unknown"
    const recipient = payload["recipient"] || payload["to"] || "unknown"
    const timestamp = payload["timestamp"] || new Date().toISOString()

    // Build normalized payload for storage
    const event = {
      messageId,
      status,
      recipient,
      timestamp,
      source: "vartech",
      raw: payload,
    }

    // Persist to file-backed store
    try {
      await appendWebhookEvent(event)
    } catch (e) {
      console.warn("Failed to persist webhook event:", e)
    }

    // Update in-memory metrics
    incrementWebhookEvent(status)

    console.log("[VarTech Webhook] Delivery notification received:", {
      messageId,
      status,
      recipient,
      timestamp,
    })

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true, received: true })
  } catch (err) {
    console.error("[VarTech Webhook] Handler error:", err)
    return NextResponse.json({ success: false, error: "Webhook handler error" }, { status: 500 })
  }
}
