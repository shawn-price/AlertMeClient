"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Zap, Wifi, Tv, Phone, Car, Home, Receipt, AlertCircle } from "@/components/ui/iconify-compat"
import { formatCurrency } from "@/lib/form-utils"
import { dataStore } from "@/lib/data-store"

interface PayBillsScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function PayBillsScreen({ onBack, onNavigate }: PayBillsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [customerID, setCustomerID] = useState("")
  const [amount, setAmount] = useState("")
  const [formError, setFormError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const userData = dataStore.getUserData()

  const billCategories = [
    {
      id: "electricity",
      name: "Electricity",
      icon: Zap,
      providers: ["AEDC", "EKEDC", "IKEDC", "PHEDC"],
    },
    {
      id: "internet",
      name: "Internet",
      icon: Wifi,
      providers: ["MTN", "Airtel", "Glo", "9mobile"],
    },
    {
      id: "cable-tv",
      name: "Cable TV",
      icon: Tv,
      providers: ["DSTV", "GOTV", "Startimes", "Strong"],
    },
    {
      id: "phone",
      name: "Phone",
      icon: Phone,
      providers: ["MTN", "Airtel", "Glo", "9mobile"],
    },
    {
      id: "insurance",
      name: "Insurance",
      icon: Car,
      providers: ["Leadway", "AXA Mansard", "AIICO", "Cornerstone"],
    },
    {
      id: "mortgage",
      name: "Mortgage",
      icon: Home,
      providers: ["FMBN", "Abbey Mortgage", "Imperial Homes", "Mixta Real Estate"],
    },
  ]

  const recentBills = [
    {
      id: "1",
      category: "Electricity",
      provider: "AEDC",
      amount: 15000,
      date: "2023-05-15",
      status: "Paid",
    },
    {
      id: "2",
      category: "Cable TV",
      provider: "DSTV",
      amount: 8500,
      date: "2023-05-10",
      status: "Paid",
    },
  ]

  const selectedCategoryData = billCategories.find((cat) => cat.id === selectedCategory)

  // CRITICAL: Handle bill payment with balance validation
  const handlePayBill = async () => {
    setFormError("")
    try {
      const billAmount = Number(amount)
      const billFee = 50 // Bill payment fee
      const totalAmount = billAmount + billFee

      // Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${billAmount.toLocaleString()} bill + ₦${billFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }

      setIsProcessing(true)

      // Add transaction to store
      await dataStore.addTransaction({
        type: `${selectedCategory} Bill Payment`,
        amount: billAmount,
        recipient: selectedProvider,
        status: "Successful",
        description: `${selectedProvider} - ${customerID}`,
        isDebit: true,
        section: "Today",
        recipientBank: selectedCategory,
        fee: billFee,
      })

      // Reset form
      setSelectedCategory("")
      setSelectedProvider("")
      setCustomerID("")
      setAmount("")
      setIsProcessing(false)

      onNavigate("dashboard")
    } catch (err) {
      setIsProcessing(false)
      setFormError(err instanceof Error ? err.message : "Failed to process bill payment")
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Pay Bills</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Error Message */}
        {formError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{formError}</div>
          </div>
        )}

        {/* Bill Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Bill Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {billCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={`h-20 flex flex-col gap-2 ${
                      selectedCategory === category.id
                        ? "bg-primary hover:bg-primary/90"
                        : "border-border bg-transparent"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-xs">{category.name}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bill Payment Form */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="provider">Service Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategoryData?.providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customer-id">Customer ID / Phone Number</Label>
                <Input
                  id="customer-id"
                  inputMode="tel"
                  value={customerID}
                  onChange={(e) => setCustomerID(e.target.value)}
                  placeholder="Enter customer ID or phone number"
                />
              </div>

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

              {amount && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Bill Amount</span>
                    <span className="font-semibold">₦{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Bill Fee</span>
                    <span className="font-semibold">₦50.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-bold">Total</span>
                    <span className="font-bold text-primary">₦{formatCurrency(Number(amount) + 50)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePayBill}
                disabled={!selectedProvider || !customerID || !amount || isProcessing}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3"
              >
                {isProcessing ? "Processing..." : "Pay Bill"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Recent Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">
                      {bill.category} - {bill.provider}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₦{formatCurrency(bill.amount)}</div>
                  <div className="text-xs text-success">{bill.status}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
