/**
 * VarTech SMS API Usage Examples
 * 
 * This file demonstrates how to use the updated SMS API with the new
 * smsModule endpoint: POST /sms/send/singleMessage
 */

// ============================================================================
// Example 1: Basic SMS Send
// ============================================================================

async function sendBasicSMS() {
  const response = await fetch('/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: '+234810000000',
      message: 'Hello! This is a test SMS message.',
      type: 'general',
    }),
  })

  const data = await response.json()

  if (data.success) {
    console.log('✓ SMS sent successfully')
    console.log(`Message ID: ${data.messageId}`)
    console.log(`Status: ${data.status}`)
  } else {
    console.error('✗ Failed to send SMS')
    console.error(`Error: ${data.error}`)
    console.error(`Details: ${data.details}`)
  }

  return data
}

// ============================================================================
// Example 2: SMS with Different Phone Number Formats
// ============================================================================

async function sendToVariousFormats() {
  const phoneNumbers = [
    '0810000000', // Nigerian format starting with 0
    '+234810000000', // With country code and +
    '234810000000', // Just country code without +
    '+234 810 000 000', // With spaces
  ]

  for (const phoneNumber of phoneNumbers) {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneNumber,
        message: `Testing with format: ${phoneNumber}`,
        type: 'test',
      }),
    })

    const data = await response.json()
    console.log(`Format: ${phoneNumber} -> ${data.success ? '✓ Sent' : '✗ Failed'}`)
  }
}

// ============================================================================
// Example 3: Alert/Notification SMS
// ============================================================================

async function sendAlertSMS() {
  const response = await fetch('/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: '+234810000000',
      message: 'ALERT: Suspicious activity detected on your account. Please verify.',
      type: 'alert',
    }),
  })

  return await response.json()
}

// ============================================================================
// Example 4: SMS with Custom Fields (Dynamic Payload)
// ============================================================================

async function sendSMSWithCustomFields() {
  /**
   * The customFields parameter allows you to pass any additional data
   * that will be included in the VarTech API request. This supports
   * flexible, dynamic payload requirements.
   */
  const response = await fetch('/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: '+234810000000',
      message: 'Your transaction has been processed.',
      type: 'transaction',
      customFields: {
        // These fields will be merged into the VarTech API payload
        priority: 'high',
        transactionId: 'TXN_20240115_001',
        amount: 50000,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: 'user_123',
          campaignId: 'campaign_456',
        },
      },
    }),
  })

  const data = await response.json()
  console.log('SMS with custom fields sent:', data)
  return data
}

// ============================================================================
// Example 5: Batch SMS Sending
// ============================================================================

async function sendBatchSMS() {
  const recipients = [
    { to: '+234810000001', message: 'Message to recipient 1' },
    { to: '+234810000002', message: 'Message to recipient 2' },
    { to: '+234810000003', message: 'Message to recipient 3' },
  ]

  const results = []

  for (const recipient of recipients) {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient.to,
        message: recipient.message,
        type: 'batch',
      }),
    })

    const data = await response.json()
    results.push({
      to: recipient.to,
      success: data.success,
      messageId: data.messageId,
      error: data.error,
    })

    // Add delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('Batch results:', results)
  return results
}

// ============================================================================
// Example 6: Handling Errors and Rate Limiting
// ============================================================================

async function sendSMSWithErrorHandling() {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '+234810000000',
        message: 'Testing error handling',
        type: 'test',
      }),
    })

    // Check for rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`)
      return null
    }

    // Check for other errors
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (!data.success) {
      console.error(`SMS Error: ${data.error}`)
      console.error(`Details: ${data.details}`)
      return null
    }

    console.log('✓ SMS sent successfully')
    return data
  } catch (error) {
    console.error('Network error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// ============================================================================
// Example 7: Retry Logic with Exponential Backoff
// ============================================================================

async function sendSMSWithRetry(
  to: string,
  message: string,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, type: 'retry-test' }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log(`✓ SMS sent on attempt ${attempt}`)
          return data
        }
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        const delayMs = retryAfter * 1000
        console.log(`Rate limited. Waiting ${delayMs}ms before retry ${attempt}...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`Network error on attempt ${attempt}. Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  console.error(`Failed to send SMS after ${maxRetries} attempts`)
  return null
}

// ============================================================================
// Example 8: TypeScript Usage with Type Safety
// ============================================================================

interface SMSRequest {
  to: string
  message: string
  type?: string
  customFields?: Record<string, any>
}

interface SMSResponse {
  success: boolean
  messageId?: string
  status?: string
  error?: string
  details?: string
}

async function sendTypedSMS(request: SMSRequest): Promise<SMSResponse | null> {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to send SMS:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// Usage of typed SMS
const typedRequest: SMSRequest = {
  to: '+234810000000',
  message: 'Hello from typed SMS!',
  type: 'general',
  customFields: {
    source: 'mobile-app',
    version: '2.0',
  },
}

// ============================================================================
// Example 9: React Hook for SMS Sending
// ============================================================================

import { useState } from 'react'

export function useSendSMS() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendSMS = async (to: string, message: string, customFields?: Record<string, any>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          message,
          type: 'general',
          customFields,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send SMS')
      }

      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { sendSMS, loading, error }
}

// Usage in React component:
/*
function MyComponent() {
  const { sendSMS, loading, error } = useSendSMS()

  const handleSendAlert = async () => {
    try {
      const result = await sendSMS(
        '+234810000000',
        'Your alert message here',
        { priority: 'high' }
      )
      console.log('Sent:', result.messageId)
    } catch (err) {
      console.error('Error:', error)
    }
  }

  return (
    <button onClick={handleSendAlert} disabled={loading}>
      {loading ? 'Sending...' : 'Send Alert'}
    </button>
  )
}
*/

// ============================================================================
// Example 10: API Response Logging and Monitoring
// ============================================================================

async function sendSMSWithLogging() {
  const startTime = Date.now()

  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '+234810000000',
        message: 'Monitored SMS send',
        type: 'monitoring-test',
      }),
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    // Log metrics
    console.log('[SMS] Request completed', {
      success: data.success,
      messageId: data.messageId,
      status: data.status,
      httpStatus: response.status,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    })

    if (!data.success) {
      console.error('[SMS] Error details', {
        error: data.error,
        details: data.details,
      })
    }

    return data
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[SMS] Exception', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

// ============================================================================
// Export examples for testing
// ============================================================================

export {
  sendBasicSMS,
  sendToVariousFormats,
  sendAlertSMS,
  sendSMSWithCustomFields,
  sendBatchSMS,
  sendSMSWithErrorHandling,
  sendSMSWithRetry,
  sendTypedSMS,
  sendSMSWithLogging,
}
