# SMS Gateway Quick Start Guide

## Overview

This guide shows you how to quickly start sending SMS messages using the updated VarTech smsModule API.

## Prerequisites

1. VarTech SMS account with active API key
2. Environment variables configured in your `.env.local` or deployment platform

## Configuration

### Step 1: Set Environment Variables

Add these to your `.env.local` file:

```env
# Required
VARTECH_API_KEY=your_actual_api_key_from_vartech
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule

# Optional (has defaults)
VARTECH_SENDER_ID=AlertMe
SMS_DEMO_MODE=false
```

### Step 2: Verify Configuration

Test your setup by making a simple API call:

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234810000000",
    "message": "Hello from VarTech!",
    "type": "test"
  }'
```

Expected successful response:
```json
{
  "success": true,
  "messageId": "vartech_1704067200000",
  "status": "sent",
  "type": "test"
}
```

## Basic Usage

### Send a Simple SMS

```typescript
// pages/api/send-sms.ts or app/api/send-sms/route.ts
export async function POST(request: Request) {
  const { to, message } = await request.json()

  const response = await fetch('/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      message,
      type: 'general',
    }),
  })

  return response
}
```

### Use in React Component

```typescript
'use client'

import { useState } from 'react'

export default function SMSForm() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          message,
          type: 'user-request',
        }),
      })

      const data = await res.json()
      setResponse(data)

      if (data.success) {
        alert('SMS sent successfully!')
        setPhone('')
        setMessage('')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to send SMS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="max-w-md mx-auto p-6">
      <div className="space-y-4">
        <input
          type="tel"
          placeholder="+234810000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />

        <textarea
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
          rows={4}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send SMS'}
        </button>

        {response && (
          <div
            className={`p-3 rounded ${
              response.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {response.success ? `Sent! ID: ${response.messageId}` : `Error: ${response.error}`}
          </div>
        )}
      </div>
    </form>
  )
}
```

## Common Patterns

### Pattern 1: Send Alert SMS

```typescript
async function sendAlert(userId: string, message: string) {
  const response = await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      to: await getUserPhone(userId),
      message,
      type: 'alert',
      customFields: {
        userId,
        timestamp: new Date().toISOString(),
        priority: 'high',
      },
    }),
  })

  return await response.json()
}
```

### Pattern 2: Send Transaction Notification

```typescript
async function sendTransactionSMS(
  phone: string,
  amount: number,
  reference: string
) {
  const message = `Transaction of ₦${amount} was successful. Ref: ${reference}`

  const response = await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      to: phone,
      message,
      type: 'transaction',
      customFields: {
        transactionId: reference,
        amount,
        timestamp: new Date().toISOString(),
      },
    }),
  })

  return await response.json()
}
```

### Pattern 3: Batch Send

```typescript
async function sendBatch(
  recipients: Array<{ phone: string; message: string }>
) {
  const results = []

  for (const recipient of recipients) {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({
        to: recipient.phone,
        message: recipient.message,
        type: 'batch',
      }),
    })

    const data = await response.json()
    results.push({
      phone: recipient.phone,
      success: data.success,
      messageId: data.messageId,
    })

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}
```

## Error Handling

### Handle Common Errors

```typescript
async function sendSMSSafely(to: string, message: string) {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message, type: 'general' }),
    })

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      console.warn(`Rate limited. Retry after ${retryAfter}s`)
      return null
    }

    // Handle HTTP errors
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Handle API errors
    if (!data.success) {
      console.error(`SMS Error: ${data.error}`)
      return null
    }

    return data
  } catch (error) {
    console.error('Network error:', error)
    return null
  }
}
```

## Testing

### Test with Demo Mode

Set `SMS_DEMO_MODE=true` to test without making actual API calls:

```bash
# In .env.local
SMS_DEMO_MODE=true

# Then send an SMS - it will return a demo response
```

### Test Different Phone Formats

The API auto-formats phone numbers:

```typescript
// All these work the same way:
'+234810000000'
'0810000000'
'+234 810 000 000'
'234810000000'
```

## Debugging

### Check if Credentials are Loaded

```typescript
console.log(process.env.VARTECH_API_KEY ? 'API Key set' : 'API Key missing')
console.log(process.env.VARTECH_BASE_URL || 'Using default base URL')
```

### Enable Detailed Logging

Add to `app/api/sms/send/route.ts`:

```typescript
console.log('[SMS] Request:', {
  to: body.to,
  messageLength: body.message.length,
  type: body.type,
  timestamp: new Date().toISOString(),
})

// Then in response:
console.log('[SMS] Response:', {
  success: response.success,
  messageId: response.messageId,
  error: response.error,
  duration: Date.now() - startTime,
})
```

### Test with cURL

```bash
# Basic SMS
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234810000000",
    "message": "Test message",
    "type": "test"
  }'

# With custom fields
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234810000000",
    "message": "Test message",
    "type": "alert",
    "customFields": {
      "priority": "high",
      "reference": "REF_123"
    }
  }'
```

## Performance Tips

1. **Batch Operations:** Add small delays between batch sends to avoid rate limiting
2. **Async/Await:** Use async patterns to prevent blocking other requests
3. **Error Retry:** The gateway automatically retries on network errors
4. **Caching:** Consider caching phone numbers if frequently accessed

## Production Checklist

- [ ] Environment variables configured in deployment platform
- [ ] API key is active and has sufficient credits
- [ ] Phone numbers are properly formatted
- [ ] Error handling is in place
- [ ] Rate limiting strategy implemented
- [ ] Logging and monitoring configured
- [ ] Test with demo mode first
- [ ] Verify with small batch before large campaigns

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "SMS service not configured" | Check `VARTECH_API_KEY` and `VARTECH_BASE_URL` in env vars |
| "Rate limit exceeded" | Wait for `Retry-After` seconds before retrying |
| "Invalid phone number" | Ensure phone includes digits or standard format |
| "Auth error (401)" | Verify `VARTECH_API_KEY` is correct and active |
| "Connection timeout" | Check network connectivity and VarTech API status |

## Next Steps

1. ✅ Configure environment variables
2. ✅ Test with demo mode
3. ✅ Integrate into your application
4. ✅ Set up logging and monitoring
5. ✅ Deploy to production

## Resources

- **Full API Documentation:** `docs/SMS_API_INTEGRATION.md`
- **Code Examples:** `examples/sms-api-usage.ts`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **VarTech Support:** support@thevartech.com
