import {
  generateDebitAlert,
  generateCreditAlert,
  generateBalanceInquiryAlert,
  generateLowBalanceAlert,
  getAllSMSTemplates,
} from "./alert-templates"
import { NIGERIAN_BANKS } from "./banks-data"

export interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  category: "transaction" | "marketing" | "notification"
}

export class SMSService {
  static generateDebitAlert = generateDebitAlert
  static generateCreditAlert = generateCreditAlert
  static generateBalanceInquiryAlert = generateBalanceInquiryAlert
  static generateLowBalanceAlert = generateLowBalanceAlert

  static async getTemplateForBank(bankName: string): Promise<SMSTemplate | null> {
    const templates = this.getDefaultTemplates()
    const bankTemplate = templates.find(template => 
      template.name.toLowerCase().includes(bankName.toLowerCase())
    )
    return bankTemplate || null
  }

  /**
   * Get all SMS templates for a specific bank
   */
  static getTemplatesForBank(bankName: string): SMSTemplate[] {
    const templates = this.getDefaultTemplates()
    return templates.filter(template => 
      template.name.toLowerCase().includes(bankName.toLowerCase())
    )
  }

  /**
   * Get templates by type (debit, credit, balance, low_balance)
   */
  static getTemplatesByType(bankName: string, type: "debit" | "credit" | "balance" | "low_balance"): SMSTemplate | undefined {
    const bankTemplates = this.getTemplatesForBank(bankName)
    return bankTemplates.find(t => t.id.includes(type))
  }

  /**
   * Get all available banks with their template counts
   */
  static getBanksWithTemplates(): Array<{ name: string; type: "bank" | "wallet"; templateCount: number }> {
    const templates = this.getDefaultTemplates()
    const bankCounts: Record<string, { type: "bank" | "wallet"; count: number }> = {}

    templates.forEach(template => {
      const bankName = template.name.split(" - ")[0]
      const bank = NIGERIAN_BANKS.find(b => b.name === bankName)
      if (bank && !bankCounts[bank.name]) {
        bankCounts[bank.name] = { type: bank.type, count: 0 }
      }
      if (bankCounts[bankName]) {
        bankCounts[bankName].count++
      }
    })

    return Object.entries(bankCounts).map(([name, data]) => ({
      name,
      type: data.type,
      templateCount: data.count,
    }))
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/
    return phoneRegex.test(phone.replace(/\s+/g, ""))
  }

  static formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, "")

    if (cleaned.startsWith("0")) {
      cleaned = "+234" + cleaned.substring(1)
    } else if (cleaned.startsWith("234")) {
      cleaned = "+" + cleaned
    } else if (!cleaned.startsWith("+234")) {
      cleaned = "+234" + cleaned
    }

    return cleaned
  }

  static getDefaultTemplates(): SMSTemplate[] {
    // Generate templates for all banks and wallets
    const allTemplates: SMSTemplate[] = []
    const bankTemplates = getAllSMSTemplates()

    // Create templates for each bank
    bankTemplates.forEach((bankData, index) => {
      // Debit alert template
      allTemplates.push({
        id: `debit_${bankData.bank.toLowerCase().replace(/\s+/g, "_")}`,
        name: `${bankData.bank} - Debit Alert`,
        content: bankData.templates.debit,
        variables: ["amount", "recipient", "balance", "reference"],
        category: "transaction",
      })

      // Credit alert template
      allTemplates.push({
        id: `credit_${bankData.bank.toLowerCase().replace(/\s+/g, "_")}`,
        name: `${bankData.bank} - Credit Alert`,
        content: bankData.templates.credit,
        variables: ["amount", "sender", "balance", "reference"],
        category: "transaction",
      })

      // Balance inquiry template
      allTemplates.push({
        id: `balance_${bankData.bank.toLowerCase().replace(/\s+/g, "_")}`,
        name: `${bankData.bank} - Balance Alert`,
        content: bankData.templates.balance,
        variables: ["balance"],
        category: "notification",
      })

      // Low balance template
      allTemplates.push({
        id: `low_balance_${bankData.bank.toLowerCase().replace(/\s+/g, "_")}`,
        name: `${bankData.bank} - Low Balance Alert`,
        content: bankData.templates.lowBalance,
        variables: ["balance"],
        category: "notification",
      })
    })

    return allTemplates
  }

  static processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      processed = processed.replace(new RegExp(placeholder, "g"), value)
    })

    return processed
  }
}
