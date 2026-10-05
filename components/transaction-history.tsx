"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Filter } from "@/components/ui/iconify-compat"

interface TransactionHistoryProps {
  onBack: () => void
}

export function TransactionHistory({ onBack }: TransactionHistoryProps) {
  const [activeTab, setActiveTab] = useState("All")

  const transactions = [
    {
      id: 1,
      type: "Transfer to other bank",
      date: "May 19, 2023 10:15AM",
      amount: "₦ 20,000.00",
      status: "Successful",
      isDebit: true,
      section: "Today",
    },
    {
      id: 2,
      type: "Transfer to other bank",
      date: "May 18, 2023 10:15AM",
      amount: "₦ 30,000.00",
      status: "Pending",
      isDebit: true,
      section: "Today",
    },
    {
      id: 3,
      type: "Bank Deposit",
      date: "May 19, 2023 10:15AM",
      amount: "₦ 50,000.00",
      status: "Successful",
      isDebit: false,
      section: "Today",
    },
    {
      id: 4,
      type: "Mobile Data",
      date: "May 18, 2023 10:15AM",
      amount: "₦ 30,000.00",
      status: "Successful",
      isDebit: true,
      section: "Today",
    },
    {
      id: 5,
      type: "Transfer to other bank",
      date: "May 17, 2023 10:15AM",
      amount: "₦ 20,000.00",
      status: "Successful",
      isDebit: true,
      section: "Yesterday",
    },
    {
      id: 6,
      type: "Transfer to other bank",
      date: "May 16, 2023 10:15AM",
      amount: "₦ 30,000.00",
      status: "Pending",
      isDebit: true,
      section: "Yesterday",
    },
  ]

  const groupedTransactions = transactions.reduce(
    (acc, transaction) => {
      if (!acc[transaction.section]) {
        acc[transaction.section] = []
      }
      acc[transaction.section].push(transaction)
      return acc
    },
    {} as Record<string, typeof transactions>,
  )

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Transactions</h1>
        <div className="w-10"></div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-card px-4 py-3 border-b">
        <div className="flex gap-2">
          {["All", "Sent", "Received"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              className={`rounded-full px-6 ${
                activeTab === tab ? "bg-accent hover:bg-accent/90 text-black" : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search transaction" className="pl-10 pr-12 bg-card" />
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Filter className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 pb-20">
        {Object.entries(groupedTransactions).map(([section, sectionTransactions]) => (
          <div key={section} className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{section}</h3>
            <div className="space-y-3">
              {sectionTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${transaction.isDebit ? "bg-destructive" : "bg-success"}`}
                    ></div>
                    <div>
                      <div className="font-medium text-sm">{transaction.type}</div>
                      <div className="text-xs text-muted-foreground">{transaction.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${transaction.isDebit ? "text-destructive" : "text-success"}`}>
                      {transaction.isDebit ? "- " : "+ "}
                      {transaction.amount}
                    </div>
                    <div
                      className={`text-xs ${
                        transaction.status === "Successful" ? "text-success" : "text-orange-600"
                      }`}
                    >
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
