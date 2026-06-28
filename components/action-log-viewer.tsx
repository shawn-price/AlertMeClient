"use client"

import React, { useState, useEffect, useMemo } from "react"
import { LogEntry, ActionType, actionLogger } from "@/lib/action-logger"
import { ChevronDown, Filter, Download, Trash2, RefreshCw } from "lucide-react"

const ACTION_COLORS: Record<ActionType, string> = {
  navigation: "bg-blue-500",
  transaction: "bg-green-500",
  sms: "bg-purple-500",
  settings: "bg-gray-500",
  authentication: "bg-orange-500",
  error: "bg-red-500",
  success: "bg-green-600",
  warning: "bg-yellow-500",
  payment: "bg-emerald-500",
  beneficiary: "bg-cyan-500",
  system: "bg-indigo-500",
}

const ACTION_ICONS: Record<ActionType, string> = {
  navigation: "→",
  transaction: "↔",
  sms: "✉",
  settings: "⚙",
  authentication: "🔐",
  error: "✕",
  success: "✓",
  warning: "⚠",
  payment: "💳",
  beneficiary: "👤",
  system: "◆",
}

interface ActionLogViewerProps {
  maxVisible?: number
}

interface FilterOptions {
  types: Set<ActionType>
  statuses: Set<"pending" | "success" | "failed">
  searchText: string
}

export function ActionLogViewer({ maxVisible = 30 }: ActionLogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    types: new Set(),
    statuses: new Set(),
    searchText: "",
  })

  useEffect(() => {
    if (!actionLogger) return

    // Initial load
    setLogs(actionLogger.getRecentLogs(maxVisible))

    // Poll for updates every second
    const interval = setInterval(() => {
      setLogs(actionLogger.getRecentLogs(maxVisible))
    }, 1000)

    return () => clearInterval(interval)
  }, [maxVisible])

  const filteredLogs = useMemo(() => {
    let result = [...logs]

    // Apply type filter
    if (filters.types.size > 0) {
      result = result.filter((log) => filters.types.has(log.type))
    }

    // Apply status filter
    if (filters.statuses.size > 0) {
      result = result.filter((log) => filters.statuses.has(log.status))
    }

    // Apply search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      result = result.filter((log) =>
        log.action.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [logs, filters])

  const stats = useMemo(() => {
    if (!actionLogger) return null
    return actionLogger.getStats()
  }, [logs])

  const handleToggleType = (type: ActionType) => {
    const newTypes = new Set(filters.types)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setFilters({ ...filters, types: newTypes })
  }

  const handleToggleStatus = (status: "pending" | "success" | "failed") => {
    const newStatuses = new Set(filters.statuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setFilters({ ...filters, statuses: newStatuses })
  }

  const handleExport = (format: "json" | "csv") => {
    if (!actionLogger) return

    const content = format === "json" ? actionLogger.exportAsJSON() : actionLogger.exportAsCSV()
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `action-logs.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm("Clear all logs? This cannot be undone.")) {
      if (actionLogger) {
        actionLogger.clearLogs()
        setLogs([])
      }
    }
  }

  const handleRefresh = () => {
    if (actionLogger) {
      setLogs(actionLogger.getRecentLogs(maxVisible))
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-700/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Logs</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{Math.round(stats.successRate)}%</div>
            <div className="text-xs text-slate-400">Success Rate</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-400">{Math.round(stats.averageDuration)}ms</div>
            <div className="text-xs text-slate-400">Avg Duration</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(stats.timespan / 1000 / 60)}m
            </div>
            <div className="text-xs text-slate-400">Uptime</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

        <select
          onChange={(e) => handleExport(e.target.value as "json" | "csv")}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm cursor-pointer transition-colors"
        >
          <option value="">Export...</option>
          <option value="json">Export JSON</option>
          <option value="csv">Export CSV</option>
        </select>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Filters */}
      {filterOpen && (
        <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Search</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="w-full px-3 py-2 bg-slate-600 text-white rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Action Types</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(ACTION_COLORS).map((type) => (
                <button
                  key={type}
                  onClick={() => handleToggleType(type as ActionType)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filters.types.has(type as ActionType)
                      ? `${ACTION_COLORS[type as ActionType]} text-white`
                      : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Status</label>
            <div className="flex gap-2">
              {(["pending", "success", "failed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleToggleStatus(status)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filters.statuses.has(status)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {logs.length === 0 ? "No logs yet..." : "No logs matching filters"}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <ActionLogItem
              key={log.id}
              log={log}
              isExpanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ActionLogItem({
  log,
  isExpanded,
  onToggle,
}: {
  log: LogEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const time = new Date(log.timestamp)
  const timeStr = time.toLocaleTimeString("en-US", { hour12: false })
  const color = ACTION_COLORS[log.type]
  const icon = ACTION_ICONS[log.type]

  return (
    <div className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-600/50 transition-colors text-left group"
      >
        {/* Icon */}
        <div className={`${color} text-white rounded px-2 py-1 text-xs font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 truncate">{log.action}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                log.status === "success"
                  ? "bg-green-500/20 text-green-300"
                  : log.status === "failed"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-yellow-500/20 text-yellow-300"
              }`}
            >
              {log.status}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {timeStr} {log.type === "system" ? "" : `• ${log.type}`}
            {log.duration && ` • ${log.duration}ms`}
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded details */}
      {isExpanded && log.details && (
        <div className="bg-slate-800/50 px-3 py-2 border-t border-slate-600 max-h-48 overflow-y-auto">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
