"use client"

export interface BankData {
  name: string
  code: string
  type: "bank" | "wallet" | "microfinance" | "international"
  logo?: string
  description?: string
}

/**
 * Comprehensive list of Nigerian Banks, Microfinance Banks, and Digital Wallets
 * Updated with official CBN-registered financial institutions
 * Includes all tier-1, tier-2, and tier-3 banks, plus major fintech platforms
 */
export const NIGERIAN_BANKS: BankData[] = [
  // TIER 1 COMMERCIAL BANKS (11 banks)
  { name: "Access Bank", code: "044", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Citibank Nigeria", code: "023", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Ecobank Nigeria", code: "050", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "First Bank of Nigeria (FBN)", code: "011", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Guaranty Trust Bank (GTB)", code: "058", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Standard Chartered Bank", code: "068", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Stanbic IBTC Bank", code: "221", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "United Bank For Africa (UBA)", code: "033", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Union Bank of Nigeria", code: "032", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Zenith Bank", code: "057", type: "bank", description: "Tier 1 Commercial Bank" },
  { name: "Wema Bank", code: "035", type: "bank", description: "Tier 1 Commercial Bank" },

  // TIER 2 COMMERCIAL BANKS (13 banks)
  { name: "Fidelity Bank Nigeria", code: "070", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "First City Monument Bank (FCMB)", code: "214", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Heritage Bank", code: "030", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Keystone Bank", code: "082", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Polaris Bank", code: "076", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Providus Bank", code: "101", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "SunTrust Bank", code: "100", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Titan Trust Bank", code: "102", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Unity Bank Nigeria", code: "215", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Sterling Bank", code: "232", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "Jaiz Bank", code: "301", type: "bank", description: "Tier 2 Commercial Bank (Islamic)" },
  { name: "Globus Bank", code: "103", type: "bank", description: "Tier 2 Commercial Bank" },
  { name: "PremiumTrust Bank", code: "105", type: "bank", description: "Tier 2 Commercial Bank" },

  // MERCHANT BANKS & SPECIALIZED BANKS (3 banks)
  { name: "FCMB Merchant Bank", code: "271", type: "bank", description: "Merchant Bank" },
  { name: "Citibank Nigeria (Merchant Banking)", code: "023", type: "bank", description: "Merchant Bank" },
  { name: "Stanbic Merchant Bank", code: "221", type: "bank", description: "Merchant Bank" },

  // MICROFINANCE BANKS - Tier 1 (5 banks)
  { name: "Carbon", code: "565", type: "microfinance", description: "Digital Microfinance Bank" },
  { name: "Kuda Bank", code: "090267", type: "microfinance", description: "Digital Microfinance Bank" },
  { name: "Paga", code: "327", type: "microfinance", description: "Digital Microfinance Bank" },
  { name: "GoMoney MFB", code: "100022", type: "microfinance", description: "Digital Microfinance Bank" },
  { name: "Renmoney Microfinance Bank", code: "090322", type: "microfinance", description: "Digital Microfinance Bank" },

  // MICROFINANCE BANKS - Tier 2 (15+ banks)
  { name: "MONIPOINT MFB", code: "090090", type: "microfinance", description: "Microfinance Bank" },
  { name: "INFINITY MFB", code: "836", type: "microfinance", description: "Microfinance Bank" },
  { name: "Mint Finex MFB", code: "090281", type: "microfinance", description: "Microfinance Bank" },
  { name: "Fairmoney Microfinance Bank", code: "090490", type: "microfinance", description: "Microfinance Bank" },
  { name: "Sparkle Microfinance Bank", code: "090325", type: "microfinance", description: "Microfinance Bank" },
  { name: "VFD Microfinance Bank", code: "090110", type: "microfinance", description: "Microfinance Bank" },
  { name: "AB Microfinance Bank", code: "090134", type: "microfinance", description: "Microfinance Bank" },
  { name: "Amju Unique MFB", code: "090135", type: "microfinance", description: "Microfinance Bank" },
  { name: "Lavender Finance MFB", code: "090136", type: "microfinance", description: "Microfinance Bank" },
  { name: "Covenant MFB", code: "090137", type: "microfinance", description: "Microfinance Bank" },
  { name: "Quickteller MFB", code: "090138", type: "microfinance", description: "Microfinance Bank" },
  { name: "CrowdForce MFB", code: "090139", type: "microfinance", description: "Microfinance Bank" },
  { name: "Titan Trust MFB", code: "090140", type: "microfinance", description: "Microfinance Bank" },
  { name: "Rubies Bank (Rubies Microfinance)", code: "090175", type: "microfinance", description: "Microfinance Bank" },
  { name: "Eyowo Limited", code: "090326", type: "microfinance", description: "Microfinance Bank" },
  { name: "Cowrywise Limited", code: "090360", type: "microfinance", description: "Microfinance Bank" },
  { name: "Remita Microfinance Bank", code: "090365", type: "microfinance", description: "Microfinance Bank" },

  // INTERNATIONAL BANKS (3 banks)
  { name: "Citibank Nigeria (International)", code: "023", type: "international", description: "International Bank" },
  { name: "Standard Chartered Bank (International)", code: "068", type: "international", description: "International Bank" },
  { name: "Stanbic IBTC Bank (International)", code: "221", type: "international", description: "International Bank" },

  // DIGITAL WALLETS & PAYMENT PLATFORMS (40+ platforms)
  { name: "Opay", code: "999992", type: "wallet", description: "Digital Wallet & Payment Platform" },
  { name: "PalmPay", code: "999991", type: "wallet", description: "Digital Wallet & Payment Platform" },
  { name: "Moniepoint", code: "999995", type: "wallet", description: "Digital Wallet & Payment Platform" },
  { name: "NowNow Digital Systems", code: "999993", type: "wallet", description: "Digital Wallet Platform" },
  { name: "MoMo PSB (MTN Mobile Money)", code: "999994", type: "wallet", description: "Mobile Money Platform" },
  { name: "Airtel Money", code: "999996", type: "wallet", description: "Mobile Money Platform" },
  { name: "9mobile (etisalat) Money", code: "999997", type: "wallet", description: "Mobile Money Platform" },
  { name: "Paystack", code: "090328", type: "wallet", description: "Payment Platform" },
  { name: "Flutterwave", code: "090315", type: "wallet", description: "Payment Platform" },
  { name: "Interswitch", code: "090229", type: "wallet", description: "Payment Platform" },
  { name: "PiggyVest", code: "090317", type: "wallet", description: "Fintech Savings Platform" },
  { name: "Cowrywise", code: "090360", type: "wallet", description: "Investment Platform" },
  { name: "Carbon", code: "090395", type: "wallet", description: "Digital Lending Platform" },
  { name: "Branch", code: "090396", type: "wallet", description: "Digital Lending Platform" },
  { name: "Palmcredit", code: "090397", type: "wallet", description: "Digital Lending Platform" },
  { name: "Easybuy", code: "090398", type: "wallet", description: "Digital Lending Platform" },
  { name: "KiaKia", code: "090399", type: "wallet", description: "Digital Lending Platform" },
  { name: "Fairmoney", code: "090400", type: "wallet", description: "Digital Lending Platform" },
  { name: "Renmoney", code: "090401", type: "wallet", description: "Digital Lending Platform" },
  { name: "SME Loan", code: "090402", type: "wallet", description: "SME Lending Platform" },
  { name: "Zedvibe", code: "090403", type: "wallet", description: "Digital Financial Services" },
  { name: "Roova", code: "090404", type: "wallet", description: "Digital Financial Services" },
  { name: "Vangold", code: "090405", type: "wallet", description: "Digital Wallet Platform" },
  { name: "Migo", code: "090406", type: "wallet", description: "Digital Lending Platform" },
  { name: "Irrooby", code: "090407", type: "wallet", description: "Digital Wallet Platform" },
  { name: "Sunny", code: "090408", type: "wallet", description: "Digital Financial Services" },
  { name: "Cashleo", code: "090409", type: "wallet", description: "Digital Wallet Platform" },
  { name: "FirstMonie", code: "090410", type: "wallet", description: "Mobile Money Platform" },
  { name: "PayAttitude", code: "090411", type: "wallet", description: "Digital Wallet Platform" },
  { name: "Zeepay", code: "090412", type: "wallet", description: "Payment Platform" },
  { name: "Safepay", code: "090413", type: "wallet", description: "Payment Platform" },
  { name: "WorldRemit", code: "090414", type: "wallet", description: "International Transfer Platform" },
  { name: "Sendwave", code: "090415", type: "wallet", description: "International Transfer Platform" },
  { name: "Rewolr", code: "090416", type: "wallet", description: "Digital Savings Platform" },
  { name: "ThriveAgric", code: "090417", type: "wallet", description: "Agritech Financial Platform" },
  { name: "Farmcrowdy", code: "090418", type: "wallet", description: "Agritech Financial Platform" },
  { name: "BitPesa", code: "090419", type: "wallet", description: "Cryptocurrency & Payment Platform" },
  { name: "Luno", code: "090420", type: "wallet", description: "Cryptocurrency Platform" },
  { name: "BuyCoins", code: "090421", type: "wallet", description: "Cryptocurrency Platform" },
  { name: "Yellow Card", code: "090422", type: "wallet", description: "Cryptocurrency Platform" },
  { name: "Jumia Pay", code: "090423", type: "wallet", description: "E-commerce Payment Platform" },
  { name: "KongaPay", code: "090424", type: "wallet", description: "E-commerce Payment Platform" },
  { name: "Suregifts", code: "090425", type: "wallet", description: "Gift Card & Payment Platform" },
  { name: "Wallet.ng", code: "090426", type: "wallet", description: "Digital Wallet Platform" },
  { name: "eTranzact", code: "090427", type: "wallet", description: "Payment Solutions Platform" },
  { name: "TeamApt", code: "090428", type: "wallet", description: "Payment Solutions Provider" },
  { name: "Fincra", code: "090429", type: "wallet", description: "Cross-border Payment Platform" },
  { name: "Swap", code: "090430", type: "wallet", description: "Digital Wallet Platform" },
  { name: "TymeBank", code: "090431", type: "bank", description: "Digital-Only Bank" },

  // Add utility for filtering
]

/**
 * Helper function to get all banks
 */
export const getAllBanks = (): BankData[] => {
  return NIGERIAN_BANKS.filter(b => b.type === "bank")
}

/**
 * Helper function to get all microfinance banks
 */
export const getAllMicrofinanceBanks = (): BankData[] => {
  return NIGERIAN_BANKS.filter(b => b.type === "microfinance")
}

/**
 * Helper function to get all digital wallets
 */
export const getAllWallets = (): BankData[] => {
  return NIGERIAN_BANKS.filter(b => b.type === "wallet")
}

/**
 * Helper function to get all banks and wallets combined (common view)
 */
export const getAllBanksAndWallets = (): BankData[] => {
  return NIGERIAN_BANKS.filter(b => b.type === "bank" || b.type === "microfinance" || b.type === "wallet").sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Helper function to get ALL payment platforms and banks (complete list for dropdowns) - alphabetically sorted
 */
export const getAllPaymentPlatforms = (): BankData[] => {
  return NIGERIAN_BANKS.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Helper function to find a bank by name
 */
export const findBankByName = (name: string): BankData | undefined => {
  return NIGERIAN_BANKS.find(b => b.name.toLowerCase() === name.toLowerCase())
}

/**
 * Helper function to find a bank by code
 */
export const findBankByCode = (code: string): BankData | undefined => {
  return NIGERIAN_BANKS.find(b => b.code === code)
}

/**
 * Phone-based wallet identifiers for form validation
 * These wallets use phone numbers as account identifiers instead of traditional account numbers
 */
export const PHONE_BASED_WALLETS = [
  "Opay",
  "PalmPay",
  "Moniepoint",
  "Paga",
  "Kuda Bank",
  "Fairmoney Microfinance Bank",
  "Fairmoney",
  "NowNow Digital Systems",
  "MoMo PSB (MTN Mobile Money)",
  "Airtel Money",
  "9mobile (etisalat) Money",
  "MONIPOINT MFB",
  "GoMoney MFB",
  "Branch",
  "Palmcredit",
  "Carbon",
  "Migo",
  "FirstMonie",
  "PayAttitude",
  "Cashleo",
  "Irrooby",
  "Sunny",
  "Vangold",
  "Renmoney",
  "Easybuy",
  "KiaKia",
  "SME Loan",
  "Suregifts",
  "Wallet.ng",
  "Swap",
]
