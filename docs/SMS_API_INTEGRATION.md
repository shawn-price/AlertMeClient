# VarTech SMS API Integration

## Overview

This document describes the SMS integration with VarTech's new smsModule API endpoint: `POST /sms/send/singleMessage`

## API Configuration

### Base URL
```
https://sms.thevartech.com/smsModule
```

### Endpoint
```
POST /sms/send/singleMessage
```

## Environment Variables

Configure the following environment variables:

```env
# Required
VARTECH_API_KEY=your_api_key_here
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule

# Optional
VARTECH_SENDER_ID=AlertMe
SMS_DEMO_MODE=false  # Set to 'true' for testing without API calls
```

## Request Format

### Basic Request Structure

**Endpoint:** `POST /api/sms/send`

**Request Body (JSON):**
```json
{
  "to": "+234810000000",
  "message": "Your SMS message here",
  "type": "general"
}
```

**Required Fields:**
- `to` (string): Recipient phone number (supports various formats, auto-formatted to Nigerian format)
- `message` (string): The SMS message content

**Optional Fields:**
- `type` (string): Message category (e.g., "general", "alert", "notification")
- `customFields` (object): Additional dynamic fields for the API payload

### Advanced Request with Custom Payload

For dynamic payload requirements, use the `customFields` parameter:

```json
{
  "to": "+234810000000",
  "message": "Your SMS message here",
  "type": "alert",
  "customFields": {
    "priority": "high",
    "retryCount": 2,
    "scheduleTime": "2024-01-15T10:00:00Z"
  }
}
```

The `customFields` object is merged directly into the VarTech API payload, allowing for flexible, dynamic field support.

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "messageId": "vartech_1234567890",
  "status": "sent",
  "type": "general"
}
```

### Error Response (400-500)

```json
{
  "success": false,
  "error": "Error message describing the issue",
  "details": "Additional details about the error"
}
```

## VarTech API Payload Structure

The gateway automatically constructs the payload for the singleMessage endpoint:

```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Your SMS message here"
}
```

### Payload Fields

- **recipient** (string): Formatted phone number with country code
- **senderName** (string): SMS sender identifier (up to 11 characters)
- **message** (string): The message content

### Custom Fields Support

Additional fields can be included via the `customFields` parameter and will be merged into the API payload:

```typescript
// Example: Adding priority and metadata
{
  to: "+234810000000",
  message: "Alert message",
  customFields: {
    priority: "high",
    metadata: {
      userId: 123,
      campaignId: "campaign-456"
    }
  }
}
```

Results in VarTech API payload:
```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Alert message",
  "priority": "high",
  "metadata": {
    "userId": 123,
    "campaignId": "campaign-456"
  }
}
```

## Phone Number Formatting

The gateway automatically formats phone numbers:

- Removes all non-digit characters
- If starts with `0` (Nigerian format): converts to `234...`
- If missing country code: assumes Nigeria and adds `234`
- Input: `0810000000` → Output: `234810000000`
- Input: `+234 810 000 000` → Output: `234810000000`

## Rate Limiting

The API implements per-IP rate limiting. Exceeded limits return:

```
HTTP 429 Too Many Requests
Retry-After: 60
```

## Retry Logic

The gateway implements automatic retry with exponential backoff:

- **Max Attempts:** 3 (configurable)
- **Retry Delay:** 1000ms × attempt (configurable)
- **Retry Conditions:**
  - Network errors (ECONNREFUSED, ECONNRESET, timeout)
  - Server errors (5xx status codes)

Non-retryable errors (4xx, validation errors) fail immediately.

## Error Handling

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | SMS sent successfully |
| 400 | Invalid request (missing fields, malformed data) |
| 429 | Rate limit exceeded |
| 500 | Server error or SMS service unavailable |

### Common Errors

**Missing credentials:**
```json
{
  "success": false,
  "error": "SMS service not configured",
  "details": "VarTech credentials are missing..."
}
```

**Invalid phone number:**
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid string"
}
```

**API authentication failure:**
```json
{
  "success": false,
  "error": "VarTech API Error (401): Unauthorized",
  "details": "Check your VARTECH_API_KEY..."
}
```

## Demo Mode

For testing without making actual API calls, set:

```env
SMS_DEMO_MODE=true
```

Demo responses:
```json
{
  "success": true,
  "messageId": "DEMO_1234567890_abc123",
  "status": "demo",
  "type": "general",
  "demo": true,
  "details": "SMS sent in demo mode"
}
```

## Implementation Details

### Architecture

- **Gateway Pattern:** Abstract `BaseGateway` class with `VartechGateway` implementation
- **Type Safety:** Full TypeScript support with interfaces
- **Error Handling:** Comprehensive error handling with detailed messages
- **Retry Logic:** Exponential backoff with configurable parameters

### File Structure

```
lib/sms-gateways/
├── base-gateway.ts       # Abstract base class
├── vartech-gateway.ts    # VarTech implementation
├── types.ts              # TypeScript interfaces
└── gateway-manager.ts    # Gateway orchestration

app/api/sms/
└── send/route.ts         # Express-like route handler
```

### Extensibility

To add custom payload logic:

1. Override `buildPayload()` in `VartechGateway`
2. Use `customFields` parameter for dynamic fields
3. Extend `SMSPayload` interface in `types.ts`

## Usage Examples

### Basic SMS

```typescript
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+234810000000',
    message: 'Hello, this is a test message!',
    type: 'general'
  })
})
const data = await response.json()
```

### SMS with Custom Fields

```typescript
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+234810000000',
    message: 'Account alert!',
    type: 'alert',
    customFields: {
      priority: 'high',
      timestamp: new Date().toISOString(),
      reference: 'TXN_123456'
    }
  })
})
```

### Handling Responses

```typescript
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: '+234810000000', message: 'Test' })
})

if (response.ok) {
  const data = await response.json()
  if (data.success) {
    console.log('Message sent:', data.messageId)
  } else {
    console.error('SMS failed:', data.error)
  }
} else {
  console.error('Request failed:', response.statusText)
}
```

## Troubleshooting

### Issue: "SMS service not configured"

**Solution:** Ensure environment variables are set:
```bash
VARTECH_API_KEY=your_actual_key
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
```

### Issue: Rate limit exceeded (429)

**Solution:** Wait for the `Retry-After` period before sending more requests.

### Issue: Invalid phone number

**Solution:** Ensure the phone number includes digits only or standard formatting (+234...).

### Issue: Auth error (401)

**Solution:** Verify the `VARTECH_API_KEY` is correct and active in your VarTech account.

## Testing

### Unit Testing

```typescript
describe('VartechGateway', () => {
  it('should format Nigerian phone numbers', async () => {
    const gateway = new VartechGateway('vartech', { apiKey: 'test' })
    // Test phone number formatting
  })

  it('should build correct payload structure', async () => {
    // Test payload building
  })
})
```

### Integration Testing

Use demo mode for testing:
```env
SMS_DEMO_MODE=true
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2024 | Updated to smsModule endpoint, added customFields support |
| 1.0 | 2023 | Initial SMS gateway implementation |

## Support

For API documentation and support, visit:
- **VarTech Portal:** https://sms.thevartech.com
- **API Documentation:** https://sms.thevartech.com/api-doc
- **Support:** support@thevartech.com
