export interface BankReceiptFormat {
  bankName: string
  logo?: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  template: string
  fields: string[]
}

export interface Receipt {
  id: string
  transactionId: string
  timestamp: number
  senderName: string
  senderBank: string
  senderPhone: string
  receiverName: string
  receiverBank?: string
  receiverPhone: string
  amount: number
  currency: string
  narration: string
  status: "pending" | "completed" | "failed"
  formattedReceipt?: string
  bankFormat?: BankReceiptFormat
}

interface TransactionData {
  id: string
  sender: {
    name: string
    bank: string
    phone: string
  }
  receiver: {
    name: string
    bank?: string
    phone: string
    accountNumber?: string
  }
  amount: number
  currency: string
  narration: string
}

// Bank receipt formats (simulated - in production these would be fetched from actual bank templates)
const BANK_FORMATS: Record<string, BankReceiptFormat> = {
  ecobank: {
    bankName: "Ecobank Nigeria",
    logo: "🏦",
    colors: {
      primary: "#C60C30",
      secondary: "#000000",
      accent: "#FFFFFF",
    },
    template: "ecobank_standard",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "narration"],
  },
  gtbank: {
    bankName: "Guaranty Trust Bank",
    logo: "🏢",
    colors: {
      primary: "#003366",
      secondary: "#FFFFFF",
      accent: "#FF6600",
    },
    template: "gtbank_premium",
    fields: ["transaction_ref", "date", "time", "sender", "receiver", "amount", "charges", "narration"],
  },
  access: {
    bankName: "Access Bank",
    logo: "🏛",
    colors: {
      primary: "#0066CC",
      secondary: "#CCCCCC",
      accent: "#003399",
    },
    template: "access_digital",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "balance", "narration"],
  },
  zenith: {
    bankName: "Zenith Bank",
    logo: "💎",
    colors: {
      primary: "#003DA5",
      secondary: "#FFFFFF",
      accent: "#F39200",
    },
    template: "zenith_standard",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "narration"],
  },
  firstbank: {
    bankName: "FirstBank Nigeria",
    logo: "🏪",
    colors: {
      primary: "#003DA5",
      secondary: "#FFFFFF",
      accent: "#FFB81C",
    },
    template: "firstbank_modern",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "narration"],
  },
  mtn_money: {
    bankName: "MTN Mobile Money",
    logo: "📱",
    colors: {
      primary: "#FFCC00",
      secondary: "#000000",
      accent: "#CC0000",
    },
    template: "mtn_mobile",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "balance", "narration"],
  },
  airtel_money: {
    bankName: "Airtel Money",
    logo: "📱",
    colors: {
      primary: "#FF0000",
      secondary: "#FFFFFF",
      accent: "#000000",
    },
    template: "airtel_mobile",
    fields: ["transaction_ref", "date", "sender", "receiver", "amount", "narration"],
  },
}

export class ReceiptAgent {
  private bankFormats: Map<string, BankReceiptFormat> = new Map()

  constructor() {
    // Initialize bank formats
    Object.entries(BANK_FORMATS).forEach(([key, format]) => {
      this.bankFormats.set(key.toLowerCase(), format)
    })
  }

  /**
   * Get or infer bank receipt format based on bank name
   */
  private getBankFormat(bankName: string): BankReceiptFormat {
    const normalizedName = bankName.toLowerCase().replace(/\s+/g, "_")

    // Try exact match first
    if (this.bankFormats.has(normalizedName)) {
      return this.bankFormats.get(normalizedName)!
    }

    // Try fuzzy matching
    for (const [key, format] of this.bankFormats) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return format
      }
    }

    // Default format
    return {
      bankName: bankName,
      logo: "🏦",
      colors: {
        primary: "#004A9F",
        secondary: "#FFFFFF",
        accent: "#666666",
      },
      template: "generic",
      fields: ["transaction_ref", "date", "sender", "receiver", "amount", "narration"],
    }
  }

  /**
   * Format receiver phone number for mobile payment platforms
   * Rule: If receiver's account number is their phone, format as 0 + account_number with no spaces
   */
  private formatReceiverPhone(receiver: { phone: string; accountNumber?: string }): string {
    // If account number is provided and looks like a phone number
    if (receiver.accountNumber) {
      // Remove any spaces and special characters
      const cleaned = receiver.accountNumber.replace(/\D/g, "")

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

    return receiver.phone
  }

  /**
   * Format sender ID as bank name followed by a period
   */
  private formatSenderId(bank: string): string {
    return `${bank}.`
  }

  /**
   * Generate receipt with formatted sender and receiver information
   */
  async generateReceipt(transaction: TransactionData): Promise<Receipt> {
    const receiptId = `RCP-${transaction.id}-${Date.now()}`

    try {
      const bankFormat = this.getBankFormat(transaction.sender.bank)

      // Format sender ID as bank name.
      const formattedSenderId = this.formatSenderId(transaction.sender.bank)

      // Format receiver phone for mobile payment platforms
      const formattedReceiverPhone = this.formatReceiverPhone({
        phone: transaction.receiver.phone,
        accountNumber: transaction.receiver.accountNumber,
      })

      const receipt: Receipt = {
        id: receiptId,
        transactionId: transaction.id,
        timestamp: Date.now(),
        senderName: transaction.sender.name,
        senderBank: transaction.sender.bank,
        senderPhone: formattedSenderId,
        receiverName: transaction.receiver.name,
        receiverBank: transaction.receiver.bank,
        receiverPhone: formattedReceiverPhone,
        amount: transaction.amount,
        currency: transaction.currency,
        narration: transaction.narration,
        status: "completed",
        bankFormat,
      }

      // Generate formatted receipt
      receipt.formattedReceipt = this.formatReceiptWithBankTemplate(receipt, bankFormat)

      // Log receipt generation
      if (actionLogger) {
        actionLogger.log("Receipt Generated", "success", "success", {
          receiptId,
          transactionId: transaction.id,
          senderBank: transaction.sender.bank,
          amount: transaction.amount,
        })
      }

      return receipt
    } catch (error) {
      if (actionLogger) {
        actionLogger.logError("Receipt Generation Failed", error as Error, {
          transactionId: transaction.id,
          sender: transaction.sender.bank,
        })
      }

      throw error
    }
  }

  /**
   * Format receipt according to specific bank template
   */
  private formatReceiptWithBankTemplate(receipt: Receipt, format: BankReceiptFormat): string {
    const divider = "═".repeat(50)

    return `
${divider}
${format.logo} ${format.bankName.toUpperCase()}
${divider}

TRANSACTION RECEIPT
Transaction ID: ${receipt.transactionId}
Receipt #: ${receipt.id}
Date & Time: ${new Date(receipt.timestamp).toLocaleString()}
Status: ✓ ${receipt.status.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM:
Name: ${receipt.senderName}
Bank: ${receipt.senderBank}
Sender ID: ${receipt.senderPhone}

TO:
Name: ${receipt.receiverName}
${receipt.receiverBank ? `Bank: ${receipt.receiverBank}` : ""}
Phone/Account: ${receipt.receiverPhone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AMOUNT: ${receipt.currency} ${receipt.amount.toLocaleString()}
NARRATION: ${receipt.narration}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${divider}
This is an automated receipt. Keep for your records.
For inquiries, contact ${format.bankName} support
${divider}
`
  }

  /**
   * Get receipt for a transaction
   */
  async getReceipt(transactionId: string): Promise<Receipt | null> {
    const stored = typeof window !== "undefined" ? localStorage.getItem(`receipt_${transactionId}`) : null

    if (stored) {
      return JSON.parse(stored)
    }

    return null
  }

  /**
   * Cache receipt in storage
   */
  async cacheReceipt(receipt: Receipt): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`receipt_${receipt.transactionId}`, JSON.stringify(receipt))
      } catch (error) {
        console.warn("[ReceiptAgent] Failed to cache receipt:", error)
      }
    }
  }

  /**
   * Export receipt as text
   */
  exportAsText(receipt: Receipt): string {
    return receipt.formattedReceipt || "Receipt not available"
  }

  /**
   * Export receipt as HTML
   */
  exportAsHTML(receipt: Receipt): string {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Transaction Receipt</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .receipt { background: white; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .section { margin: 15px 0; }
    .label { font-weight: bold; color: #555; }
    .value { margin-left: 10px; color: #333; }
    .divider { border-top: 1px dashed #999; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h2>${receipt.bankFormat?.bankName || "Bank Receipt"}</h2>
      <p>TRANSACTION RECEIPT</p>
    </div>
    
    <div class="section">
      <div><span class="label">Transaction ID:</span><span class="value">${receipt.transactionId}</span></div>
      <div><span class="label">Receipt #:</span><span class="value">${receipt.id}</span></div>
      <div><span class="label">Date & Time:</span><span class="value">${new Date(receipt.timestamp).toLocaleString()}</span></div>
      <div><span class="label">Status:</span><span class="value">✓ ${receipt.status.toUpperCase()}</span></div>
    </div>
    
    <div class="divider"></div>
    
    <div class="section">
      <h4>FROM</h4>
      <div><span class="label">Name:</span><span class="value">${receipt.senderName}</span></div>
      <div><span class="label">Bank:</span><span class="value">${receipt.senderBank}</span></div>
      <div><span class="label">Sender ID:</span><span class="value">${receipt.senderPhone}</span></div>
    </div>
    
    <div class="section">
      <h4>TO</h4>
      <div><span class="label">Name:</span><span class="value">${receipt.receiverName}</span></div>
      ${receipt.receiverBank ? `<div><span class="label">Bank:</span><span class="value">${receipt.receiverBank}</span></div>` : ""}
      <div><span class="label">Phone/Account:</span><span class="value">${receipt.receiverPhone}</span></div>
    </div>
    
    <div class="divider"></div>
    
    <div class="section">
      <h3>AMOUNT: ${receipt.currency} ${receipt.amount.toLocaleString()}</h3>
      <div><span class="label">Narration:</span><span class="value">${receipt.narration}</span></div>
    </div>
    
    <div class="divider"></div>
    <p style="text-align: center; font-size: 12px; color: #999;">Keep this receipt for your records</p>
  </div>
</body>
</html>
`
    return htmlContent
  }
}

// Global singleton instance
export const receiptAgent = new ReceiptAgent()
