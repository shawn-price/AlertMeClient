# SMS Alerts Testing Checklist

## Pre-Testing Requirements

- [ ] Application built successfully
- [ ] Browser Developer Tools available (F12)
- [ ] Test phone number available
- [ ] At least one SMS gateway credentials ready (Infobip, SMSGlobal, EasySendSMS, or Telnyx)
- [ ] Application running on localhost or deployed

## Quick Start Test (5 minutes)

### Step 1: Access SMS Settings
- [ ] Log in to application (Account: 0099348976, PIN: 1234)
- [ ] Open Settings (bottom menu → Settings)
- [ ] Click "SMS Gateways"
- [ ] Verify panel shows 4 gateways:
  - [ ] Infobip (Priority 1)
  - [ ] SMSGlobal (Priority 2)
  - [ ] EasySendSMS (Priority 3)
  - [ ] Telnyx (Priority 4)

### Step 2: Test Without Credentials
- [ ] Click "Test SMS" button
- [ ] Expected result:
  - [ ] Toast appears with message "No active SMS gateways"
  - [ ] Toast shows "No SMS gateways enabled"
  - [ ] Toast auto-dismisses after 3-4 seconds
- [ ] Check browser console (F12 → Console):
  - [ ] Should see message about no gateways enabled
  - [ ] No error messages

### Step 3: Enable a Gateway
- [ ] Expand any gateway section (e.g., Infobip)
- [ ] Click "Sign Up" or "Quick Login" link (opens provider in new tab)
- [ ] Return to settings, OR
- [ ] Enter test credentials if you have them:
  - [ ] API Key field
  - [ ] Additional fields per gateway
- [ ] Toggle "Enable" switch ON
- [ ] Click "Save Settings"
- [ ] Expected:
  - [ ] Toast notification shows "Settings saved"
  - [ ] Toggle stays enabled
  - [ ] Browser console shows update success

### Step 4: Test with One Gateway
- [ ] Click "Test SMS" again
- [ ] Watch toast progress:
  - [ ] Shows "Attempting gateway 1 of 1"
  - [ ] Shows loading spinner
  - [ ] After 2-3 seconds, shows result:
    - [ ] ✓ "Success" OR
    - [ ] ✗ "Failed" (check credentials)
- [ ] Check console logs for:
  - [ ] `[SMS] <gateway-name> attempt: success` or `failed`
  - [ ] No JavaScript errors

## Full Transaction Test (10 minutes)

### Step 1: Setup
- [ ] Have at least 1 SMS gateway enabled with credentials
- [ ] Settings saved successfully
- [ ] Return to Dashboard

### Step 2: Start Transfer
- [ ] Click "Send Money"
- [ ] Click "Domestic Transfer"
- [ ] Fill in transfer details:
  - [ ] Recipient Name: "Test Recipient" (or select beneficiary)
  - [ ] Account Number: "0348483930"
  - [ ] Bank: Select from dropdown (e.g., "First Bank")
  - [ ] Amount: "10,000"
  - [ ] Remark: "Test SMS verification"
- [ ] Check "Save as beneficiary"? Optional
- [ ] Click "Continue"

### Step 3: Review
- [ ] Verify details appear:
  - [ ] Recipient name shown
  - [ ] Account masked correctly (****3930)
  - [ ] Amount and fee calculated
  - [ ] Total shown
- [ ] Click "Continue"

### Step 4: PIN Confirmation
- [ ] Enter PIN: 1234
- [ ] Click "Submit"

### Step 5: Transfer Processing
- [ ] "Transfer Processing" screen appears
- [ ] Watch progress:
  - [ ] Step 1: "Verifying PIN" - checkmark appears
  - [ ] Step 2: "Processing Payment" - checkmark appears
  - [ ] Step 3: "Sending Money" - checkmark appears
- [ ] Progress bar reaches 100%
- [ ] Screen transitions to "Transaction Success"

### Step 6: Success Screen Verification
- [ ] "Transfer Successful" message shown
- [ ] Amount displayed correctly: ₦10,000.00
- [ ] Recipient name shown: "Test Recipient"
- [ ] SMS Status indicator shows:
  - [ ] Either "SMS sent" (green) OR
  - [ ] "SMS pending" (yellow)
  - [ ] NOT "SMS failed" (which would indicate issue)
- [ ] Transaction details shown below:
  - [ ] Bank: First Bank
  - [ ] Reference ID: <transaction-id>
  - [ ] Date/Time stamp
  - [ ] Fee: ₦100 or ₦30

### Step 7: Console Verification
Open DevTools Console (F12) and look for:
- [ ] `[v0] Transaction success notification added:`
- [ ] `[Transfer] Transaction added with ID: <id>`
- [ ] `[SMS] <gateway-name> attempt: success` (or one of the fallbacks)
- [ ] NO error messages with `[ERROR]` or `Error:`

### Step 8: Transaction History Verification
- [ ] Click "Back" on Success screen
- [ ] Navigate to "Transactions" or check Dashboard
- [ ] Verify new transaction appears:
  - [ ] Type: "Transfer to First Bank"
  - [ ] Amount: ₦10,000.00 (shown as debit)
  - [ ] Status: "Successful"
  - [ ] Recipient: "Test Recipient"
  - [ ] Reference: Matches success screen ID
- [ ] Click transaction to view details:
  - [ ] Sender name: "ADEFEMI JOHN OLAYEMI"
  - [ ] Sender account: "****8976" (masked)
  - [ ] Recipient: "Test Recipient"
  - [ ] Recipient account: "0348483930"
  - [ ] Recipient bank: "First Bank"
  - [ ] Fee: ₦30.00 (domestic) or ₦100.00 (other banks)

## Gateway Fallback Test (15 minutes)

### Setup for Fallback Testing
- [ ] Enable multiple gateways (2-4)
- [ ] Set priorities in order: 1, 2, 3, 4
- [ ] For 1st gateway: Use invalid/expired credentials
- [ ] For 2nd gateway: Use valid credentials OR
- [ ] For all: Use invalid (to test complete fallback chain)

### Step 1: Test SMS with Multiple Gateways
- [ ] Settings → SMS Gateways
- [ ] Click "Test SMS"
- [ ] Watch toast progress through gateways:
  - [ ] "Attempting: Infobip (1 of X)"
  - [ ] "Attempting: SMSGlobal (2 of X)"
  - [ ] Continue until success or all fail
- [ ] Check console for attempt logs:
  ```
  [SMS] infobip attempt: failed - Invalid key
  [SMS] smsglobal attempt: success
  ```
- [ ] Toast shows final result

### Step 2: Process Transaction with Fallback
- [ ] Start a new transfer (follow transaction test steps)
- [ ] Process through PIN confirmation
- [ ] During processing, monitor console:
  - [ ] First gateway attempt logged
  - [ ] If fails, next gateway attempted
  - [ ] Continue until success
- [ ] Transaction still completes (SMS is background)
- [ ] Success screen shows SMS status

## Edge Cases & Error Handling

### Test 1: Invalid Phone Number Format
- [ ] In settings, change phone number to invalid format
- [ ] Process transaction
- [ ] Expected: Transaction succeeds, SMS fails silently
- [ ] Console shows SMS error but transaction OK

### Test 2: Network Failure Simulation
- [ ] Open DevTools
- [ ] Go to Network tab
- [ ] Set Network throttling to "Offline"
- [ ] Try "Test SMS"
- [ ] Expected: Toast shows failure
- [ ] Restore network, try again
- [ ] Expected: SMS succeeds

### Test 3: Multiple Gateway Failure
- [ ] Disable all gateways
- [ ] Process transaction
- [ ] Expected: Transaction succeeds, no SMS sent
- [ ] Console shows "No SMS gateways enabled"

### Test 4: Recipient Account Number Target
- [ ] Verify recipient account appears in:
  - [ ] Review screen: masked (****3930)
  - [ ] Success screen: shown in details (0348483930)
  - [ ] Transaction detail view: shown in details (0348483930)
  - [ ] SMS message content: included in transaction info
  - [ ] Console logs: shown in transaction data

## Performance Checks

| Test | Expected | Result |
|------|----------|--------|
| SMS Test response | <5 seconds | [ ] Pass |
| Transaction completion | <3 seconds | [ ] Pass |
| Fallback gateway switch | <1 second | [ ] Pass |
| Toast notification | Immediate (<100ms) | [ ] Pass |
| Console logging | No slowdown | [ ] Pass |

## Sign-Off Checklist

- [ ] All quick start tests passed
- [ ] Full transaction test passed
- [ ] Gateway fallback tested
- [ ] Edge cases handled correctly
- [ ] Recipient account properly targeted
- [ ] SMS alerts triggered on transaction
- [ ] Console logs clean (no errors)
- [ ] Transaction history updated correctly
- [ ] Receipt displays all information
- [ ] Build completed successfully

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "No active SMS gateways" | Gateways disabled | Enable at least one gateway in settings |
| SMS test stuck on "Attempting" | Network issue | Check internet, retry |
| "Failed: All gateways failed" | Invalid credentials | Verify API keys and credentials |
| Transaction doesn't show SMS | SMS sent but not displayed | Refresh page, check settings |
| No console logs | Logging disabled or DevTools closed | Open DevTools (F12) and check Console tab |
| Toast not showing | Toast provider not initialized | Restart app, check network |
| Account number not visible | Display is masked by design | Check detail view for unmasked number |

## Success Criteria

SMS alerts system is considered working when:

1. ✓ Settings panel loads and displays all 4 gateways
2. ✓ At least one gateway can be configured with credentials
3. ✓ Test SMS succeeds with configured gateway
4. ✓ Transaction automatically triggers SMS alert
5. ✓ SMS is sent in background without blocking transaction
6. ✓ Fallback system switches to next gateway on failure
7. ✓ Console logs show clear attempt progression
8. ✓ Recipient account number is targeted correctly
9. ✓ Transaction history records all details
10. ✓ Build completes without errors

---

**Expected Time**: 30-45 minutes for complete verification
**Difficulty**: Medium
**Prerequisites**: SMS provider credentials
**Status**: Ready for testing

