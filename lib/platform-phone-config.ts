/**
 * Platform-specific phone number configuration
 * Defines how different payment platforms handle phone numbers and account identifiers
 *
 * Each platform can have one of three phone resolution strategies:
 * 1. EXPLICIT_PHONE - Use the 'phone' field directly if available
 * 2. ACCOUNT_TO_PHONE - Convert account number to phone (prefix +234)
 * 3. NO_PHONE - Platform doesn't support SMS to beneficiary (e.g., card transfers)
 */

export enum PhoneResolutionStrategy {
  EXPLICIT_PHONE = "EXPLICIT_PHONE",
  ACCOUNT_TO_PHONE = "ACCOUNT_TO_PHONE",
  NO_PHONE = "NO_PHONE",
}

export interface PlatformPhoneConfig {
  name: string
  strategy: PhoneResolutionStrategy
  description: string
  /**
   * Phone format validation regex
   * Used to validate if a resolved phone number is valid
   */
  phoneValidationPattern?: RegExp
  /**
   * Account number length constraints
   * Used to validate if account can be converted to phone
   */
  accountLengthMin?: number
  accountLengthMax?: number
}

/**
 * Platform configurations for phone number handling
 * Key is the platform/bank name (case-insensitive)
 */
export const PLATFORM_CONFIGS: Record<string, PlatformPhoneConfig> = {
  // Banks with explicit phone fields
  "Access Bank": {
    name: "Access Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Citibank Nigeria": {
    name: "Citibank Nigeria",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Ecobank Nigeria": {
    name: "Ecobank Nigeria",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Fidelity Bank": {
    name: "Fidelity Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "First Bank of Nigeria": {
    name: "First Bank of Nigeria",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "First City Monument Bank": {
    name: "First City Monument Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Guaranty Trust Bank": {
    name: "Guaranty Trust Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Heritage Bank": {
    name: "Heritage Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Keystone Bank": {
    name: "Keystone Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Polaris Bank": {
    name: "Polaris Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Providus Bank": {
    name: "Providus Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Stanbic IBTC Bank": {
    name: "Stanbic IBTC Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Standard Chartered Bank": {
    name: "Standard Chartered Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Sterling Bank": {
    name: "Sterling Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Union Bank of Nigeria": {
    name: "Union Bank of Nigeria",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "United Bank For Africa": {
    name: "United Bank For Africa",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Unity Bank": {
    name: "Unity Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Wema Bank": {
    name: "Wema Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Zenith Bank": {
    name: "Zenith Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Jaiz Bank": {
    name: "Jaiz Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "SunTrust Bank": {
    name: "SunTrust Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Titan Trust Bank": {
    name: "Titan Trust Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "Globus Bank": {
    name: "Globus Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },
  "PremiumTrust Bank": {
    name: "PremiumTrust Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Banks typically store explicit phone numbers",
  },

  // Wallets that use phone-like account identifiers (can be converted)
  "Opay": {
    name: "Opay",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers are phone-format identifiers (convertible to +234)",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
  "PalmPay": {
    name: "PalmPay",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers are phone-format identifiers (convertible to +234)",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
  "Kuda Bank": {
    name: "Kuda Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Primarily uses explicit phone numbers",
  },
  "Carbon": {
    name: "Carbon",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers can be converted to phone identifiers",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
  "Cowrywise": {
    name: "Cowrywise",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "PiggyVest": {
    name: "PiggyVest",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Flutterwave": {
    name: "Flutterwave",
    strategy: PhoneResolutionStrategy.NO_PHONE,
    description: "Payment platform - typically no direct beneficiary SMS",
  },
  "Paystack": {
    name: "Paystack",
    strategy: PhoneResolutionStrategy.NO_PHONE,
    description: "Payment platform - typically no direct beneficiary SMS",
  },
  "Interswitch": {
    name: "Interswitch",
    strategy: PhoneResolutionStrategy.NO_PHONE,
    description: "Payment platform - typically no direct beneficiary SMS",
  },
  "Paga": {
    name: "Paga",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers can be phone identifiers",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
  "Quickteller": {
    name: "Quickteller",
    strategy: PhoneResolutionStrategy.NO_PHONE,
    description: "Bill payment platform - no direct beneficiary SMS",
  },
  "Remita": {
    name: "Remita",
    strategy: PhoneResolutionStrategy.NO_PHONE,
    description: "Payment platform - no direct beneficiary SMS",
  },
  "VFD Microfinance Bank": {
    name: "VFD Microfinance Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Rubies Bank": {
    name: "Rubies Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Sparkle Microfinance Bank": {
    name: "Sparkle Microfinance Bank",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Mint Finex MFB": {
    name: "Mint Finex MFB",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "GoMoney": {
    name: "GoMoney",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Eyowo": {
    name: "Eyowo",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Fairmoney": {
    name: "Fairmoney",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "NowNow Digital Systems": {
    name: "NowNow Digital Systems",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "MoMo PSB (MTN)": {
    name: "MoMo PSB (MTN)",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers can be phone identifiers",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
  "Renmoney": {
    name: "Renmoney",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "MONIPOINT MFB": {
    name: "MONIPOINT MFB",
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Uses explicit phone numbers",
  },
  "Plam Pay": {
    name: "Plam Pay",
    strategy: PhoneResolutionStrategy.ACCOUNT_TO_PHONE,
    description: "Account numbers can be phone identifiers",
    accountLengthMin: 10,
    accountLengthMax: 12,
  },
}

/**
 * Get platform configuration by name (case-insensitive)
 * Returns default EXPLICIT_PHONE strategy if platform not found
 */
export function getPlatformConfig(platformName: string | undefined): PlatformPhoneConfig {
  if (!platformName) {
    return {
      name: "Unknown",
      strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
      description: "Default configuration - assumes explicit phone field",
    }
  }

  const normalized = platformName.toLowerCase()
  const config = Object.values(PLATFORM_CONFIGS).find((c) => c.name.toLowerCase() === normalized)

  if (config) {
    return config
  }

  // Default fallback
  return {
    name: platformName,
    strategy: PhoneResolutionStrategy.EXPLICIT_PHONE,
    description: "Default configuration - assumes explicit phone field",
  }
}

/**
 * Resolve beneficiary phone number based on platform strategy
 *
 * Algorithm:
 * 1. Get platform config
 * 2. Based on strategy:
 *    - EXPLICIT_PHONE: Use phone field if available
 *    - ACCOUNT_TO_PHONE: Convert account number to phone (prefix +234) if valid length
 *    - NO_PHONE: Return null
 * 3. Return null if no phone can be resolved
 */
export function resolveBeneficiaryPhone(
  beneficiary: any,
  platformName: string | undefined
): string | null {
  if (!beneficiary) {
    return null
  }

  const config = getPlatformConfig(platformName)

  switch (config.strategy) {
    case PhoneResolutionStrategy.EXPLICIT_PHONE:
      // Strategy 1: Use explicit phone field
      if (beneficiary.phone && typeof beneficiary.phone === "string") {
        const phone = beneficiary.phone.trim()
        if (phone.length > 0) {
          return phone
        }
      }
      // Fallback: try account number conversion even for EXPLICIT_PHONE platforms
      // (in case only account is available)
      if (beneficiary.accountNumber) {
        const converted = convertAccountToPhone(beneficiary.accountNumber)
        if (converted) return converted
      }
      return null

    case PhoneResolutionStrategy.ACCOUNT_TO_PHONE:
      // Strategy 2: Try explicit phone first, then account conversion
      if (beneficiary.phone && typeof beneficiary.phone === "string") {
        const phone = beneficiary.phone.trim()
        if (phone.length > 0) {
          return phone
        }
      }
      // If no explicit phone, convert account to phone
      if (beneficiary.accountNumber) {
        const converted = convertAccountToPhone(
          beneficiary.accountNumber,
          config.accountLengthMin,
          config.accountLengthMax
        )
        if (converted) return converted
      }
      return null

    case PhoneResolutionStrategy.NO_PHONE:
      // Strategy 3: Platform doesn't support SMS to beneficiary
      console.log(`[SMS] Platform "${config.name}" does not support SMS alerts to beneficiary`)
      return null

    default:
      return null
  }
}

/**
 * Convert account number to phone format (+234 prefix)
 * Only converts if account length matches expected phone format (10-12 digits)
 *
 * Examples:
 * - "0801234567" -> "+2348012345 67" (10 digits)
 * - "8012345678" -> "+2348012345678" (10 digits)
 * - "08012345678901" -> "+23408012345678901" (invalid, too long)
 */
function convertAccountToPhone(
  accountNumber: string,
  minLength: number = 10,
  maxLength: number = 12
): string | null {
  if (!accountNumber || typeof accountNumber !== "string") {
    return null
  }

  // Remove any non-digit characters
  const digits = accountNumber.replace(/\D/g, "")

  // Check if within acceptable length range
  if (digits.length < minLength || digits.length > maxLength) {
    return null
  }

  // If already starts with 234 (international format), use as-is
  if (digits.startsWith("234")) {
    return `+${digits}`
  }

  // If starts with 0 (local format), replace with 234
  if (digits.startsWith("0")) {
    return `+234${digits.slice(1)}`
  }

  // Otherwise, assume it's without country code and add 234
  return `+234${digits}`
}

/**
 * Validate a resolved phone number
 */
export function validateBeneficiaryPhone(phone: string | null): boolean {
  if (!phone) return false

  // Must be a string with at least +234 and 10 digits minimum
  // Pattern: +234 followed by 10 digits
  const phoneRegex = /^\+234\d{10,}$/
  return phoneRegex.test(phone)
}
