"use client"

/**
 * SMS Alert Templates for Banking Transactions
 * Comprehensive templates for all banks and wallets in the system
 */

import { formatCurrency } from "@/lib/form-utils"
import { NIGERIAN_BANKS } from "@/lib/banks-data"

/**
 * Bank-specific SMS template mapping
 * Each bank and wallet has its own branded template format
 */
const BANK_SMS_TEMPLATES: Record<
  string,
  {
    debit: string
    credit: string
    balance: string
    lowBalance: string
  }
> = {
  "Access Bank": {
    debit: "ACCESS ALERT: Your account has been debited with NGN{amount} to {recipient}. Available Bal: NGN{balance}. Ref: {reference}",
    credit: "ACCESS ALERT: Your account has been credited with NGN{amount} from {sender}. Available Bal: NGN{balance}. Ref: {reference}",
    balance: "ACCESS ALERT: Your current account balance is NGN{balance}",
    lowBalance: "ACCESS ALERT: Low balance detected. Your balance is NGN{balance}. Please fund your account.",
  },
  "Citibank Nigeria": {
    debit: "CITI ALERT: Debit of NGN{amount} to {recipient}. Balance: NGN{balance}. Reference: {reference}",
    credit: "CITI ALERT: Credit of NGN{amount} from {sender}. Balance: NGN{balance}. Reference: {reference}",
    balance: "CITI ALERT: Your account balance is NGN{balance}",
    lowBalance: "CITI ALERT: Low balance warning. Your balance is NGN{balance}.",
  },
  "Ecobank Nigeria": {
    debit: "ECOBANK ALERT: Debit of NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "ECOBANK ALERT: Credit of NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "ECOBANK ALERT: Your account balance is NGN{balance}",
    lowBalance: "ECOBANK ALERT: Low balance warning. Your account balance is NGN{balance}. Please fund your account.",
  },
  "Fidelity Bank": {
    debit: "FIDELITY ALERT: Your account debited NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "FIDELITY ALERT: Your account credited NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "FIDELITY ALERT: Your current balance is NGN{balance}",
    lowBalance: "FIDELITY ALERT: Low balance. Your balance is NGN{balance}.",
  },
  "First Bank of Nigeria": {
    debit: "FIRST BANK ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "FIRST BANK ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "FIRST BANK ALERT: Your balance is NGN{balance}",
    lowBalance: "FIRST BANK ALERT: Low balance. Balance: NGN{balance}.",
  },
  "First City Monument Bank": {
    debit: "FCMB ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "FCMB ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "FCMB ALERT: Balance is NGN{balance}",
    lowBalance: "FCMB ALERT: Low balance. Bal: NGN{balance}.",
  },
  "Guaranty Trust Bank": {
    debit: "GTB ALERT: Debit of NGN{amount} to {recipient}. Available balance: NGN{balance}. Ref: {reference}",
    credit: "GTB ALERT: Credit of NGN{amount} from {sender}. Available balance: NGN{balance}. Ref: {reference}",
    balance: "GTB ALERT: Your available balance is NGN{balance}",
    lowBalance: "GTB ALERT: Low balance. Your balance is NGN{balance}.",
  },
  "Heritage Bank": {
    debit: "HERITAGE ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "HERITAGE ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "HERITAGE ALERT: Balance: NGN{balance}",
    lowBalance: "HERITAGE ALERT: Low balance. Bal: NGN{balance}.",
  },
  "Keystone Bank": {
    debit: "KEYSTONE ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "KEYSTONE ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "KEYSTONE ALERT: Your balance is NGN{balance}",
    lowBalance: "KEYSTONE ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Polaris Bank": {
    debit: "POLARIS ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "POLARIS ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "POLARIS ALERT: Your balance is NGN{balance}",
    lowBalance: "POLARIS ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Providus Bank": {
    debit: "PROVIDUS ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "PROVIDUS ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "PROVIDUS ALERT: Balance: NGN{balance}",
    lowBalance: "PROVIDUS ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Stanbic IBTC Bank": {
    debit: "STANBIC ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "STANBIC ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "STANBIC ALERT: Your balance is NGN{balance}",
    lowBalance: "STANBIC ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Standard Chartered Bank": {
    debit: "SCBNL ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "SCBNL ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "SCBNL ALERT: Balance: NGN{balance}",
    lowBalance: "SCBNL ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Sterling Bank": {
    debit: "STERLING ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "STERLING ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "STERLING ALERT: Your balance is NGN{balance}",
    lowBalance: "STERLING ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Union Bank of Nigeria": {
    debit: "UBN ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "UBN ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "UBN ALERT: Your balance is NGN{balance}",
    lowBalance: "UBN ALERT: Low balance. Balance: NGN{balance}.",
  },
  "United Bank For Africa": {
    debit: "UBA ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "UBA ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "UBA ALERT: Your account balance is NGN{balance}",
    lowBalance: "UBA ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Unity Bank": {
    debit: "UNITY ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "UNITY ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "UNITY ALERT: Balance: NGN{balance}",
    lowBalance: "UNITY ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Wema Bank": {
    debit: "WEMA ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "WEMA ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "WEMA ALERT: Your balance is NGN{balance}",
    lowBalance: "WEMA ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Zenith Bank": {
    debit: "ZENITH ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "ZENITH ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "ZENITH ALERT: Your account balance is NGN{balance}",
    lowBalance: "ZENITH ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Jaiz Bank": {
    debit: "JAIZ ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "JAIZ ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "JAIZ ALERT: Balance: NGN{balance}",
    lowBalance: "JAIZ ALERT: Low balance. Balance: NGN{balance}.",
  },
  "SunTrust Bank": {
    debit: "SUNTRUST ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "SUNTRUST ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "SUNTRUST ALERT: Balance: NGN{balance}",
    lowBalance: "SUNTRUST ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Titan Trust Bank": {
    debit: "TTB ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "TTB ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "TTB ALERT: Your balance is NGN{balance}",
    lowBalance: "TTB ALERT: Low balance. Balance: NGN{balance}.",
  },
  "Globus Bank": {
    debit: "GLOBUS ALERT: Debit NGN{amount} to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "GLOBUS ALERT: Credit NGN{amount} from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "GLOBUS ALERT: Balance: NGN{balance}",
    lowBalance: "GLOBUS ALERT: Low balance. Balance: NGN{balance}.",
  },
  "PremiumTrust Bank": {
    debit: "PTB ALERT: Debit NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "PTB ALERT: Credit NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "PTB ALERT: Your balance is NGN{balance}",
    lowBalance: "PTB ALERT: Low balance. Balance: NGN{balance}.",
  },
  // Wallets
  "Opay": {
    debit: "OPAY: NGN{amount} sent to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "OPAY: NGN{amount} received from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "OPAY: Your wallet balance is NGN{balance}",
    lowBalance: "OPAY: Low balance. Your wallet balance is NGN{balance}.",
  },
  "PalmPay": {
    debit: "PALMPAY: NGN{amount} deducted to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "PALMPAY: NGN{amount} credited from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "PALMPAY: Your balance is NGN{balance}",
    lowBalance: "PALMPAY: Low balance alert. Balance: NGN{balance}.",
  },
  "Kuda Bank": {
    debit: "KUDA: Sent NGN{amount} to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "KUDA: Received NGN{amount} from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "KUDA: Your account balance is NGN{balance}",
    lowBalance: "KUDA: Low balance. Balance: NGN{balance}.",
  },
  "Carbon": {
    debit: "CARBON: NGN{amount} transferred to {recipient}. Bal: NGN{balance}. Ref: {reference}",
    credit: "CARBON: NGN{amount} received from {sender}. Bal: NGN{balance}. Ref: {reference}",
    balance: "CARBON: Balance: NGN{balance}",
    lowBalance: "CARBON: Low balance. Balance: NGN{balance}.",
  },
  "Cowrywise": {
    debit: "COWRYWISE: NGN{amount} withdrawal. Balance: NGN{balance}. Ref: {reference}",
    credit: "COWRYWISE: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "COWRYWISE: Your balance is NGN{balance}",
    lowBalance: "COWRYWISE: Low balance alert. Balance: NGN{balance}.",
  },
  "PiggyVest": {
    debit: "PIGGYVEST: NGN{amount} savings transaction. Balance: NGN{balance}. Ref: {reference}",
    credit: "PIGGYVEST: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "PIGGYVEST: Your balance is NGN{balance}",
    lowBalance: "PIGGYVEST: Low balance. Balance: NGN{balance}.",
  },
  "Flutterwave": {
    debit: "FLUTTERWAVE: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "FLUTTERWAVE: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "FLUTTERWAVE: Balance: NGN{balance}",
    lowBalance: "FLUTTERWAVE: Low balance. Balance: NGN{balance}.",
  },
  "Paystack": {
    debit: "PAYSTACK: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "PAYSTACK: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "PAYSTACK: Your balance is NGN{balance}",
    lowBalance: "PAYSTACK: Low balance alert. Balance: NGN{balance}.",
  },
  "Interswitch": {
    debit: "INTERSWITCH: NGN{amount} transaction. Balance: NGN{balance}. Ref: {reference}",
    credit: "INTERSWITCH: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "INTERSWITCH: Balance: NGN{balance}",
    lowBalance: "INTERSWITCH: Low balance. Balance: NGN{balance}.",
  },
  "Paga": {
    debit: "PAGA: NGN{amount} sent to {recipient}. Balance: NGN{balance}. Ref: {reference}",
    credit: "PAGA: NGN{amount} received from {sender}. Balance: NGN{balance}. Ref: {reference}",
    balance: "PAGA: Your balance is NGN{balance}",
    lowBalance: "PAGA: Low balance alert. Balance: NGN{balance}.",
  },
  "Quickteller": {
    debit: "QUICKTELLER: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "QUICKTELLER: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "QUICKTELLER: Balance: NGN{balance}",
    lowBalance: "QUICKTELLER: Low balance. Balance: NGN{balance}.",
  },
  "Remita": {
    debit: "REMITA: NGN{amount} payment processed. Balance: NGN{balance}. Ref: {reference}",
    credit: "REMITA: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "REMITA: Your balance is NGN{balance}",
    lowBalance: "REMITA: Low balance alert. Balance: NGN{balance}.",
  },
  "VFD Microfinance Bank": {
    debit: "VFD: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "VFD: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "VFD: Your balance is NGN{balance}",
    lowBalance: "VFD: Low balance. Balance: NGN{balance}.",
  },
  "Rubies Bank": {
    debit: "RUBIES: NGN{amount} transaction. Balance: NGN{balance}. Ref: {reference}",
    credit: "RUBIES: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "RUBIES: Balance: NGN{balance}",
    lowBalance: "RUBIES: Low balance alert. Balance: NGN{balance}.",
  },
  "Sparkle Microfinance Bank": {
    debit: "SPARKLE: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "SPARKLE: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "SPARKLE: Your balance is NGN{balance}",
    lowBalance: "SPARKLE: Low balance. Balance: NGN{balance}.",
  },
  "Mint Finex MFB": {
    debit: "MINT: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "MINT: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "MINT: Balance: NGN{balance}",
    lowBalance: "MINT: Low balance alert. Balance: NGN{balance}.",
  },
  "GoMoney": {
    debit: "GOMONEY: NGN{amount} sent. Balance: NGN{balance}. Ref: {reference}",
    credit: "GOMONEY: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "GOMONEY: Your balance is NGN{balance}",
    lowBalance: "GOMONEY: Low balance. Balance: NGN{balance}.",
  },
  "Eyowo": {
    debit: "EYOWO: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "EYOWO: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "EYOWO: Balance: NGN{balance}",
    lowBalance: "EYOWO: Low balance alert. Balance: NGN{balance}.",
  },
  "Fairmoney": {
    debit: "FAIRMONEY: NGN{amount} transaction. Balance: NGN{balance}. Ref: {reference}",
    credit: "FAIRMONEY: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "FAIRMONEY: Your balance is NGN{balance}",
    lowBalance: "FAIRMONEY: Low balance. Balance: NGN{balance}.",
  },
  "NowNow Digital Systems": {
    debit: "NOWNOW: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "NOWNOW: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "NOWNOW: Balance: NGN{balance}",
    lowBalance: "NOWNOW: Low balance alert. Balance: NGN{balance}.",
  },
  "MoMo PSB (MTN)": {
    debit: "MOMO: NGN{amount} sent. Balance: NGN{balance}. Ref: {reference}",
    credit: "MOMO: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "MOMO: Your balance is NGN{balance}",
    lowBalance: "MOMO: Low balance. Balance: NGN{balance}.",
  },
  "Renmoney": {
    debit: "RENMONEY: NGN{amount} deducted. Balance: NGN{balance}. Ref: {reference}",
    credit: "RENMONEY: NGN{amount} credited. Balance: NGN{balance}. Ref: {reference}",
    balance: "RENMONEY: Balance: NGN{balance}",
    lowBalance: "RENMONEY: Low balance alert. Balance: NGN{balance}.",
  },
  "MONIPOINT MFB": {
    debit: "MONIPOINT: NGN{amount} transaction. Balance: NGN{balance}. Ref: {reference}",
    credit: "MONIPOINT: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "MONIPOINT: Your balance is NGN{balance}",
    lowBalance: "MONIPOINT: Low balance. Balance: NGN{balance}.",
  },
  "Plam Pay": {
    debit: "PLAMPAY: NGN{amount} sent. Balance: NGN{balance}. Ref: {reference}",
    credit: "PLAMPAY: NGN{amount} received. Balance: NGN{balance}. Ref: {reference}",
    balance: "PLAMPAY: Your balance is NGN{balance}",
    lowBalance: "PLAMPAY: Low balance alert. Balance: NGN{balance}.",
  },
}

/**
 * Get SMS template for a specific bank
 */
export function getBankTemplates(bankName: string): typeof BANK_SMS_TEMPLATES[keyof typeof BANK_SMS_TEMPLATES] {
  return (
    BANK_SMS_TEMPLATES[bankName] || {
      debit: "ALERT: Your account has been debited with NGN{amount} to {recipient}. Available balance: NGN{balance}. Reference: {reference}",
      credit: "ALERT: Your account has been credited with NGN{amount} from {sender}. Available balance: NGN{balance}. Reference: {reference}",
      balance: "ALERT: Your account balance is NGN{balance}",
      lowBalance: "ALERT: Low balance warning. Your balance is NGN{balance}. Please fund your account.",
    }
  )
}

/**
 * Generic alert generators (backward compatibility)
 */
export function generateDebitAlert(amount: number, recipient: string, balance: number, reference: string, bankName: string = "ECOBANK"): string {
  const templates = getBankTemplates(bankName)
  const template = templates.debit
  return template
    .replace("{amount}", formatCurrency(amount))
    .replace("{recipient}", recipient)
    .replace("{balance}", formatCurrency(balance))
    .replace("{reference}", reference)
}

export function generateCreditAlert(amount: number, sender: string, balance: number, reference: string, bankName: string = "ECOBANK"): string {
  const templates = getBankTemplates(bankName)
  const template = templates.credit
  return template
    .replace("{amount}", formatCurrency(amount))
    .replace("{sender}", sender)
    .replace("{balance}", formatCurrency(balance))
    .replace("{reference}", reference)
}

export function generateBalanceInquiryAlert(balance: number, bankName: string = "ECOBANK"): string {
  const templates = getBankTemplates(bankName)
  const template = templates.balance
  return template.replace("{balance}", formatCurrency(balance))
}

export function generateLowBalanceAlert(balance: number, bankName: string = "ECOBANK"): string {
  const templates = getBankTemplates(bankName)
  const template = templates.lowBalance
  return template.replace("{balance}", formatCurrency(balance))
}

/**
 * Format sender ID as bank name followed by a period
 * E.g., "Ecobank." or "MTN Money."
 */
export function formatSenderId(bankName: string): string {
  return `${bankName}.`
}

/**
 * Format receiver phone for mobile payment platforms
 * Rule: If account number is provided, format as 0 + account_number with no spaces
 * E.g., "0801234567" instead of "+2348012345 67"
 */
export function formatReceiverPhone(phone: string, accountNumber?: string): string {
  if (accountNumber) {
    // Remove any spaces and non-digits
    const cleaned = accountNumber.replace(/\D/g, "")

    // If cleaned account is 10 digits (Nigerian number), format as 0XXXXXXXXXX
    if (cleaned.length === 10) {
      return "0" + cleaned
    }

    // If already starts with 234, remove it and add 0
    if (cleaned.startsWith("234")) {
      return "0" + cleaned.slice(3)
    }

    return "0" + cleaned
  }

  // If no account number, try to format the phone number
  const cleanedPhone = phone.replace(/\D/g, "")
  if (cleanedPhone.length === 10) {
    return "0" + cleanedPhone
  }

  if (cleanedPhone.startsWith("234")) {
    return "0" + cleanedPhone.slice(3)
  }

  return phone
}

/**
 * Generate formatted debit alert with sender bank ID and formatted receiver phone
 */
export function generateFormattedDebitAlert(
  amount: number,
  senderBank: string,
  recipient: string,
  recipientPhone: string,
  recipientAccountNumber: string | undefined,
  balance: number,
  reference: string,
  bankName: string = "ECOBANK"
): string {
  const templates = getBankTemplates(bankName)
  let template = templates.debit

  const formattedSenderId = formatSenderId(senderBank)
  const formattedReceiverPhone = formatReceiverPhone(recipientPhone, recipientAccountNumber)

  return template
    .replace("{amount}", formatCurrency(amount))
    .replace("{recipient}", `${recipient} (${formattedReceiverPhone})`)
    .replace("{balance}", formatCurrency(balance))
    .replace("{reference}", `${reference} from ${formattedSenderId}`)
}

/**
 * Generate formatted credit alert for receiver with formatted phone/account
 */
export function generateFormattedCreditAlert(
  amount: number,
  senderName: string,
  senderBank: string,
  balance: number,
  reference: string,
  bankName: string = "ECOBANK"
): string {
  const templates = getBankTemplates(bankName)
  let template = templates.credit

  const formattedSenderId = formatSenderId(senderBank)

  return template
    .replace("{amount}", formatCurrency(amount))
    .replace("{sender}", `${senderName} (${formattedSenderId})`)
    .replace("{balance}", formatCurrency(balance))
    .replace("{reference}", reference)
}

/**
 * Get all available SMS templates
 */
export function getAllSMSTemplates(): Array<{
  bank: string
  type: "bank" | "wallet"
  templates: typeof BANK_SMS_TEMPLATES[keyof typeof BANK_SMS_TEMPLATES]
}> {
  return NIGERIAN_BANKS.map((bank) => ({
    bank: bank.name,
    type: bank.type,
    templates: getBankTemplates(bank.name),
  }))
}
