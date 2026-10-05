"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone, MapPin, Clock, CreditCard, QrCode, Home } from "@/components/ui/iconify-compat"
import { formatCurrency } from "@/lib/form-utils"

interface POSScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function POSScreen({ onBack, onNavigate }: POSScreenProps) {
  const [selectedService, setSelectedService] = useState("")
  const [amount, setAmount] = useState("")
  const [agentCode, setAgentCode] = useState("")

  const posServices = [
    {
      id: "cash-out",
      name: "Cash Withdrawal",
      description: "Withdraw cash from nearby agents",
      icon: CreditCard,
      fee: "₦50 + 0.5%",
    },
    {
      id: "cash-in",
      name: "Cash Deposit",
      description: "Deposit cash through agents",
      icon: Smartphone,
      fee: "₦25 + 0.25%",
    },
    {
      id: "transfer",
      name: "Agent Transfer",
      description: "Send money through POS agents",
      icon: QrCode,
      fee: "₦100 + 1%",
    },
  ]

  const nearbyAgents = [
    {
      id: "1",
      name: "Kemi's Store",
      address: "123 Lagos Street, VI",
      distance: "0.2 km",
      rating: 4.8,
      services: ["Cash Out", "Cash In", "Transfer"],
      status: "online",
    },
    {
      id: "2",
      name: "Tunde POS Center",
      address: "456 Broad Street, Lagos Island",
      distance: "0.5 km",
      rating: 4.6,
      services: ["Cash Out", "Transfer"],
      status: "online",
    },
    {
      id: "3",
      name: "Mama Ngozi Shop",
      address: "789 Allen Avenue, Ikeja",
      distance: "1.2 km",
      rating: 4.9,
      services: ["Cash Out", "Cash In"],
      status: "offline",
    },
  ]

  const recentTransactions = [
    {
      id: "1",
      type: "Cash Withdrawal",
      agent: "Kemi's Store",
      amount: 20000,
      date: "2023-05-19",
      status: "Completed",
    },
    {
      id: "2",
      type: "Cash Deposit",
      agent: "Tunde POS Center",
      amount: 50000,
      date: "2023-05-15",
      status: "Completed",
    },
  ]

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">POS Services</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* POS Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {posServices.map((service) => {
              const IconComponent = service.icon
              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedService === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">{service.description}</div>
                    </div>
                    <Badge className="bg-muted text-foreground">{service.fee}</Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Transaction Form */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Details</CardTitle>
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

              <div>
                <Label htmlFor="agent-code">Agent Code (Optional)</Label>
                <Input
                  id="agent-code"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                  placeholder="Enter agent code or select from map"
                />
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3" disabled={!amount}>
                Find Nearby Agents
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Nearby Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Nearby Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearbyAgents.map((agent) => (
              <div key={agent.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{agent.name}</div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${agent.status === "online" ? "bg-success" : "bg-muted-foreground"}`}
                    />
                    <span className={`text-xs ${agent.status === "online" ? "text-success" : "text-muted-foreground"}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{agent.address}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span>{agent.distance}</span>
                    <span>⭐ {agent.rating}</span>
                  </div>
                  <div className="flex gap-1">
                    {agent.services.map((service) => (
                      <Badge key={service} className="bg-primary text-white text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent POS Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">{transaction.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.agent} • {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₦{formatCurrency(transaction.amount)}</div>
                  <div className="text-xs text-success">{transaction.status}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
