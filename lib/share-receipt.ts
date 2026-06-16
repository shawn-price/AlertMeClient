/**
 * Share Receipt Utility - Handles sharing receipts via various channels
 */

export interface ReceiptShareData {
  receiptNumber: string
  transactionRef: string
  date: string
  time: string
  amount: number
  fee: number
  total: number
  senderName: string
  senderAccount: string
  senderBank: string
  recipientName: string
  recipientAccount: string
  recipientBank: string
  remark: string
  status: string
}

/**
 * Format receipt data as plain text for sharing
 */
export const formatReceiptAsText = (data: ReceiptShareData): string => {
  return `
ECOBANK NIGERIA - TRANSACTION RECEIPT
=====================================

Receipt No: ${data.receiptNumber}
Transaction Ref: ${data.transactionRef}
Date & Time: ${data.date} ${data.time}
Status: ${data.status}

TRANSACTION DETAILS
-------------------
From: ${data.senderName}
      ${data.senderAccount} • ${data.senderBank}

To: ${data.recipientName}
    ${data.recipientAccount} • ${data.recipientBank}

Description: ${data.remark}

AMOUNT BREAKDOWN
----------------
Transfer Amount: ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Transaction Fee: ₦${data.fee.toFixed(2)}
Total Debited: ₦${data.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}

---
This is a computer generated receipt and does not require signature.
For enquiries, call 0700-ECOBANK or visit www.ecobank.com
`.trim()
}

/**
 * Check if a specific sharing method is available
 */
export const isShareMethodAvailable = (method: string): boolean => {
  if (typeof window === 'undefined') return false

  switch (method) {
    case 'whatsapp':
      return true // WhatsApp Web/API available
    case 'email':
      return true // mailto: always available
    case 'sms':
      return !!(navigator as any).maxTouchPoints || /Android|iPhone|iPad|iPod/.test(navigator.userAgent)
    case 'bluetooth':
      return !!(navigator as any).bluetooth && 'requestDevice' in (navigator as any).bluetooth
    case 'native':
      return !!navigator.share
    default:
      return false
  }
}

/**
 * Share via WhatsApp
 */
export const shareViaWhatsApp = (data: ReceiptShareData) => {
  const text = formatReceiptAsText(data)
  const encodedText = encodeURIComponent(text)
  const whatsappUrl = `https://wa.me/?text=${encodedText}`
  window.open(whatsappUrl, '_blank')
}

/**
 * Share via SMS
 */
export const shareViaSMS = (data: ReceiptShareData) => {
  const text = formatReceiptAsText(data)
  const encodedText = encodeURIComponent(text)
  const smsUrl = `sms:?body=${encodedText}`
  window.location.href = smsUrl
}

/**
 * Share via Email
 */
export const shareViaEmail = (data: ReceiptShareData) => {
  const text = formatReceiptAsText(data)
  const subject = encodeURIComponent(`Transaction Receipt - ${data.receiptNumber}`)
  const body = encodeURIComponent(text)
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
  window.location.href = mailtoUrl
}

/**
 * Share via Native Share API (Android, iOS)
 */
export const shareViaWeb = async (data: ReceiptShareData) => {
  if (!navigator.share) {
    throw new Error('Web Share API not supported')
  }

  const text = formatReceiptAsText(data)

  try {
    await navigator.share({
      title: 'Transaction Receipt',
      text: text,
      url: window.location.href,
    })
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      throw err
    }
  }
}

/**
 * Share via Bluetooth (Web Bluetooth API)
 */
export const shareViaBluetooth = async (data: ReceiptShareData) => {
  try {
    const bluetooth = (navigator as any).bluetooth
    if (!bluetooth) {
      throw new Error('Bluetooth not supported on this device')
    }

    const device = await bluetooth.requestDevice({
      filters: [{ services: ['generic_access'] }],
      optionalServices: ['generic_access'],
    })

    const server = await device.gatt?.connect()
    console.log('Connected to device:', device.name)

    // In a real scenario, you would send the receipt data via Bluetooth
    // This is a simplified implementation
    return device
  } catch (err: any) {
    if (err.name !== 'NotFoundError') {
      throw err
    }
  }
}

/**
 * Main share function that handles all share methods
 */
export const shareReceipt = async (
  data: ReceiptShareData,
  method: 'whatsapp' | 'email' | 'sms' | 'bluetooth' | 'native'
) => {
  switch (method) {
    case 'whatsapp':
      shareViaWhatsApp(data)
      break
    case 'email':
      shareViaEmail(data)
      break
    case 'sms':
      shareViaSMS(data)
      break
    case 'bluetooth':
      await shareViaBluetooth(data)
      break
    case 'native':
      await shareViaWeb(data)
      break
    default:
      throw new Error(`Unknown share method: ${method}`)
  }
}
