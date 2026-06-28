# Transaction SMS Implementation Guide

## Overview

This document describes the implementation of SMS alerts for banking transactions with platform-aware beneficiary phone resolution. SMS is sent to both sender and beneficiary after every successful transaction.

## Architecture

### Core Components

1. **Platform Phone Configuration** (`lib/platform-phone-config.ts`)
   - Defines phone resolution strategies for different platforms
   - Maps payment platforms to their phone handling rules
   - Provides phone validation and account-to-phone conversion

2. **Production Alerts Service** (`lib/production-alerts.ts`)
   - Orchestrates SMS sending for both sender and beneficiary
   - Implements platform-aware phone resolution
   - Gracefully handles missing beneficiary phones
   - Ensures debit alert is always attempted (required)
   - Credit alert is optional (skip if phone unavailable)

3. **SMS Error Handler** (`lib/sms-error-handler.ts`)
   - Categorizes SMS errors with retry logic
   - New error types: `MISSING_BENEFICIARY_PHONE`, `UNSUPPORTED_PLATFORM`
   - Provides user-friendly error messages

4. **SMS API Route** (`app/api/sms/send/route.ts`)
   - Enhanced with phone format validation
   - Validates Nigerian phone numbers in multiple formats
   - Improved error responses

## Phone Resolution Strategy

Different payment platforms handle phone numbers differently. The system uses three strategies:

### 1. EXPLICIT_PHONE (Default)
**Used by:** Banks (Access, GTB, Zenith, etc.), most wallets

**How it works:**
- Uses explicit `phone` field if available
- Falls back to account-to-phone conversion if only account available
- Skips beneficiary SMS if no phone found

### 2. ACCOUNT_TO_PHONE
**Used by:** Mobile money platforms (Opay, Carbon, MoMo, Paga), some fintech wallets

**How it works:**
- First tries explicit `phone` field
- If unavailable, converts `accountNumber` to phone format
- Adds `+234` prefix to 10-12 digit account numbers
- Examples:
  - Account: `0801234567` → Phone: `+2348012345 67`
  - Account: `8012345678` → Phone: `+2348012345678`

### 3. NO_PHONE
**Used by:** Payment platforms (Flutterwave, Paystack, Remita), bill payment services

**How it works:**
- Skips beneficiary SMS entirely
- No error thrown - graceful skip
- Only sender debit alert is sent

## Implementation Details

### Transaction Flow

```
User completes transfer
    ↓
TransferProcessingScreen processes payment
    ↓
Navigation to TransactionSuccessScreen
    ↓
TransactionSuccessScreen calls sendProductionAlerts()
    ↓
ProductionAlertService.sendTransactionAlert()
    ├─ Resolve beneficiary phone using platform strategy
    ├─ Validate resolved phone format
    ├─ Send DEBIT alert to sender (required)
    ├─ Send CREDIT alert to beneficiary (if phone exists)
    └─ Return detailed result
    ↓
Display SMS status on success screen
    ├─ "SMS sent" if both alerts sent
    ├─ "SMS sent (to sender)" if only debit sent
    ├─ "SMS pending" if still sending
    └─ "SMS failed" if errors
```

### Phone Resolution Example

**Bank Transfer (EXPLICIT_PHONE):**
```typescript
beneficiary = {
  phone: "+2348012345 67",      // Has explicit phone
  accountNumber: "0123456789"
}

resolvedPhone = "+2348012345 67"  // Uses explicit phone
```

**Mobile Money Transfer (ACCOUNT_TO_PHONE):**
```typescript
beneficiary = {
  phone: null,                     // No explicit phone
  accountNumber: "0801234567"      // Has account number
}

resolvedPhone = "+2348012345 67"  // Converts account to phone
```

**Bill Payment (NO_PHONE):**
```typescript
beneficiary = {
  phone: null,
  accountNumber: "12345"  // Biller ID, not phone-like
}

resolvedPhone = null  // Platform doesn't support beneficiary SMS
creditAlertSkipped = true
```

## Data Structures

### TransactionAlertPayload

```typescript
export interface TransactionAlertPayload {
  type: "debit" | "credit"
  senderName: string
  senderBank: string
  senderPhone?: string
  recipientName: string
  recipientBank: string
  recipientPhone?: string
  recipientAccountNumber?: string
  amount: number
  balance: number
  reference: string
  narration?: string
  timestamp?: string
  platformName?: string  // NEW: For platform-aware resolution
}
```

### AlertSendResult

```typescript
export interface AlertSendResult {
  success: boolean                // Overall success (debit must succeed)
  messageId?: string
  smsStatus: "sent" | "failed" | "pending"
  error?: string
  debitAlertSent?: boolean        // Debit SMS status
  creditAlertSent?: boolean       // Credit SMS status
  debitMessageId?: string
  creditMessageId?: string
  creditAlertSkipped?: boolean    // NEW: Credit SMS was skipped
  creditSkipReason?: string       // NEW: Why credit was skipped
}
```

## Usage Examples

### Basic Transaction Alert

```typescript
const result = await productionAlerts.sendTransactionAlert({
  type: "debit",
  senderName: "John Doe",
  senderBank: "GTB",
  senderPhone: "+2348012345 67",
  recipientName: "Jane Smith",
  recipientBank: "Access Bank",
  recipientPhone: "+2349876543 21",
  recipientAccountNumber: "0987654321",
  amount: 10000,
  balance: 50000,
  reference: "TXN_12345",
  platformName: "Access Bank",  // Platform strategy
})

// Result:
// {
//   success: true,
//   debitAlertSent: true,
//   creditAlertSent: true,
//   smsStatus: "sent"
// }
```

### Mobile Money Transfer (Account-to-Phone)

```typescript
const result = await productionAlerts.sendTransactionAlert({
  type: "debit",
  senderName: "John Doe",
  senderBank: "Opay",
  senderPhone: "+2348012345 67",
  recipientName: "Jane Smith",
  recipientBank: "Opay",
  recipientPhone: null,           // No explicit phone
  recipientAccountNumber: "0987654321",  // Will convert to phone
  amount: 5000,
  balance: 20000,
  reference: "OPAY_001",
  platformName: "Opay",  // Strategy: ACCOUNT_TO_PHONE
})

// Result:
// {
//   success: true,
//   debitAlertSent: true,
//   creditAlertSent: true,      // Converted account → phone
//   creditMessageId: "OPAY_456",
//   smsStatus: "sent"
// }
```

### Bill Payment (No Beneficiary SMS)

```typescript
const result = await productionAlerts.sendTransactionAlert({
  type: "debit",
  senderName: "John Doe",
  senderBank: "Paystack",
  senderPhone: "+2348012345 67",
  recipientName: "NEPA Electric",
  recipientBank: "Paystack",
  recipientPhone: null,
  recipientAccountNumber: "NEPA_12345",  // Not a phone
  amount: 2000,
  balance: 10000,
  reference: "NEPA_001",
  platformName: "Paystack",  // Strategy: NO_PHONE
})

// Result:
// {
//   success: true,
//   debitAlertSent: true,
//   creditAlertSent: false,
//   creditAlertSkipped: true,
//   creditSkipReason: "This platform does not support direct SMS alerts to beneficiary.",
//   smsStatus: "sent"  // Only debit success matters
// }
```

## Error Handling

### Sender Phone Missing

**What happens:** Transaction still completes, but no SMS sent

**Error logged:** Warning in console

**User sees:** No SMS indicator, or "SMS not sent" status

### Beneficiary Phone Unavailable

**What happens:** Debit SMS sent, credit SMS skipped

**Error logged:** Info log with skip reason

**User sees:** "SMS sent to you" or similar message

### Network/API Error

**What happens:** Retry with exponential backoff

**Retries:** Up to 3 times by default

**User sees:** "Sending SMS..." → "SMS failed after 3 attempts"

## Testing

### Test Cases

#### 1. Bank-to-Bank Transfer
```
Platform: Access Bank (EXPLICIT_PHONE)
Sender: +2348012345 67
Beneficiary: +2349876543 21
Expected: Both debit and credit SMS sent
```

#### 2. Mobile Money Transfer
```
Platform: Opay (ACCOUNT_TO_PHONE)
Sender: +2348012345 67
Beneficiary: Account 0987654321 (no phone)
Expected: 
  - Debit SMS sent to sender
  - Credit SMS sent to beneficiary (converted to +2349876543 21)
```

#### 3. Bill Payment
```
Platform: Paystack (NO_PHONE)
Sender: +2348012345 67
Beneficiary: NEPA_12345 (biller)
Expected:
  - Debit SMS sent to sender
  - Credit SMS skipped (platform rule)
```

#### 4. Missing Beneficiary Phone
```
Platform: Bank (EXPLICIT_PHONE)
Sender: +2348012345 67
Beneficiary: No phone, no account
Expected:
  - Debit SMS sent to sender
  - Credit SMS skipped gracefully
```

### Manual Testing

1. **Enable demo mode for testing:**
   ```env
   SMS_DEMO_MODE=true
   ```

2. **Check console logs:**
   ```
   [ProductionAlert] Beneficiary phone resolution:
   {
     platform: "Opay",
     inputPhone: null,
     inputAccount: "0987654321",
     resolvedPhone: "+2349876543 21",
     isValid: true
   }
   ```

3. **Verify transaction completion:**
   - Transaction success screen shows SMS status
   - Both debit and credit alerts logged (if applicable)
   - Or skip reason logged if credit SMS skipped

## Integration Points

### Components Using SMS Alerts

1. **TransactionSuccessScreen**
   - Calls `productionAlerts.sendTransactionAlert()`
   - Displays SMS status indicator
   - Shows skip reasons if applicable

2. **TransferProcessingScreen**
   - Passes `platformName` to success screen
   - Ensures bank/provider info transferred

### Environment Variables

```env
# SMS Gateway (Required for production)
VARTECH_API_KEY=your_api_key
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
VARTECH_SENDER_ID=AlertMe

# Testing (Optional)
SMS_DEMO_MODE=true  # Simulates SMS without API calls
```

## Monitoring & Logging

### What Gets Logged

**Successful sends:**
```
[ProductionAlert] Debit alert sent to +2348012345 67: MSG_12345
[ProductionAlert] Credit alert sent to +2349876543 21: MSG_12346
```

**Skipped credit alerts:**
```
[ProductionAlert] Skipping credit alert to beneficiary: No phone available (Paystack platform)
```

**Errors:**
```
[ProductionAlert] Failed to send debit alert: Network timeout
[ProductionAlert] Error sending credit alert: Invalid phone format
```

### Monitoring Checklist

- [ ] Sender always receives debit SMS
- [ ] Beneficiary receives credit SMS when phone available
- [ ] Credit SMS skipped for NO_PHONE platforms
- [ ] Error retry logic working correctly
- [ ] Rate limiting in place (429 responses)
- [ ] Logs clear and traceable

## Deployment Notes

### Pre-deployment

- [ ] Test with each payment platform
- [ ] Verify phone resolution for all platforms
- [ ] Check error messages are user-friendly
- [ ] Verify SMS cost doesn't impact transaction UX

### Post-deployment

- [ ] Monitor SMS send success rate
- [ ] Track beneficiary phone resolution accuracy
- [ ] Check error rates for each platform
- [ ] Verify no transaction delays from SMS processing

## Troubleshooting

### Issue: Credit SMS always skipped
**Check:**
1. Platform is configured in `PLATFORM_CONFIGS`
2. Platform strategy is correct
3. Beneficiary phone format matches expected pattern
4. Account number length within min/max bounds

### Issue: SMS not sent to sender
**Check:**
1. Sender phone is valid (+234 format)
2. VARTECH_API_KEY is set
3. Network connectivity to SMS gateway
4. Rate limiting not triggered

### Issue: Invalid phone number format
**Valid formats:**
- `+2348012345 67`
- `08012345 67`
- `2348012345 67`

**Invalid formats:**
- `8012345 67` (missing country code)
- `+123 456 7890` (wrong country)
- `234 8012345 67` (too many digits)

## Files Changed

1. **lib/platform-phone-config.ts** (NEW)
   - 442 lines
   - Platform configurations and phone resolution logic

2. **lib/production-alerts.ts** (MODIFIED)
   - Added platform-aware phone resolution
   - Enhanced error handling
   - Added credit alert skip support

3. **lib/sms-error-handler.ts** (MODIFIED)
   - Added new error types
   - Enhanced error messages

4. **components/transaction-success.tsx** (MODIFIED)
   - Platform-aware SMS alert sending
   - Better error handling

5. **components/transfer-processing-screen.tsx** (MODIFIED)
   - Pass platform info to success screen

6. **app/api/sms/send/route.ts** (MODIFIED)
   - Phone format validation
   - Better error responses

## Future Enhancements

1. **Multi-language SMS** - Send SMS in customer's preferred language
2. **SMS Templates** - Different templates for different transaction types
3. **Opt-in/Opt-out** - Allow users to disable SMS alerts
4. **Email Fallback** - If SMS fails, try email notification
5. **Delivery Reports** - Track SMS delivery status from gateway
6. **Batch Processing** - Handle high-volume SMS sends efficiently
