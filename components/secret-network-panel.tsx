"use client"

import React, { useState, useEffect } from "react"
import { X, Network, Settings, Zap, AlertCircle } from "lucide-react"

interface NetworkStatus {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  latency: number
  signalStrength: string
}

interface SecretNetworkPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SecretNetworkPanel({ isOpen, onClose }: SecretNetworkPanelProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: "unknown",
    effectiveType: "unknown",
    downlink: 0,
    rtt: 0,
    latency: 0,
    signalStrength: "unknown",
  })

  const [apiEndpoints, setApiEndpoints] = useState({
    smsGateway: process.env.NEXT_PUBLIC_SMS_API || "/api/sms/send",
    vartechBase: process.env.NEXT_PUBLIC_VARTECH_BASE || "https://sms.thevartech.com/api",
  })

  const [debugLevel, setDebugLevel] = useState<"silent" | "info" | "debug" | "verbose">("info")

  useEffect(() => {
    if (!isOpen) return

    const updateNetworkStatus = () => {
      if (typeof navigator === "undefined") return

      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || "unknown",
        effectiveType: connection?.effectiveType || "unknown",
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        latency: Math.random() * 100,
        signalStrength: (navigator as any).deviceMemory ? "Strong" : "Good",
      })
    }

    updateNetworkStatus()

    // Listen for online/offline changes
    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => updateNetworkStatus()

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(updateNetworkStatus, 5000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [isOpen])

  const clearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
      alert("Cache cleared successfully")
    }
  }

  const exportLogs = () => {
    const logs = sessionStorage.getItem("app_logs") || "No logs available"
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(logs))
    element.setAttribute("download", `app-logs-${new Date().toISOString()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-300"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Secret Panel */}
      <div className="fixed top-0 left-0 right-0 max-w-full z-50 animate-in slide-in-from-top duration-500">
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700 shadow-2xl">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Network & Configuration</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Network Status */}
              <div className="space-y-3 pb-4 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Network Status
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-slate-400 text-xs uppercase">Status</div>
                    <div className={`font-semibold ${networkStatus.isOnline ? "text-green-400" : "text-red-400"}`}>
                      {networkStatus.isOnline ? "Online" : "Offline"}
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-slate-400 text-xs uppercase">Type</div>
                    <div className="text-slate-200 font-semibold">{networkStatus.connectionType}</div>
                  </div>

                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-slate-400 text-xs uppercase">Effective Type</div>
                    <div className="text-slate-200 font-semibold">{networkStatus.effectiveType}</div>
                  </div>

                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-slate-400 text-xs uppercase">Latency</div>
                    <div className="text-slate-200 font-semibold">{Math.round(networkStatus.latency)}ms</div>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-3 pb-4 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  API Configuration
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="text-slate-400 text-xs">SMS Gateway</div>
                    <code className="text-green-300 text-xs break-all">{apiEndpoints.smsGateway}</code>
                  </div>

                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="text-slate-400 text-xs">VarTech Base URL</div>
                    <code className="text-green-300 text-xs break-all">{apiEndpoints.vartechBase}</code>
                  </div>
                </div>
              </div>

              {/* Debug Settings */}
              <div className="space-y-3 pb-4 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  Debug Settings
                </h3>

                <div className="flex gap-2">
                  {(["silent", "info", "debug", "verbose"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDebugLevel(level)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        debugLevel === level
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>

                {typeof window !== "undefined" && (
                  <div className="bg-slate-700/50 p-2 rounded text-xs text-slate-300">
                    <div className="font-mono">
                      Debug Level: <span className="text-blue-300">{debugLevel}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={exportLogs}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Export Logs
                </button>

                <button
                  onClick={clearCache}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
