"use client"

import { memo, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Share, Loader2, MessageSquare } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { receiptAgent, Receipt } from "@/lib/receipt-agent"
import { actionLogger } from "@/lib/action-logger"
import { productionAlerts } from "@/lib/production-alerts"

interface TransactionSuccessProps {
  onNavigate: (screen: string, data?: any) => void
  transferData?: any
}

function TransactionSuccessComponent({ onNavigate, transferData }: TransactionSuccessProps) {
  const [smsStatus, setSmsStatus] = useState<"pending" | "sent" | "failed">("pending")
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(true)

  useEffect(() => {
    if (transferData) {
      console.log("[v0] Transaction success notification added:", transferData)
      dataStore.addNotification({
        title: "Money Sent Successfully",
        message: `₦${formatCurrency(Number.parseFloat(transferData.amount || "0"))} sent to ${transferData.beneficiaryName || "Recipient"} in ${transferData.bank}`,
        type: "success",
      })

      // Log transaction completion
      if (actionLogger) {
        actionLogger.logTransaction("Transfer Completed", "success", {
          recipient: transferData.beneficiaryName,
          amount: transferData.amount,
          bank: transferData.bank,
          transactionId: transferData.id,
        })
      }

      // Generate receipt with formatted sender/receiver
      generateAndCacheReceipt(transferData)

      // Send production SMS alerts to both sender and receiver
      sendProductionAlerts(transferData)
    }
  }, [transferData])

  const sendProductionAlerts = async (data: any) => {
    try {
      const userData = dataStore.getUserData()

      // Send production SMS alerts
      const alertResult = await productionAlerts.sendTransactionAlert({
        type: "debit",
        senderName: userData.name,
        senderBank: data.bank,
        senderPhone: userData.phone,
        recipientName: data.beneficiaryName,
        recipientBank: data.bank,
        recipientPhone: data.phone,
        recipientAccountNumber: data.accountNumber,
        amount: parseFloat(data.amount),
        balance: userData.balance || 0,
        reference: data.id,
        narration: data.narration || "Money Transfer",
        timestamp: new Date().toISOString(),
      })

      if (alertResult.success) {
        setSmsStatus("sent")
        console.log("[v0] Production SMS alerts sent successfully:", alertResult)
      } else {
        setSmsStatus("failed")
        console.error("[v0] Failed to send SMS alerts:", alertResult.error)
      }
    } catch (error) {
      console.error("[v0] Error sending production alerts:", error)
      setSmsStatus("failed")
    }
  }

  const generateAndCacheReceipt = async (data: any) => {
    try {
      setIsGeneratingReceipt(true)

      const generatedReceipt = await receiptAgent.generateReceipt({
        id: data.id,
        sender: {
          name: data.senderName || dataStore.getUserData().name,
          bank: data.bank,
          phone: data.senderPhone || dataStore.getUserData().phone,
        },
        receiver: {
          name: data.beneficiaryName,
          bank: data.bank,
          phone: data.phone,
          accountNumber: data.accountNumber,
        },
        amount: parseFloat(data.amount),
        currency: data.currency || "₦",
        narration: data.narration || "Money Transfer",
      })

      // Cache receipt for later retrieval
      await receiptAgent.cacheReceipt(generatedReceipt)
      setReceipt(generatedReceipt)

      if (actionLogger) {
        actionLogger.log("Receipt Generated", "success", "success", {
          transactionId: data.id,
          receiptId: generatedReceipt.id,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to generate receipt:", error)
      if (actionLogger) {
        actionLogger.logError("Receipt Generation Failed", error as Error, {
          transactionId: data.id,
        })
      }
    } finally {
      setIsGeneratingReceipt(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Transaction details</h1>
        <Button variant="ghost" size="icon">
          <Share className="h-5 w-5" />
        </Button>
      </div>

      {/* Success Content */}
      <div className="px-4 py-12 text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <Check className="h-10 w-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-4">Transfer Successful</h2>

        <div className="text-4xl font-bold mb-2">
          ₦ {transferData?.amount ? formatCurrency(Number.parseFloat(transferData.amount)) : "0.00"}
        </div>

        <div className="text-sm text-muted-foreground mb-6">
          To: <span className="font-semibold text-foreground">{transferData?.beneficiaryName || "Recipient"}</span>
        </div>

        {/* SMS Status Indicator with Preloader */}
        <div className="mb-6">
          {smsStatus === "pending" ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">Sending SMS notification...</span>
            </div>
          ) : smsStatus === "sent" ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
              <MessageSquare className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">SMS sent</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-full">
              <MessageSquare className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning font-medium">SMS pending</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-12 max-w-sm mx-auto">
          The recipient account is expected to be credited within 5 minutes, subject to notification by the bank
        </p>

        {/* Transaction Details */}
        <div className="bg-card rounded-lg p-4 mb-6 text-left space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bank:</span>
            <span className="font-semibold">{transferData?.bank}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account:</span>
            <span className="font-semibold">{transferData?.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-semibold">{transferData?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Buttons for navigation */}
        <div className="space-y-3">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full"
            onClick={() => onNavigate("detailed-receipt", transferData?.id)}
          >
            View Detailed Receipt
          </Button>
          <Button
            variant="outline"
            className="w-full text-primary border-primary py-3 rounded-full hover:bg-primary/5 bg-transparent"
            onClick={() => onNavigate("dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export const TransactionSuccess = memo(TransactionSuccessComponent)
