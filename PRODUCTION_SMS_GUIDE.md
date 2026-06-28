# Production SMS Alert System - Complete Guide

## Overview

AlertMe now supports production SMS alerts via VarTech SMS Gateway. All transaction confirmations, notifications, and verification codes are automatically sent to users via SMS with professionally formatted messages that match Nigerian banking standards.

## System Configuration

### Environment Variables

Production SMS requires three environment variables to be configured:

```bash
VARTECH_API_KEY=your_api_key_here
VARTECH_BASE_URL=https://sms.thevartech.com/api
VARTECH_SENDER_ID=AlertMe
```

### Verification

Verify your production configuration is active:

```bash
# Check if environment variables are set
echo $VARTECH_API_KEY
echo $VARTECH_BASE_URL
echo $VARTECH_SENDER_ID
```

## Alert Types

### 1. Transaction Alerts

Automatically sent when money transfers are completed:

**Debit Alert (Sender):**
```
Debit ₦5,000.00 to Test Recipient (08012345678).
Balance: ₦95,000.00. Ref: TXN-123456 from Ecobank.
```

**Credit Alert (Receiver):**
```
Credit ₦5,000.00 from Test User (Ecobank.).
Balance: ₦5,000.00. Ref: TXN-123456
```

### 2. Verification Code SMS

Sent during account registration/2FA:
```
Your AlertMe verification code is: 123456. Do not share this code with anyone.
```

### 3. Business Card SMS

Sent when sharing business card contact:
```
BUSINESS CARD
━━━━━━━━━━━━━━━
Bank: Ecobank
Email: user@example.com
Phone: +2348012345678
━━━━━━━━━━━━━━━
Shared via AlertMe
```

## Formatting Rules

### Sender Bank ID Format
All transaction alerts include the sender's bank with a period:
- `Ecobank.`
- `MTN Money.`
- `Airtel Money.`

### Receiver Phone Format
For mobile payment platforms using phone numbers as account numbers:
- Account number: `0812345678`
- Phone format: `08012345678` (removes any spaces, adds leading 0)

## Testing Production SMS

### Via API Endpoint

**Transaction Alert Test:**
```bash
curl -X POST http://localhost:3000/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "transaction"
  }'
```

**Notification Test:**
```bash
curl -X POST http://localhost:3000/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "notification"
  }'
```

**Verification Code Test:**
```bash
curl -X POST http://localhost:3000/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "verification"
  }'
```

### Via Settings UI

1. Open app Settings
2. Navigate to "SMS Configuration"
3. Under "Test Gateway" tab
4. Enter test phone number
5. Click "Send Test SMS"

## Integration Points

### 1. Transaction Success
When a transfer completes, SMS alerts are automatically sent to both sender and receiver:
- **File:** `components/transaction-success.tsx`
- **Method:** `sendProductionAlerts()`
- **Triggered:** After transaction confirmation

### 2. Formatted Alerts
All alerts use professional formatting with:
- **File:** `lib/alert-templates.ts`
- **Functions:**
  - `generateFormattedDebitAlert()` - Sender alert
  - `generateFormattedCreditAlert()` - Receiver alert
  - `formatSenderId()` - Bank name formatting
  - `formatReceiverPhone()` - Phone number formatting

### 3. Production Alert Service
Central service for all SMS operations:
- **File:** `lib/production-alerts.ts`
- **Class:** `ProductionAlertService`
- **Methods:**
  - `sendTransactionAlert()` - Send debit+credit alerts
  - `sendNotificationSMS()` - Generic notification
  - `sendBusinessCardSMS()` - Business card
  - `sendVerificationSMS()` - Verification code

## Troubleshooting

### Issue: "SMS service not configured"

**Solution:** Verify environment variables are set:
```bash
# In your Vercel project settings or .env file
VARTECH_API_KEY=your_key
VARTECH_BASE_URL=https://sms.thevartech.com/api
VARTECH_SENDER_ID=AlertMe
```

### Issue: "Failed to send SMS"

**Causes:**
1. Invalid phone number format - must be international (+234...) or local (08...)
2. Invalid API credentials
3. Network connectivity issue
4. VarTech account has insufficient balance

**Solution:**
1. Test with API endpoint: `POST /api/sms/production-test`
2. Check VarTech dashboard for account balance
3. Verify credentials in VarTech console
4. Check application logs for error details

### Issue: SMS not received by user

**Possible causes:**
1. Recipient phone network issues
2. VarTech delivery delay (usually 1-2 seconds)
3. SMS blocked by carrier
4. Invalid phone number

**Solution:**
1. Test with different phone number
2. Check VarTech webhook logs for delivery status
3. Ask recipient to check spam/junk messages

## Monitoring

### View SMS Status

Check the Action Log in Settings:
1. Open Settings
2. Click "Process Log"
3. Filter by type: "SMS" or "Alert"
4. View status and timestamps

### Webhook Notifications

VarTech can send delivery reports via webhook:
- **Endpoint:** `/api/sms/webhook`
- **Events:** Delivery status, failures, bounces
- Configure in VarTech dashboard: Settings → Webhooks

### Metrics

Track SMS performance in the Action Log:
- Total SMS sent
- Success rate
- Average delivery time
- Failed SMS reasons

## Best Practices

1. **Always validate phone numbers** before sending
2. **Use international format** (+234...) for reliability
3. **Monitor delivery status** via Action Log
4. **Keep API credentials secure** - never commit to git
5. **Test in demo mode first** before production
6. **Set up error handling** for failed SMS scenarios
7. **Monitor VarTech account balance** to avoid service interruption

## VarTech API Reference

Official VarTech documentation: https://sms.thevartech.com/api-doc

### API Endpoint
```
POST https://sms.thevartech.com/api/send
```

### Request Headers
```
Authorization: Bearer {VARTECH_API_KEY}
Content-Type: application/json
```

### Request Body
```json
{
  "to": "+2348012345678",
  "from": "AlertMe",
  "message": "Your message here"
}
```

### Response
```json
{
  "success": true,
  "message_id": "msg_123456",
  "status": "sent"
}
```

## Deployment Checklist

Before deploying to production:

- [ ] VarTech account created and API key generated
- [ ] VARTECH_API_KEY set in Vercel environment variables
- [ ] VARTECH_BASE_URL set in Vercel environment variables
- [ ] VARTECH_SENDER_ID configured appropriately
- [ ] Test SMS sent successfully via `/api/sms/production-test`
- [ ] Transaction alerts tested end-to-end
- [ ] Webhook endpoint configured in VarTech dashboard
- [ ] SMS_DEMO_MODE not set or set to "false"
- [ ] Rate limiting configured appropriately
- [ ] Error handling implemented for SMS failures
- [ ] Monitoring and alerts set up for SMS failures
- [ ] Staff trained on troubleshooting SMS issues

## Support

For VarTech issues:
- Contact: support@thevartech.com
- Docs: https://sms.thevartech.com/api-doc

For AlertMe SMS issues:
- Check the Application Logs in Settings > Process Log
- Review error messages in browser console
- Check Vercel deployment logs
