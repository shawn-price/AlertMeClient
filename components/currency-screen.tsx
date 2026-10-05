"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowUpDown, TrendingUp, TrendingDown, Globe, Home } from "@/components/ui/iconify-compat"
import { formatCurrency } from "@/lib/form-utils"

interface CurrencyScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function CurrencyScreen({ onBack, onNavigate }: CurrencyScreenProps) {
  const [fromCurrency, setFromCurrency] = useState("NGN")
  const [toCurrency, setToCurrency] = useState("USD")
  const [amount, setAmount] = useState("")
  const [convertedAmount, setConvertedAmount] = useState("")

  const currencies = [
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 1 },
    { code: "USD", name: "US Dollar", symbol: "$", rate: 0.0022 },
    { code: "EUR", name: "Euro", symbol: "€", rate: 0.002 },
    { code: "GBP", name: "British Pound", symbol: "£", rate: 0.0018 },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rate: 0.026 },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rate: 0.31 },
    { code: "ZAR", name: "South African Rand", symbol: "R", rate: 0.041 },
  ]

  const exchangeRates = [
    {
      pair: "USD/NGN",
      rate: 460.5,
      change: +2.5,
      trend: "up",
    },
    {
      pair: "EUR/NGN",
      rate: 502.3,
      change: -1.2,
      trend: "down",
    },
    {
      pair: "GBP/NGN",
      rate: 567.8,
      change: +0.8,
      trend: "up",
    },
    {
      pair: "GHS/NGN",
      rate: 38.45,
      change: +0.3,
      trend: "up",
    },
  ]

  const recentTransactions = [
    {
      id: "1",
      from: "NGN",
      to: "USD",
      amount: 100000,
      converted: 217.39,
      rate: 460.5,
      date: "2023-05-19",
      status: "Completed",
    },
    {
      id: "2",
      from: "USD",
      to: "NGN",
      amount: 500,
      converted: 230250,
      rate: 460.5,
      date: "2023-05-15",
      status: "Completed",
    },
  ]

  const handleConvert = () => {
    const fromRate = currencies.find((c) => c.code === fromCurrency)?.rate || 1
    const toRate = currencies.find((c) => c.code === toCurrency)?.rate || 1
    const inputAmount = Number.parseFloat(amount)

    if (inputAmount && fromRate && toRate) {
      const result = (inputAmount / fromRate) * toRate
      setConvertedAmount(result.toFixed(2))
    }
  }

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    setAmount(convertedAmount)
    setConvertedAmount(amount)
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">International Currency</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Currency Converter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Currency Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="from-currency">From</Label>
              <div className="flex gap-2">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" size="icon" onClick={swapCurrencies}>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label htmlFor="to-currency">To</Label>
              <div className="flex gap-2">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={convertedAmount}
                  readOnly
                  placeholder="Converted amount"
                  className="flex-1 bg-muted/50"
                />
              </div>
            </div>

            <Button onClick={handleConvert} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3">
              Convert Currency
            </Button>
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exchangeRates.map((rate, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{rate.pair}</div>
                  <div className={`flex items-center gap-1 ${rate.trend === "up" ? "text-success" : "text-destructive"}`}>
                    {rate.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-xs">{Math.abs(rate.change)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₦{rate.rate}</div>
                  <div className={`text-xs ${rate.trend === "up" ? "text-success" : "text-destructive"}`}>
                    {rate.change > 0 ? "+" : ""}
                    {rate.change}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Currency Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {transaction.from} → {transaction.to}
                  </div>
                  <Badge className="bg-success/15 text-success">{transaction.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Amount Sent</div>
                    <div className="font-medium">
                      {transaction.from === "NGN" ? "₦" : "$"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Amount Received</div>
                    <div className="font-medium">
                      {transaction.to === "NGN" ? "₦" : "$"}
                      {formatCurrency(transaction.converted)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Exchange Rate</div>
                    <div className="font-medium">₦{transaction.rate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-medium">{new Date(transaction.date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
