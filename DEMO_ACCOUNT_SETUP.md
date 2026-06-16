# Demo Account Setup & Sample Data

## Default Account Credentials

### Login Information
```
Account Number: 0099348976
PIN: 1234
```

Both fields are pre-filled in the login screen for quick access during demo.

### Account Details
```
Name: ADEFEMI JOHN OLAYEMI
Phone: +234 801 234 5678
Email: john.olayemi@email.com
Address: 123 Lagos Street, Victoria Island, Lagos
BVN: 22123456789
Status: Active
Account Balance: ₦3,500,000.00
```

### Account Display
The dashboard displays the account number as:
```
****8976  (First 4 digits masked)
```

---

## Sample Data

### 20 Beneficiaries with Complete Data

All beneficiaries include: Name, Account Number, Bank, Phone Number

| ID | Name | Account # | Bank | Phone |
|----|------|-----------|------|-------|
| 1 | Pedro Banabas | 0348483930 | First Bank | +234 803 123 4567 |
| 2 | Sarah Johnson | 0123456789 | GTBank | +234 801 987 6543 |
| 3 | Chisom Nwosu | 1234567890 | Access Bank | +234 805 567 8901 |
| 4 | Amara Okonkwo | 2345678901 | Zenith Bank | +234 807 234 5678 |
| 5 | David Adeyemi | 3456789012 | UBA | +234 809 876 5432 |
| 6 | Nneka Okafor | 4567890123 | Fidelity Bank | +234 810 456 7890 |
| 7 | Tosin Oluwaseun | 5678901234 | GTBank | +234 812 789 0123 |
| 8 | Zainab Mohammed | 6789012345 | FCMB | +234 814 123 4567 |
| 9 | Chukwuma Ejiofor | 7890123456 | Ecobank | +234 816 567 8901 |
| 10 | Blessing Okoro | 8901234567 | Sterling Bank | +234 818 234 5678 |
| 11 | Michael Eze | 9012345678 | First Bank | +234 820 890 1234 |
| 12 | Ada Uchenna | 0912345678 | Access Bank | +234 821 456 7890 |
| 13 | Kunle Adebayo | 1923456789 | UBA | +234 822 123 4567 |
| 14 | Fatima Hassan | 2034567890 | First Bank | +234 823 789 0123 |
| 15 | Victor Oluwole | 3145678901 | GTBank | +234 824 456 7890 |
| 16 | Ngozi Okeke | 4256789012 | Zenith Bank | +234 825 012 3456 |
| 17 | Emmanuel Obi | 5367890123 | Ecobank | +234 826 678 9012 |
| 18 | Grace Ayokunle | 6478901234 | Fidelity Bank | +234 827 345 6789 |
| 19 | Samuel Ifeanyi | 7589012345 | Access Bank | +234 828 901 2345 |
| 20 | Cynthia Obinna | 8690123456 | Sterling Bank | +234 829 567 8901 |

**Access**: Settings → Beneficiary Management

---

## Transaction History

### 15 Sample Transactions

Starting balance: ₦3,500,000.00

#### Today (January 15, 2024)

1. **Transfer to First Bank** (DEBIT)
   - Amount: ₦150,000.00
   - Fee: ₦100.00
   - Recipient: Pedro Banabas
   - Account: 0348483930
   - Time: 2:45 PM
   - Status: Successful
   - Ref: TXN20240115001

2. **Salary Deposit** (CREDIT)
   - Amount: ₦500,000.00
   - Sender: Kunle Adebayo (UBA)
   - Account: 1923456789
   - Time: 11:20 AM
   - Status: Successful
   - Ref: TXN20240115002

#### Yesterday (January 14, 2024)

3. **Business Payment to GTBank** (DEBIT)
   - Amount: ₦75,000.00
   - Recipient: Sarah Johnson
   - Account: 0123456789
   - Fee: ₦100.00
   - Time: 3:15 PM
   - Status: Successful

4. **Personal Transfer via Mobile Money** (DEBIT)
   - Amount: ₦25,000.00
   - Recipient: Zainab Mohammed
   - Fee: ₦50.00
   - Time: 10:30 AM
   - Status: Successful

5. **MTN Airtime Bill Payment** (DEBIT)
   - Amount: ₦5,500.00
   - Fee: ₦0.00
   - Time: 9:05 AM
   - Status: Successful

#### Additional Transactions
- 10 more transactions spanning Jan 13-9 with varied amounts (₦40K-₦300K)
- All types: Transfers, Deposits, Bill Payments, ATM Withdrawals
- All marked as "Successful"

**Access**: Dashboard → Recent Transactions → See All

---

## Receipt Verification

### Receipt Information Displayed

After each transaction, users see a detailed receipt with:

#### Transaction Details
- Receipt Number (copyable)
- Transaction Reference
- Date & Time
- Amount
- Transaction Fee
- Total Deducted

#### Sender Information
- Full Name: ADEFEMI JOHN OLAYEMI
- Account Number: 0099348976
- Bank: Ecobank Nigeria

#### Recipient Information
- Name
- Account Number
- Bank

#### Remarks
- Transaction purpose/description
- Status
- Channel (Ecobank Mobile App)

### Receipt Actions
- Download Receipt (PDF) - simulated
- Share Receipt
  - WhatsApp
  - Email
  - SMS
  - More options
- Copy Receipt Number

### Back Button Behavior
When clicking back from receipt:
- Navigates to previous screen
- Transaction information persists in transaction history
- Can view receipt again from transaction detail screen

**Verification Steps**:
1. Go to Dashboard
2. Click "Send Money"
3. Select any beneficiary
4. Enter amount and complete transfer
5. View receipt
6. Click back button
7. Verify receipt info displays in transaction history
8. Click transaction to view receipt again

---

## Balance Information

### Current Account Balance
```
₦3,500,000.00
```

### Balance Display
- **Dashboard**: Shows full balance with hide/show toggle
- **Account Card**: Displayed in large font
- **Transactions**: Running balance after each transaction
- **Available Balance**: Shown as account balance

### Balance Updates
- Updates immediately after each transaction
- Reflects all debits and credits
- Synchronized across all screens
- Persists on app reload

---

## Testing Scenarios

### Scenario 1: Simple Transfer
1. Login with credentials above
2. Dashboard → Send Money → Domestic Transfer
3. Select "Pedro Banabas" from beneficiary dropdown
4. Enter amount: ₦50,000
5. Confirm with PIN (1234)
6. View receipt
7. Share via WhatsApp
8. Go back and verify transaction in history

### Scenario 2: Bill Payment
1. Dashboard → Send Money → Pay Bills
2. Select NEPA or MTN
3. Enter amount: ₦5,000
4. Complete transaction
5. Verify receipt shows "Bill Payment"
6. Check transaction history for bill payment marker

### Scenario 3: New Beneficiary
1. Dashboard → Send Money → Add New Beneficiary
2. Enter: Sarah Smith, 0987654321, GTBank, +234801111111
3. Complete transfer to new beneficiary
4. Verify new beneficiary appears in Beneficiary Management

### Scenario 4: Mobile Money Transfer
1. Dashboard → More → Mobile Money
2. Select MTN or Airtel Money
3. Enter recipient phone and amount
4. Verify SMS is sent
5. Check receipt for mobile money details

---

## Dashboard Quick Actions

From the main dashboard:

- **Add Money**: Quick access to receive funds
- **Send Money**: Transfer to any beneficiary
- **Pay Bills**: Utility and service payments
- **More**: Additional services
  - Loans
  - Virtual Cards
  - POS
  - Currency Exchange

---

## Settings & Customization

### SMS Gateway Settings
- Access via Settings → SMS Gateways
- Configure 4 providers (Infobip, SMSGlobal, EasySendSMS, Telnyx)
- Set priority order
- Test SMS delivery
- Enable/disable gateways

### Account Settings
- Update profile
- Change PIN
- Notification preferences
- Theme selection
- Language settings

### Beneficiary Management
- View all 20 sample beneficiaries
- Add new beneficiaries
- Edit existing beneficiaries
- Delete beneficiaries
- Search by name or bank

---

## Notes for Demo Users

1. **Pre-filled Login**: Account number and PIN are pre-filled for convenience
2. **Sample Data**: All beneficiaries and transactions are realistic sample data
3. **No Real Transactions**: Transfers are simulated; no actual money moves
4. **SMS Simulation**: SMS alerts show as "pending" then "sent" automatically
5. **Receipt Persistence**: All transaction info is preserved in local storage
6. **Network Status**: Green/red dot on header shows mock server connection

---

## Troubleshooting Demo Data

### Transaction Not Appearing
- Refresh the page (F5)
- Check transaction history → See All
- Verify transaction status is "Successful"

### Beneficiary Not Showing
- Go to Beneficiary Management
- Confirm beneficiary was added
- Search by name if list is long
- Verify account number format (10 digits)

### Receipt Not Displaying
- Return to transaction history
- Click on the transaction again
- Check if receipt shares properly to WhatsApp
- Verify all transaction fields are populated

### Balance Not Updated
- Manual refresh (F5)
- Check if transaction was "Successful"
- Verify fee was deducted
- Review transaction history for confirmation

---

**Demo Setup Complete!**  
**Last Updated**: January 15, 2024  
**Version**: 1.0.0
