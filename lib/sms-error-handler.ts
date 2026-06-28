/**
 * SMS Error Handler - Comprehensive error handling for SMS transactions
 * Implements retry logic, error categorization, and user-friendly messaging
 */

export enum SMSErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_PHONE = "INVALID_PHONE",
  THROTTLE_LIMIT = "THROTTLE_LIMIT",
  INVALID_RECIPIENT = "INVALID_RECIPIENT",
  DELIVERY_FAILED = "DELIVERY_FAILED",
  TIMEOUT = "TIMEOUT",
  MISSING_BENEFICIARY_PHONE = "MISSING_BENEFICIARY_PHONE",
  UNSUPPORTED_PLATFORM = "UNSUPPORTED_PLATFORM",
  UNKNOWN = "UNKNOWN",
}

export interface SMSError {
  type: SMSErrorType
  message: string
  originalError?: Error
  retryable: boolean
  retryCount?: number
  maxRetries?: number
}

export interface SMSRetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: SMSRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

const ERROR_MESSAGES: Record<SMSErrorType, string> = {
  [SMSErrorType.NETWORK_ERROR]: "Network connection failed. Please check your internet connection and try again.",
  [SMSErrorType.INVALID_PHONE]: "Invalid phone number format. Please enter a valid Nigerian mobile number.",
  [SMSErrorType.THROTTLE_LIMIT]: "Too many SMS requests. Please wait a few minutes before trying again.",
  [SMSErrorType.INVALID_RECIPIENT]: "Recipient information could not be verified. Please check and try again.",
  [SMSErrorType.DELIVERY_FAILED]: "SMS delivery failed. The message could not be sent to the recipient.",
  [SMSErrorType.TIMEOUT]: "Request timed out. Please try again.",
  [SMSErrorType.MISSING_BENEFICIARY_PHONE]: "Beneficiary phone number not available. SMS alert will not be sent to beneficiary.",
  [SMSErrorType.UNSUPPORTED_PLATFORM]: "This platform does not support direct SMS alerts to beneficiary.",
  [SMSErrorType.UNKNOWN]: "An unexpected error occurred while sending SMS. Please try again.",
}

/**
 * Categorize error and determine if it's retryable
 */
export function categorizeSMSError(error: any): SMSError {
  const originalError = error instanceof Error ? error : new Error(String(error))

  // Network errors
  if (originalError.message.includes("network") || originalError.message.includes("ECONNREFUSED")) {
    return {
      type: SMSErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES[SMSErrorType.NETWORK_ERROR],
      originalError,
      retryable: true,
    }
  }

  // Phone validation errors
  if (originalError.message.includes("phone") || originalError.message.includes("number")) {
    return {
      type: SMSErrorType.INVALID_PHONE,
      message: ERROR_MESSAGES[SMSErrorType.INVALID_PHONE],
      originalError,
      retryable: false,
    }
  }

  // Throttling/Rate limit
  if (originalError.message.includes("throttle") || originalError.message.includes("429") || originalError.message.includes("rate")) {
    return {
      type: SMSErrorType.THROTTLE_LIMIT,
      message: ERROR_MESSAGES[SMSErrorType.THROTTLE_LIMIT],
      originalError,
      retryable: true,
    }
  }

  // Recipient validation
  if (originalError.message.includes("recipient") || originalError.message.includes("verify")) {
    return {
      type: SMSErrorType.INVALID_RECIPIENT,
      message: ERROR_MESSAGES[SMSErrorType.INVALID_RECIPIENT],
      originalError,
      retryable: false,
    }
  }

  // Delivery failures
  if (originalError.message.includes("delivery") || originalError.message.includes("failed")) {
    return {
      type: SMSErrorType.DELIVERY_FAILED,
      message: ERROR_MESSAGES[SMSErrorType.DELIVERY_FAILED],
      originalError,
      retryable: true,
    }
  }

  // Timeout
  if (originalError.message.includes("timeout") || originalError.message.includes("ETIMEDOUT")) {
    return {
      type: SMSErrorType.TIMEOUT,
      message: ERROR_MESSAGES[SMSErrorType.TIMEOUT],
      originalError,
      retryable: true,
    }
  }

  return {
    type: SMSErrorType.UNKNOWN,
    message: ERROR_MESSAGES[SMSErrorType.UNKNOWN],
    originalError,
    retryable: true,
  }
}

/**
 * Calculate retry delay using exponential backoff
 */
export function calculateRetryDelay(retryCount: number, config: SMSRetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, retryCount)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Send SMS with automatic retry logic
 */
export async function sendSMSWithRetry(
  phoneNumber: string,
  message: string,
  sendFunction: (phone: string, msg: string) => Promise<{ success: boolean; messageId?: string; error?: string }>,
  config: SMSRetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<{ success: boolean; messageId?: string; error?: SMSError }> {
  let lastError: SMSError | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await sendFunction(phoneNumber, message)

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
        }
      }

      // Handle send function returning error
      if (result.error) {
        const error = new Error(result.error)
        lastError = categorizeSMSError(error)
        lastError.retryCount = attempt
        lastError.maxRetries = config.maxRetries

        if (!lastError.retryable || attempt === config.maxRetries) {
          return { success: false, error: lastError }
        }

        // Wait before retry
        if (attempt < config.maxRetries) {
          const delay = calculateRetryDelay(attempt, config)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      lastError = categorizeSMSError(error)
      lastError.retryCount = attempt
      lastError.maxRetries = config.maxRetries

      if (!lastError.retryable || attempt === config.maxRetries) {
        return { success: false, error: lastError }
      }

      // Wait before retry
      if (attempt < config.maxRetries) {
        const delay = calculateRetryDelay(attempt, config)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  return {
    success: false,
    error: lastError || {
      type: SMSErrorType.UNKNOWN,
      message: ERROR_MESSAGES[SMSErrorType.UNKNOWN],
      retryable: false,
    },
  }
}

/**
 * Format error message for user display
 */
export function formatSMSErrorForUser(error: SMSError): string {
  if (error.retryCount !== undefined && error.retryCount > 0) {
    return `${error.message} (Attempt ${error.retryCount + 1} of ${(error.maxRetries || 0) + 1})`
  }
  return error.message
}

/**
 * Log SMS error for debugging
 */
export function logSMSError(error: SMSError, context: Record<string, any> = {}): void {
  console.error("[SMS Error]", {
    type: error.type,
    message: error.message,
    retryable: error.retryable,
    retryCount: error.retryCount,
    context,
    originalError: error.originalError?.message,
  })
}
