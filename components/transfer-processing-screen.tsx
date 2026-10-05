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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/5 to-secondary/5 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-processing-float"></div>
      <div className="absolute bottom-32 right-8 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-processing-float" style={{ animationDelay: "0.5s" }}></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-processing-pulse"></div>

      <div className="text-center max-w-sm mx-auto relative z-10">
        {error ? (
          <div className="animate-slide-up">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-destructive/15 to-destructive/5 shadow-lg animate-processing-glow">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Transaction Failed</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => onNavigate("dashboard")}
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-primary hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Return to Dashboard
            </button>
          </div>
        ) : isProcessing ? (
          <div className="animate-slide-up">
            {/* Main Loading Animation */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-primary to-secondary p-1 animate-processing-spin opacity-40"></div>
                {/* Background circle */}
                <div className="absolute inset-0 rounded-full border-8 border-primary/15 m-2"></div>
                {/* Progress circle */}
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent m-2 transition-all duration-300"
                  style={{
                    background: `conic-gradient(from 0deg, hsl(var(--primary)) ${progress * 3.6}deg, hsl(var(--muted)) ${progress * 3.6}deg)`,
                    borderRadius: "50%",
                  }}
                ></div>
                {/* Center circle with icon */}
                <div className="absolute inset-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg animate-processing-glow">
                  <Loader2 className="h-10 w-10 text-white animate-processing-spin" />
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">{Math.round(progress)}%</div>
              <p className="text-sm text-muted-foreground font-medium">Processing your transaction</p>
            </div>

            {/* Current Step */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6 gap-2">
                {steps.map((step, index) => {
                  const IconComponent = step.icon
                  const isComplete = index < currentStep
                  const isCurrent = index === currentStep
                  return (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                          isCurrent
                            ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg animate-processing-glow scale-110"
                            : isComplete
                              ? "bg-gradient-accent text-white shadow-md"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? <CheckCircle className="h-6 w-6" /> : <IconComponent className="h-6 w-6" />}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-12 h-1 mx-1 rounded-full transition-all duration-500 ${
                            index < currentStep ? "bg-gradient-accent" : "bg-muted"
                          }`}
                        ></div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="bg-card/60 backdrop-blur rounded-2xl p-6 shadow-sm border border-border/60 animate-slide-up">
                <h2 className="text-2xl font-bold text-foreground mb-2">{steps[currentStep].label}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{steps[currentStep].description}</p>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-6 shadow-lg border border-primary/15 backdrop-blur animate-slide-up mt-6" style={{ animationDelay: "0.2s" }}>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  ₦{formatCurrency(Number.parseFloat(transferData?.amount || "0"))}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Sending to {transferData?.beneficiaryName || "Recipient"}</div>
              </div>

              <div className="space-y-3 text-sm bg-card/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Bank:</span>
                  <span className="font-semibold text-foreground">{transferData?.bank}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Account:</span>
                  <span className="font-semibold text-foreground font-mono">{transferData?.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-processing-pulse">
              <div className="w-1 h-1 rounded-full bg-primary"></div>
              <span>Processing your transaction securely</span>
              <div className="w-1 h-1 rounded-full bg-primary"></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
