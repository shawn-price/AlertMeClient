"use client"

import { useEffect, useState } from "react"
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { useSMSAlert } from "@/hooks/use-sms-alert"

interface TransferProcessingScreenProps {
  onNavigate: (screen: string, data?: any) => void
  transferData: any
}

export function TransferProcessingScreen({ onNavigate, transferData }: TransferProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { sendAlert } = useSMSAlert()

  const steps = [
    { icon: Shield, label: "Verifying PIN", description: "Authenticating your transaction" },
    { icon: CreditCard, label: "Processing Payment", description: "Debiting your account" },
    { icon: CheckCircle, label: "Sending Money", description: "Crediting recipient account" },
  ]

  useEffect(() => {
    if (!transferData) {
      setError("Invalid transfer data")
      setIsProcessing(false)
      return
    }

    console.log("[v0] Transfer processing started with data:", transferData)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setIsProcessing(false)

          try {
            // Save beneficiary if requested
            if (transferData.saveAsBeneficiary) {
              try {
                dataStore.addBeneficiary({
                  name: transferData.beneficiaryName || "Recipient",
                  bank: transferData.bank,
                  accountNumber: transferData.accountNumber,
                  phone: transferData.phone || "",
                })
                console.log("[v0] Beneficiary saved successfully")
              } catch (err) {
                console.warn("[v0] Failed to save beneficiary:", err)
                // Don't fail the transaction if beneficiary save fails
              }
            }

            // Add transaction
            dataStore
              .addTransaction({
                type: `Transfer to ${transferData.bank || transferData.provider || "Recipient"}`,
                amount: Number.parseFloat(transferData.amount || "0"),
                recipient: transferData.beneficiaryName || "Recipient",
                description: `Transfer to ${transferData.beneficiaryName}`,
                status: "Successful",
                isDebit: true,
                section: "Today",
                recipientBank: transferData.bank || transferData.provider,
                recipientAccount: transferData.accountNumber || transferData.phoneNumber || transferData.cardNumber,
                fee: transferData.fee || 30,
              })
              .then(async (id) => {
                console.log("[Transfer] Transaction added with ID:", id)
                
                // Navigate to success page IMMEDIATELY - don't wait for SMS
                const successData = {
                  ...transferData,
                  id,
                  beneficiaryName: transferData?.beneficiaryName || "Recipient",
                  timestamp: new Date().toISOString(),
                  smsStatus: "pending",
                }
                
                // Send SMS alert CONCURRENTLY in the background using multi-gateway system
                const userData = dataStore.getUserData()
                const amount = Number.parseFloat(transferData.amount || "0")
                
                // Prepare SMS message
                const recipientBank = transferData.bank || "ECOBANK"
                const recipient = transferData.beneficiaryName || "Recipient"
                const message = `Your Ecobank account was debited ₦${formatCurrency(amount)} to ${recipient} at ${new Date().toLocaleTimeString()}. Balance: ₦${formatCurrency(userData.balance - amount)}. Ref: ${id}`

                // Send SMS without blocking - handle in background with gateway fallback
                sendAlert({
                  to: userData.phone,
                  message,
                  recipientBank,
                  senderBankName: "Ecobank",
                  showProgress: false, // Silent mode - don't show toast for background sends
                }).catch((err) => {
                  console.warn("[Transfer] SMS sending error:", err)
                })

                // Navigate immediately - no delay
                onNavigate("transaction-success", successData)
              })
              .catch((err) => {
                console.error("[Transfer] Failed to add transaction:", err)
                setError("Failed to process transaction. Please try again.")
              })
          } catch (err) {
            console.error("[v0] Transaction processing error:", err)
            setError("An error occurred during processing")
          }
          return 100
        }
        return prev + 2
      })
    }, 100)

    // Update steps based on progress
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1 && progress > (prev + 1) * 33) {
          return prev + 1
        }
        return prev
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      clearInterval(stepTimer)
    }
  }, [onNavigate, progress, steps.length, transferData])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm mx-auto">
        {error ? (
          <>
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => onNavigate("dashboard")}
              className="inline-flex items-center justify-center px-6 py-2 bg-[#004A9F] hover:bg-[#003875] text-white rounded-lg font-medium"
            >
              Return to Dashboard
            </button>
          </>
        ) : isProcessing ? (
          <>
            {/* Main Loading Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-[#004A9F] border-t-transparent animate-spin"
                  style={{
                    background: `conic-gradient(from 0deg, #004A9F ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
                    borderRadius: "50%",
                  }}
                ></div>
                <div className="absolute inset-4 bg-[#004A9F] rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#004A9F] mb-2">{Math.round(progress)}%</div>
            </div>

            {/* Current Step */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                {steps.map((step, index) => {
                  const IconComponent = step.icon
                  return (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index <= currentStep ? "bg-[#004A9F] text-white" : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-1 mx-2 ${index < currentStep ? "bg-[#004A9F]" : "bg-gray-200"}`}></div>
                      )}
                    </div>
                  )
                })}
              </div>

              <h2 className="text-xl font-semibold mb-2">{steps[currentStep].label}</h2>
              <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
            </div>

            {/* Transfer Details */}
            <div className="bg-white rounded-lg p-4 text-left">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-[#004A9F]">
                  ₦ {formatCurrency(Number.parseFloat(transferData?.amount || "0"))}
                </div>
                <div className="text-sm text-gray-600">to {transferData?.beneficiaryName || "Recipient"}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{transferData?.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{transferData?.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500">Please do not close this page while processing...</div>
          </>
        ) : null}
      </div>
    </div>
  )
}
