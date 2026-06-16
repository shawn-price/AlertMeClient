"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { AlertToastState, AlertToastContextType, generateToastId } from "@/lib/alert-toast-context"
import { AlertToast } from "./alert-toast"

const AlertToastContext = createContext<AlertToastContextType | undefined>(undefined)

export function AlertToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AlertToastState[]>([])

  const showAlertToast = useCallback((options: Omit<AlertToastState, "id">) => {
    const id = generateToastId()
    const newToast: AlertToastState = {
      ...options,
      id,
    }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const updateAlertToast = useCallback((id: string, updates: Partial<AlertToastState>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...updates,
            }
          : toast
      )
    )
  }, [])

  const dismissAlertToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const value: AlertToastContextType = {
    toasts,
    showAlertToast,
    updateAlertToast,
    dismissAlertToast,
    clearAllToasts,
  }

  return (
    <AlertToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-fadeIn">
            <AlertToast toast={toast} onDismiss={() => dismissAlertToast(toast.id)} />
          </div>
        ))}
      </div>
    </AlertToastContext.Provider>
  )
}

export function useAlertToast(): AlertToastContextType {
  const context = useContext(AlertToastContext)
  if (!context) {
    throw new Error("useAlertToast must be used within an AlertToastProvider")
  }
  return context
}
