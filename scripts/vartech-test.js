#!/usr/bin/env node
// Local test script: load env with dotenv and send a test SMS using VarTech
// Usage: node scripts/vartech-test.js <to> [message]

require("dotenv").config()

const apiKey = process.env.VARTECH_API_KEY
const baseUrl = process.env.VARTECH_BASE_URL || "https://sms.thevartech.com/api"
const senderId = process.env.VARTECH_SENDER_ID || "AlertMe"

if (!apiKey || !baseUrl) {
  console.error("Missing VARTECH_API_KEY or VARTECH_BASE_URL in environment.")
  console.error("Copy .env.example to .env.local and set the real values, then run this script.")
  process.exit(1)
}

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error("Usage: node scripts/vartech-test.js <to> [message]")
  process.exit(1)
}

const to = args[0]
const message = args.slice(1).join(" ") || "Test SMS from AlertMe via VarTech"

;(async () => {
  try {
    console.log(`[VarTech SMS Test]`)
    console.log(`API Key: ${apiKey.substring(0, 10)}...`)
    console.log(`Base URL: ${baseUrl}`)
    console.log(`To: ${to}`)
    console.log(`Sender ID: ${senderId}`)
    console.log(`Message: ${message}`)
    console.log("")

    const response = await fetch(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient: to,
        sender_id: senderId,
        message: message,
      }),
    })

    const data = await response.json()

    console.log(`Status: ${response.status}`)
    console.log(`Response:`, JSON.stringify(data, null, 2))

    if (response.ok && data.success) {
      console.log(`\n✅ SMS sent successfully!`)
      console.log(`Message ID: ${data.message_id || data.id}`)
      process.exit(0)
    } else {
      console.error(`\n❌ Failed to send SMS`)
      console.error(`Error: ${data.message || "Unknown error"}`)
      process.exit(1)
    }
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
})()
