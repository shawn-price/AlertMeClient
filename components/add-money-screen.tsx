"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Smartphone, Building2, Home, Plus } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/form-utils"

interface AddMoneyScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function AddMoneyScreen({ onBack, onNavigate }: AddMoneyScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState("")
  const [amount, setAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const fundingMethods = [
    {
      id: "debit-card",
      name: "Debit Card",
      icon: CreditCard,
      description: "Add money using your debit card",
      fee: "₦50 + 1.5%",
    },
    {
      id: "bank-transfer",
      name: "Bank Transfer",
      icon: Building2,
      description: "Transfer from another bank account",
      fee: "Free",
    },
    {
      id: "ussd",
      name: "USSD Code",
      icon: Smartphone,
      description: "Dial *737# to fund your account",
      fee: "₦10",
    },
  ]

  const quickAmounts = [1000, 5000, 10000, 20000, 50000, 100000]

  const handleAddMoney = async () => {
    if (!selectedMethod || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a funding method and enter amount",
        variant: "destructive",
      })
      return
    }

    if (selectedMethod === "debit-card" && (!cardNumber || !expiryDate || !cvv)) {
      toast({
        title: "Card Details Required",
        description: "Please fill in all card details",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Simulate processing for 3 seconds
    setTimeout(async () => {
      const fundAmount = Number(Number.parseFloat(amount).toFixed(2))

      // Add transaction record (this automatically updates balance)
      await dataStore.addTransaction({
        type: "Account Funding",
        amount: fundAmount,
        sender: selectedMethod === "debit-card" ? "Debit Card" : "Bank Transfer",
        status: "Successful",
        description: `Account funding via ${fundingMethods.find((m) => m.id === selectedMethod)?.name}`,
        isDebit: false,
        section: "Today",
        senderBank: "External",
      })

      setIsProcessing(false)

      toast({
        title: "Funding Successful",
        description: `₦${formatCurrency(fundAmount)} has been added to your account`,
      })

      // Reset form
      setAmount("")
      setCardNumber("")
      setExpiryDate("")
      setCvv("")
      setSelectedMethod("")

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        onNavigate("dashboard")
      }, 2000)
    }, 3000)
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
          <p className="text-muted-foreground">Please wait while we add money to your account</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Add Money</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-sm opacity-80">Current Balance</div>
            <div className="text-2xl font-bold">₦ {formatCurrency(dataStore.getUserData().balance)}</div>
          </CardContent>
        </Card>

        {/* Funding Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Funding Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fundingMethods.map((method) => {
              const IconComponent = method.icon
              return (
                <div
                  key={method.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{method.name}</div>
                      <div className="text-xs text-muted-foreground">{method.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{method.fee}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enter Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                inputMode="numeric"
                step="0.01"
                placeholder="Enter amount (e.g. 1000.00)"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                onBlur={() => {
                  if (!amount) return
                  const n = Number(amount)
                  setAmount(Number(n.toFixed(2)).toFixed(2))
                }}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs"
                >
                  ₦{formatCurrency(quickAmount)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card Details (if debit card selected) */}
        {selectedMethod === "debit-card" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* USSD Instructions */}
        {selectedMethod === "ussd" && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">USSD Instructions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Dial <span className="font-mono bg-muted px-2 py-1 rounded">*737*1*{amount}#</span> from your
                  registered phone number
                </p>
                <p className="text-xs text-muted-foreground">Follow the prompts to complete the transaction</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Money Button */}
        <Button
          onClick={handleAddMoney}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3"
          disabled={!selectedMethod || !amount}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Money
        </Button>
      </div>
    </div>
  )
}
