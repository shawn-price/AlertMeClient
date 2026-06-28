# VarTech SMS Payload Structure Documentation

## Overview

This document details the request and response payload structures for the VarTech smsModule API integration.

## Request Payload Structure

### Core Payload (Minimum Required)

The minimum required payload structure sent to VarTech's `/sms/send/singleMessage` endpoint:

```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Your SMS message content"
}
```

**Field Definitions:**

| Field | Type | Required | Max Length | Description |
|-------|------|----------|-----------|-------------|
| `recipient` | string | Yes | - | Phone number with country code (e.g., 234810000000 for Nigeria) |
| `senderName` | string | Yes | 11 | SMS sender ID (what appears as sender on recipient's phone) |
| `message` | string | Yes | 160-1600* | The actual SMS message content |

*Standard SMS: 160 chars; Concatenated: up to 1600 chars depending on VarTech limits

### Complete Payload (With Optional Fields)

The gateway constructs a full payload when custom fields are provided:

```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Your SMS message content",
  "priority": "high",
  "transactionId": "TXN_20240115_001",
  "scheduleTime": "2024-01-15T10:00:00Z",
  "metadata": {
    "userId": "user_123",
    "campaignId": "campaign_456"
  }
}
```

### Adding Custom Fields

Use the `customFields` parameter in your API request to add dynamic fields:

```typescript
// HTTP POST /api/sms/send
{
  "to": "+234810000000",
  "message": "Your SMS message",
  "type": "transaction",
  "customFields": {
    "priority": "high",
    "transactionId": "TXN_001",
    "amount": 50000,
    "timestamp": "2024-01-15T10:00:00Z",
    "retryCount": 2,
    "metadata": {
      "userId": "user_123",
      "campaignId": "campaign_456",
      "source": "mobile-app"
    }
  }
}
```

**Result in VarTech payload:**
All fields from `customFields` are merged directly into the API payload.

## Request Format Examples

### Example 1: Basic SMS

**Your Request:**
```json
{
  "to": "+234810000000",
  "message": "Hello! This is a test message.",
  "type": "general"
}
```

**VarTech API Payload:**
```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Hello! This is a test message."
}
```

### Example 2: Alert SMS with Priority

**Your Request:**
```json
{
  "to": "0810000000",
  "message": "ALERT: Suspicious activity detected on your account",
  "type": "alert",
  "customFields": {
    "priority": "high",
    "alertType": "security",
    "accountId": "ACC_123456"
  }
}
```

**VarTech API Payload:**
```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "ALERT: Suspicious activity detected on your account",
  "priority": "high",
  "alertType": "security",
  "accountId": "ACC_123456"
}
```

### Example 3: Transaction Notification with Metadata

**Your Request:**
```json
{
  "to": "+234 810 000 000",
  "message": "Transaction successful. Amount: ₦50,000. Reference: TXN_20240115_001",
  "type": "transaction",
  "customFields": {
    "transactionId": "TXN_20240115_001",
    "amount": 50000,
    "currency": "NGN",
    "status": "completed",
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "userId": "user_789",
      "accountType": "savings",
      "processedBy": "system"
    }
  }
}
```

**VarTech API Payload:**
```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Transaction successful. Amount: ₦50,000. Reference: TXN_20240115_001",
  "transactionId": "TXN_20240115_001",
  "amount": 50000,
  "currency": "NGN",
  "status": "completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "userId": "user_789",
    "accountType": "savings",
    "processedBy": "system"
  }
}
```

### Example 4: Scheduled SMS

**Your Request:**
```json
{
  "to": "+234810000000",
  "message": "Scheduled notification message",
  "type": "scheduled",
  "customFields": {
    "scheduleTime": "2024-01-16T09:00:00Z",
    "campaignId": "CAMP_NEW_YEAR_2024",
    "batchId": "BATCH_001"
  }
}
```

**VarTech API Payload:**
```json
{
  "recipient": "234810000000",
  "senderName": "AlertMe",
  "message": "Scheduled notification message",
  "scheduleTime": "2024-01-16T09:00:00Z",
  "campaignId": "CAMP_NEW_YEAR_2024",
  "batchId": "BATCH_001"
}
```

## Response Payload Structure

### Success Response

When SMS is sent successfully, VarTech returns (via our API):

```json
{
  "success": true,
  "messageId": "vartech_1704067200000",
  "status": "sent",
  "type": "general",
  "statusCode": 200
}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful sends |
| `messageId` | string | Unique message identifier from VarTech |
| `status` | string | Status of the operation (e.g., "sent", "delivered") |
| `type` | string | Echo of the request type |
| `statusCode` | number | HTTP status code (200 for success) |

### Error Response

When SMS sending fails:

```json
{
  "success": false,
  "error": "VarTech API Error (400): Invalid recipient format",
  "details": "The phone number format is not recognized. Please use a valid phone number."
}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for failures |
| `error` | string | Error message describing the issue |
| `details` | string | Additional context or troubleshooting info |

### Response Examples

#### Example 1: Successful Send

```json
{
  "success": true,
  "messageId": "vartech_1704067200000",
  "status": "sent",
  "type": "alert",
  "statusCode": 200
}
```

#### Example 2: Invalid Phone Number

```json
{
  "success": false,
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid string with proper formatting."
}
```

#### Example 3: Rate Limit Exceeded

```
HTTP 429 Too Many Requests
Retry-After: 60
```

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

#### Example 4: Missing Credentials

```json
{
  "success": false,
  "error": "SMS service not configured",
  "details": "VarTech credentials are missing. Please set VARTECH_API_KEY and VARTECH_BASE_URL environment variables, or set SMS_DEMO_MODE=true for testing."
}
```

#### Example 5: API Authentication Error

```json
{
  "success": false,
  "error": "VarTech API Error (401): Unauthorized",
  "details": "Check your VARTECH_API_KEY environment variable."
}
```

## Payload Validation

### Request Validation

The API validates incoming requests:

| Field | Validation |
|-------|-----------|
| `to` | Required, must be non-empty string |
| `message` | Required, must be non-empty string |
| `type` | Optional, defaults to "general" |
| `customFields` | Optional, must be object if provided |

### VarTech API Validation

VarTech validates the payload it receives:

| Field | Validation |
|-------|-----------|
| `recipient` | Required, must be valid phone with country code |
| `senderName` | Required, max 11 characters, alphanumeric + spaces |
| `message` | Required, 1-1600 characters depending on plan |
| Custom fields | Validated per VarTech's requirements |

## Phone Number Formatting

### Automatic Formatting

The gateway automatically formats phone numbers before sending to VarTech:

```typescript
// Examples of auto-formatting:
'0810000000'         → '234810000000'
'+234810000000'      → '234810000000'
'+234 810 000 000'   → '234810000000'
'234810000000'       → '234810000000'
```

### Formatting Logic

1. Remove all non-digit characters
2. If starts with `0`: replace with `234`
3. If missing country code: prepend `234`
4. Return formatted number

## Dynamic Payload Pattern

The `customFields` parameter enables flexible payload construction:

```typescript
interface SMSPayload {
  to: string                          // Required
  message: string                     // Required
  from: string                        // Required
  senderName?: string                 // Optional
  customFields?: Record<string, any>  // Optional - merged into VarTech payload
}
```

### Merging Logic

```typescript
// Build base payload
const body = {
  recipient: formattedPhone,
  senderName: senderName || 'AlertMe',
  message: message
}

// Merge custom fields
if (customFields) {
  Object.assign(body, customFields)
}

// Result: all fields from customFields are now in body
```

## API Endpoint Details

### Endpoint Information

```
Protocol:  HTTPS
Method:    POST
Base URL:  https://sms.thevartech.com/smsModule
Path:      /sms/send/singleMessage
Full URL:  https://sms.thevartech.com/smsModule/sms/send/singleMessage
```

### Headers

```
Content-Type: application/json
Authorization: Bearer {VARTECH_API_KEY}
```

## Success Indicators

The gateway considers a response successful if ANY of these are true:

- `response.ok` is true (HTTP 200-299)
- `data.success === true`
- `data.statusCode === 200`
- `data.code === "00"`

This flexibility accommodates different VarTech API response formats.

## Error Status Codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| 200 | Success | No |
| 400 | Bad Request | No |
| 401 | Unauthorized | No |
| 429 | Rate Limited | Yes (with Retry-After) |
| 500 | Server Error | Yes |
| 502 | Bad Gateway | Yes |
| 503 | Service Unavailable | Yes |

## Retry Behavior

### Automatic Retries

The gateway automatically retries on:
- Network errors (connection refused, reset, timeout)
- Server errors (5xx status codes)

### No Retry On:
- Validation errors (4xx except timeout)
- Authentication errors
- Rate limiting (returns immediately with Retry-After)

### Retry Configuration

```typescript
retryAttempts: 3          // Default: 3 attempts
retryDelayMs: 1000        // Default: 1000ms base delay
timeout: 30000            // Default: 30 second timeout

// Delay formula: retryDelayMs * attemptNumber
// Attempt 1 delay: 1000ms
// Attempt 2 delay: 2000ms
// Attempt 3 delay: 3000ms
```

## Best Practices

### Payload Structure

✅ **DO:**
- Keep `recipient` formatted with country code
- Keep `senderName` concise (max 11 chars)
- Use clear, concise message text
- Include relevant metadata in `customFields`
- Use consistent field naming

❌ **DON'T:**
- Include special characters in `senderName`
- Send messages over 1600 characters without confirmation
- Include sensitive data (passwords, pins) in custom fields
- Use unformatted phone numbers

### Error Handling

✅ **DO:**
- Check `response.success` before processing
- Log errors with timestamps and messageIds
- Implement exponential backoff for retries
- Track rate limiting with `Retry-After` header

❌ **DON'T:**
- Retry on validation errors (4xx)
- Ignore rate limiting responses
- Log sensitive information
- Make synchronous API calls in loops

## Testing Payloads

### Demo Mode Payload

When `SMS_DEMO_MODE=true`:

**Request:**
```json
{
  "to": "+234810000000",
  "message": "Demo message",
  "type": "test"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "DEMO_1704067200000_abc123",
  "status": "demo",
  "type": "test",
  "demo": true,
  "details": "SMS sent in demo mode"
}
```

## Compatibility

### VarTech API Versions

This implementation is compatible with VarTech smsModule API endpoints that support:
- JSON request bodies
- Bearer token authentication
- `/sms/send/singleMessage` endpoint

### Legacy Support

The previous API endpoint (`/api/send`) is deprecated. Use `/sms/send/singleMessage` for new implementations.
