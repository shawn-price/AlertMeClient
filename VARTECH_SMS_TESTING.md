# VarTech SMS Gateway Testing Guide

This document provides comprehensive testing instructions for the VarTech SMS gateway integration.

## Environment Setup

### Required Environment Variables

```bash
# Core VarTech Configuration
VARTECH_API_KEY=your_api_key_here
VARTECH_BASE_URL=https://sms.thevartech.com/api
VARTECH_SENDER_ID=AlertMe

# Optional Advanced Settings
VARTECH_TIMEOUT=30000              # Request timeout in milliseconds (default: 30000)
VARTECH_RETRY_ATTEMPTS=3           # Number of retry attempts (default: 3)
VARTECH_RETRY_DELAY_MS=1000        # Initial retry delay in milliseconds (default: 1000)
VARTECH_ENABLED=true               # Enable/disable the gateway (default: true)

# Demo Mode (for testing without real credentials)
SMS_DEMO_MODE=true                 # Set to 'true' to use demo mode
```

### Setup Instructions

1. **Create `.env.local` file in project root:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add VarTech credentials to `.env.local`:**
   ```bash
   VARTECH_API_KEY=your_actual_api_key
   VARTECH_BASE_URL=https://sms.thevartech.com/api
   VARTECH_SENDER_ID=AlertMe
   ```

## Testing Methods

### Method 1: Demo Mode (No Credentials Required)

Useful for testing without actual VarTech credentials.

```bash
# Set demo mode
export SMS_DEMO_MODE=true

# Start dev server
npm run dev

# The API will return simulated success responses
```

### Method 2: Using Node.js Test Script

```bash
# Test SMS sending via command line
node scripts/vartech-test.js "+234801234567" "Hello from VarTech!"

# Example output:
# [VarTech SMS Test]
# API Key: ABC123DEF...
# Base URL: https://sms.thevartech.com/api
# To: +234801234567
# Sender ID: AlertMe
# Message: Hello from VarTech!
#
# Status: 200
# Response: {"success":true,"message_id":"msg_12345...","status":"sent"}
#
# ✅ SMS sent successfully!
# Message ID: msg_12345...
```

### Method 3: Using cURL

```bash
# Test SMS send endpoint
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234801234567",
    "message": "Test SMS from VarTech",
    "type": "notification"
  }'

# Expected response:
# {
#   "success": true,
#   "messageId": "msg_12345...",
#   "status": "sent",
#   "type": "notification"
# }
```

### Method 4: Using the Settings Panel UI

1. Navigate to Settings > SMS Configuration
2. Enter VarTech credentials:
   - **API Key**: Your VarTech API key
   - **Base URL**: https://sms.thevartech.com/api
   - **Sender ID**: AlertMe (or your preferred sender)
3. Optional: Configure advanced settings:
   - **Request Timeout**: 30000ms (adjustable)
   - **Retry Attempts**: 3 (adjustable)
   - **Retry Delay**: 1000ms (adjustable)
4. Click "Save Configuration"
5. Test by entering a phone number and clicking the test button

### Method 5: Using API Endpoints Directly

#### Test SMS Send
```javascript
// JavaScript fetch example
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+234801234567',
    message: 'Test message',
    type: 'notification'
  })
});

const result = await response.json();
console.log(result); // { success: true, messageId: '...', status: 'sent' }
```

#### Test Gateway Verification
```bash
# Verify VarTech credentials are configured
curl http://localhost:3000/api/sms/verify

# Expected response:
# {
#   "success": true,
#   "gateway": "VarTech SMS",
#   "baseUrl": "https://sms.thevartech.com/api",
#   "status": "connected"
# }
```

#### Test Settings Configuration
```bash
# Get current VarTech configuration
curl http://localhost:3000/api/settings/vartech-config

# Update VarTech configuration
curl -X POST http://localhost:3000/api/settings/vartech-config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "apiKey": "your_api_key",
    "baseUrl": "https://sms.thevartech.com/api",
    "senderId": "AlertMe",
    "timeout": 30000,
    "retryAttempts": 3,
    "retryDelayMs": 1000
  }'
```

## Test Scenarios

### Scenario 1: Basic SMS Send (Happy Path)
**Goal**: Verify successful SMS sending with valid credentials

**Steps**:
1. Ensure VarTech credentials are set in environment
2. Send test SMS to valid phone number
3. Verify response includes `success: true` and `messageId`

**Expected Outcome**: SMS delivered successfully

### Scenario 2: Demo Mode Testing
**Goal**: Test without real credentials

**Steps**:
1. Set `SMS_DEMO_MODE=true`
2. Send SMS request without VarTech credentials
3. Verify demo response is returned

**Expected Outcome**: Returns demo message ID with `demo: true` flag

### Scenario 3: Invalid Phone Number
**Goal**: Test error handling for invalid phone numbers

**Steps**:
1. Send SMS to invalid phone format
2. Verify error response

**Expected Outcome**: Returns error with appropriate message

### Scenario 4: Retry Logic
**Goal**: Verify retry mechanism for transient failures

**Steps**:
1. Configure retry attempts to 3
2. Simulate network failure
3. Observe logs for retry attempts

**Expected Outcome**: Gateway retries failed requests per configuration

### Scenario 5: Advanced Settings
**Goal**: Test timeout and retry customization

**Steps**:
1. Update timeout to 5000ms
2. Update retries to 5
3. Send SMS and observe behavior
4. Verify settings are applied

**Expected Outcome**: Gateway respects custom settings

## Response Formats

### Success Response
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "status": "sent",
  "type": "notification"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "details": "An error occurred while sending the SMS. Please try again later."
}
```

### Demo Mode Response
```json
{
  "success": true,
  "messageId": "DEMO_1234567890_abc123",
  "status": "demo",
  "type": "notification",
  "demo": true,
  "details": "SMS sent in demo mode (VarTech credentials not configured)"
}
```

## Troubleshooting

### "VarTech SMS service not configured"
- Ensure `VARTECH_API_KEY` and `VARTECH_BASE_URL` are set in environment
- Check that variables are in `.env.local` or system environment
- Verify Next.js dev server has been restarted after changing env vars

### "Rate limit exceeded"
- API has built-in rate limiting per IP
- Wait before retrying
- Check `Retry-After` header for suggested wait time

### "Unable to reach VarTech API"
- Verify internet connectivity
- Check VarTech API status at https://sms.thevartech.com
- Verify correct Base URL is configured
- Check firewall/proxy settings

### Connection Timeout
- Increase `VARTECH_TIMEOUT` in environment variables
- Verify network latency to VarTech API
- Check VarTech API performance

### Retry Attempts Not Working
- Verify `VARTECH_RETRY_ATTEMPTS` is configured
- Check logs for retry messages: `[VarTech] Retrying request...`
- Ensure retry delay is reasonable: `VARTECH_RETRY_DELAY_MS`

## Performance Metrics

### Expected Performance
- **Success Rate**: >99% with valid credentials
- **Average Response Time**: 1-3 seconds
- **Timeout**: 30 seconds (configurable)
- **Retry Success Rate**: 80-90% on transient failures

### Monitoring
- Check application logs for SMS send attempts
- Review failed message attempts and error reasons
- Monitor rate limit hits per IP
- Track retry attempt patterns

## Cleanup and Teardown

### Remove VarTech from Development
```bash
# Clear environment variables
unset VARTECH_API_KEY
unset VARTECH_BASE_URL
unset VARTECH_SENDER_ID

# Or set demo mode to test without credentials
export SMS_DEMO_MODE=true
```

## Migration Notes

### What Changed
- **Removed**: Twilio SDK and all Twilio gateway implementations
- **Removed**: `twilio-utils.ts` and Twilio test script
- **Removed**: Old SMS gateway implementations (Infobip, SMSGlobal, EasySendSMS, Telnyx)
- **Added**: VarTech gateway implementation with advanced settings
- **Added**: VarTech configuration API endpoints
- **Added**: VarTech settings UI component
- **Updated**: All SMS endpoints to use VarTech

### Backward Compatibility
- Old Twilio environment variables are no longer used
- Legacy SMS gateway endpoints still exist but now use VarTech
- All new SMS operations use VarTech exclusively

## Support

For issues or questions:
1. Check VarTech API documentation: https://sms.thevartech.com/api-doc
2. Review error messages in application logs
3. Test credentials using the verify endpoint
4. Enable demo mode to test functionality without credentials
