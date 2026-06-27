"use client"

export type ActionType =
  | "navigation"
  | "transaction"
  | "sms"
  | "settings"
  | "authentication"
  | "error"
  | "success"
  | "warning"
  | "payment"
  | "beneficiary"
  | "system"

export interface LogEntry {
  id: string
  timestamp: number
  action: string
  type: ActionType
  details?: Record<string, any>
  status: "pending" | "success" | "failed"
  duration?: number
  metadata?: Record<string, any>
}

export class ActionLogger {
  private logs: LogEntry[] = []
  private maxLogs: number = 500
  private startTime: number = 0

  constructor(maxLogs: number = 500) {
    this.maxLogs = maxLogs
    this.startTime = Date.now()
    this.loadFromStorage()
  }

  /**
   * Log an action with optional details
   */
  log(
    action: string,
    type: ActionType,
    status: "pending" | "success" | "failed" = "success",
    details?: Record<string, any>,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      type,
      status,
      details,
      metadata,
    }

    this.logs.push(entry)

    // Keep logs within max limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Auto-save to localStorage
    this.saveToStorage()

    // Debug output
    if (typeof window !== "undefined") {
      console.log(`[ActionLogger] ${type.toUpperCase()}: ${action}`, { status, details, timestamp: new Date(entry.timestamp).toISOString() })
    }

    return entry
  }

  /**
   * Update an existing log entry (useful for tracking duration)
   */
  updateLog(id: string, updates: Partial<LogEntry>): boolean {
    const index = this.logs.findIndex((log) => log.id === id)
    if (index === -1) return false

    const startTime = this.logs[index].timestamp
    const duration = Date.now() - startTime

    this.logs[index] = {
      ...this.logs[index],
      ...updates,
      duration,
    }

    this.saveToStorage()
    return true
  }

  /**
   * Log a transaction
   */
  logTransaction(
    action: string,
    status: "pending" | "success" | "failed",
    details?: Record<string, any>
  ): LogEntry {
    return this.log(action, "transaction", status, details, {
      category: "financial",
      user: details?.recipient || "unknown",
    })
  }

  /**
   * Log an SMS action
   */
  logSMS(
    action: string,
    status: "pending" | "success" | "failed",
    phoneNumber?: string,
    messageId?: string
  ): LogEntry {
    return this.log(action, "sms", status, { phoneNumber, messageId }, {
      category: "communication",
    })
  }

  /**
   * Log navigation
   */
  logNavigation(screen: string, previousScreen?: string): LogEntry {
    return this.log(`Navigated to ${screen}`, "navigation", "success", {
      screen,
      previousScreen,
    })
  }

  /**
   * Log error
   */
  logError(action: string, error: Error | string, context?: Record<string, any>): LogEntry {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return this.log(action, "error", "failed", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Get logs filtered by type
   */
  getLogsByType(type: ActionType): LogEntry[] {
    return this.logs.filter((log) => log.type === type)
  }

  /**
   * Get logs within time range (in milliseconds from now)
   */
  getLogsByTimeRange(fromMs: number, toMs: number): LogEntry[] {
    const now = Date.now()
    return this.logs.filter((log) => log.timestamp >= now - toMs && log.timestamp <= now - fromMs)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(-count).reverse()
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    this.saveToStorage()
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number
    byType: Record<ActionType, number>
    successRate: number
    averageDuration: number
    timespan: number
  } {
    const byType: Record<ActionType, number> = {
      navigation: 0,
      transaction: 0,
      sms: 0,
      settings: 0,
      authentication: 0,
      error: 0,
      success: 0,
      warning: 0,
      payment: 0,
      beneficiary: 0,
      system: 0,
    }

    let successCount = 0
    let totalDuration = 0
    let logsWithDuration = 0

    for (const log of this.logs) {
      byType[log.type]++
      if (log.status === "success") successCount++
      if (log.duration) {
        totalDuration += log.duration
        logsWithDuration++
      }
    }

    return {
      total: this.logs.length,
      byType,
      successRate: this.logs.length > 0 ? (successCount / this.logs.length) * 100 : 0,
      averageDuration: logsWithDuration > 0 ? totalDuration / logsWithDuration : 0,
      timespan: Date.now() - this.startTime,
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return
    try {
      const logsToSave = this.logs.slice(-100) // Only save last 100 logs
      localStorage.setItem("alertme_action_logs", JSON.stringify(logsToSave))
      sessionStorage.setItem("alertme_action_logs_session", JSON.stringify(this.logs))
    } catch (error) {
      console.warn("[ActionLogger] Failed to save to storage:", error)
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem("alertme_action_logs")
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (error) {
      console.warn("[ActionLogger] Failed to load from storage:", error)
    }
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        stats: this.getStats(),
        logs: this.logs,
      },
      null,
      2
    )
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(): string {
    const headers = ["Timestamp", "Action", "Type", "Status", "Duration (ms)", "Details"]
    const rows = this.logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.action,
      log.type,
      log.status,
      log.duration || "",
      JSON.stringify(log.details || {}),
    ])

    return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  }
}

// Global singleton instance
export const actionLogger = new ActionLogger()
