# Transaction SMS - Quick Reference

## What Changed

SMS alerts are now sent to **both sender and beneficiary** after every transaction. The system intelligently handles different payment platforms.

## Key Features

✅ **Sender always notified** - Debit SMS sent to sender (required)  
✅ **Beneficiary notified when possible** - Credit SMS sent to beneficiary if phone available  
✅ **Platform-aware** - Different strategies for banks, wallets, and payment services  
✅ **Graceful degradation** - No error if beneficiary phone unavailable  
✅ **Robust error handling** - Automatic retry with exponential backoff  

## Platform Types

### Banks (EXPLICIT_PHONE)
- Access Bank, GTB, Zenith, etc.
- Uses explicit phone field
- Fallback to account-to-phone conversion
- **Beneficiary SMS:** ✅ Usually sent

### Mobile Wallets (ACCOUNT_TO_PHONE)
- Opay, Carbon, MoMo, Paga
- Converts account number to phone format
- Adds +234 prefix to 10-12 digit accounts
- **Beneficiary SMS:** ✅ Usually sent

### Payment Platforms (NO_PHONE)
- Flutterwave, Paystack, Remita, Quickteller
- No direct beneficiary SMS support
- Only biller/business, not individuals
- **Beneficiary SMS:** ❌ Not sent (by design)

## Integration Checklist

### For Developers

- [x] Platform phone configuration created
- [x] Production alerts enhanced with beneficiary SMS
- [x] SMS error handler updated
- [x] Transaction success screen updated
- [x] SMS API route with phone validation
- [x] Platform name passed through data flow

### For Testing

```env
SMS_DEMO_MODE=true  # Test without API calls
VARTECH_API_KEY=your_key  # For production
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
```

## Code Examples

### Send Transaction Alert with Platform

```typescript
import { productionAlerts } from '@/lib/production-alerts'

const result = await productionAlerts.sendTransactionAlert({
  type: "debit",
  senderName: userData.name,
  senderBank: transferData.bank,
  senderPhone: userData.phone,
  recipientName: transferData.beneficiaryName,
  recipientBank: transferData.bank,
  recipientPhone: transferData.phone,
  recipientAccountNumber: transferData.accountNumber,
  amount: parseFloat(transferData.amount),
  balance: userData.balance,
  reference: transactionId,
  platformName: transferData.bank,  // ⭐ NEW
})

// Handle result
if (result.success) {
  console.log('Debit SMS sent:', result.debitMessageId)
  if (result.creditAlertSent) {
    console.log('Credit SMS sent:', result.creditMessageId)
  } else if (result.creditAlertSkipped) {
    console.log('Credit SMS skipped:', result.creditSkipReason)
  }
}
```

### Check Platform Configuration

```typescript
import { getPlatformConfig, resolveBeneficiaryPhone } from '@/lib/platform-phone-config'

const config = getPlatformConfig('Opay')
console.log(config.strategy)  // 'ACCOUNT_TO_PHONE'

const beneficiary = {
  phone: null,
  accountNumber: '0801234567'
}

const phone = resolveBeneficiaryPhone(beneficiary, 'Opay')
console.log(phone)  // '+2348012345 67'
```

### Validate Phone Format

```typescript
import { validateBeneficiaryPhone } from '@/lib/platform-phone-config'

const isValid = validateBeneficiaryPhone('+2348012345 67')
console.log(isValid)  // true
```

## Phone Resolution Flow

```
User initiates transfer
    ↓
Transfer completes
    ↓
TransactionSuccessScreen.sendProductionAlerts()
    ↓
ProductionAlertService.sendTransactionAlert()
    ├─ Get platform config (bank/provider name)
    ├─ Apply resolution strategy
    │  ├─ EXPLICIT_PHONE: Use .phone field
    │  ├─ ACCOUNT_TO_PHONE: Convert .accountNumber
    │  └─ NO_PHONE: Skip
    ├─ Validate resolved phone
    ├─ Send debit SMS to sender (required)
    ├─ Send credit SMS to beneficiary (if phone exists)
    └─ Return result with status
    ↓
Display SMS status on screen
```

## Error Scenarios & Handling

| Scenario | Result | User Sees |
|----------|--------|-----------|
| Both SMS sent | `success: true` | "SMS sent" |
| Debit sent, credit skipped | `success: true` | "SMS sent (to you)" |
| Debit sent, credit failed | `success: true` | "Retrying credit SMS..." |
| Debit failed | `success: false` | "SMS failed, retrying..." |
| No beneficiary phone | `creditAlertSkipped: true` | "SMS sent to you" |

## SMS Content

### Debit Alert (To Sender)

```
ECOBANK ALERT: Your account debited NGN10,000 to Jane Smith. 
Balance: NGN50,000. Ref: TXN_12345
```

### Credit Alert (To Beneficiary)

```
ECOBANK ALERT: Your account credited NGN10,000 from John Doe. 
Balance: NGN20,000. Ref: TXN_12345
```

## Performance

- **Sender SMS:** Sent immediately after transaction
- **Beneficiary SMS:** Sent immediately after transaction
- **Retry logic:** Max 3 attempts with exponential backoff
- **Timeout:** 30 seconds per SMS send
- **Non-blocking:** Transaction shows as successful even if SMS fails

## Monitoring Points

1. **Console logs** - Check for phone resolution details
2. **SMS status** - Verify both sender and beneficiary alerts
3. **Error messages** - Check for beneficiary phone resolution errors
4. **Rate limiting** - Monitor 429 responses
5. **Delivery time** - Track SMS send duration

## Common Issues

### Credit SMS not sent?
- ✅ Check if platform is in `PLATFORM_CONFIGS`
- ✅ Verify beneficiary phone format
- ✅ Check if platform strategy is `NO_PHONE`
- ✅ Verify account number length if using `ACCOUNT_TO_PHONE`

### Invalid phone number error?
- ✅ Must be Nigerian number (starting with 234, 0, or +234)
- ✅ Must have 10+ digits after country code
- ✅ Spaces in phone OK (+234 801 234 5 67)
- ✅ Account-to-phone only works with 10-12 digit accounts

### SMS not sent at all?
- ✅ Check `VARTECH_API_KEY` is set
- ✅ Check `VARTECH_BASE_URL` is set
- ✅ Or set `SMS_DEMO_MODE=true` for testing
- ✅ Check network connectivity
- ✅ Check rate limiting not triggered

## Files to Know

| File | Purpose |
|------|---------|
| `lib/platform-phone-config.ts` | Platform configurations |
| `lib/production-alerts.ts` | SMS orchestration |
| `lib/sms-error-handler.ts` | Error handling |
| `components/transaction-success.tsx` | SMS status display |
| `app/api/sms/send/route.ts` | SMS API endpoint |

## Test Commands

```bash
# Run with demo mode (no real SMS)
SMS_DEMO_MODE=true npm run dev

# Check logs for SMS details
grep -i "ProductionAlert\|SMS\|beneficiary" .logs

# Test specific platform
# In browser console:
fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+2348012345 67',
    message: 'Test SMS',
    type: 'test'
  })
})
```

## Deployment Checklist

- [ ] `VARTECH_API_KEY` set in production
- [ ] `VARTECH_BASE_URL` set to `https://sms.thevartech.com/smsModule`
- [ ] `SMS_DEMO_MODE` not set (or false)
- [ ] Test transfer on each major platform
- [ ] Verify SMS sent to sender
- [ ] Verify SMS sent to beneficiary (if applicable)
- [ ] Monitor SMS cost impact
- [ ] Check error logs for issues

## Next Steps

1. **For Quick Testing:** Set `SMS_DEMO_MODE=true`
2. **For Production:** Set `VARTECH_API_KEY` and verify SMS gateway
3. **For Debugging:** Check transaction success screen logs
4. **For Monitoring:** Track SMS send success rates

## Questions?

Refer to:
- Full docs: `TRANSACTION_SMS_IMPLEMENTATION.md`
- Platform configs: `lib/platform-phone-config.ts`
- Production alerts: `lib/production-alerts.ts`
