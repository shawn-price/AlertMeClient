"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Menu,
  Bell,
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  MoreHorizontal,
  HomeIcon,
  InboxIcon,
  CreditCardIcon,
  UserIcon,
  CogIcon,
  Smartphone,
  Globe,
  ChevronDown,
} from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { remoteSystem } from "@/lib/remote-system"

interface EnhancedDashboardProps {
  onNavigate: (screen: string, id?: string) => void
  onMenuToggle: () => void
}

export function EnhancedDashboard({ onNavigate, onMenuToggle }: EnhancedDashboardProps) {
  const [isMoreExpanded, setIsMoreExpanded] = useState(false)
  const [showRecentTransactions, setShowRecentTransactions] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [userData, setUserData] = useState(dataStore.getUserData())
  const [transactions, setTransactions] = useState(dataStore.getTransactions().slice(0, 3))
  const [unreadCount, setUnreadCount] = useState(dataStore.getUnreadNotificationCount())
  const [isSocketConnected, setIsSocketConnected] = useState(remoteSystem.isConnected())

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setUserData(dataStore.getUserData())
      setTransactions(dataStore.getTransactions().slice(0, 3))
      setUnreadCount(dataStore.getUnreadNotificationCount())
    })

    // Monitor socket connection status
    const connectionCheckInterval = setInterval(() => {
      setIsSocketConnected(remoteSystem.isConnected())
    }, 1000) // Check every second

    return () => {
      unsubscribe()
      clearInterval(connectionCheckInterval)
    }
  }, [])

  const formatBalance = (balance: number) => {
    return showBalance ? `₦ ${formatCurrency(balance)}` : "₦ ****"
  }

  const handleQuickAction = (action: string) => {
    console.log("[v0] Quick action triggered:", action)

    if (action === "more") {
      setShowRecentTransactions(false)
      setIsMoreExpanded(!isMoreExpanded)
    } else if (action === "add-money") {
      onNavigate("add-money")
    } else if (action === "transfer-options") {
      onNavigate("transfer-options")
    } else if (action === "pay-bills") {
      onNavigate("pay-bills")
    } else {
      console.warn("[v0] Unknown quick action:", action)
    }
  }

  const handleAdditionalService = (action: string) => {
    console.log("[v0] Additional service action:", action)

    if (!action) {
      console.error("[v0] No action specified for additional service")
      return
    }

    onNavigate(action)
    setIsMoreExpanded(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 card-shadow-sm sticky top-0 z-50 safe-area-inset-top">
        <Button variant="ghost" size="icon" className="touch-target" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Hello {userData.name.split(" ")[0]}</span>
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-white">
            {userData.profilePicture ? (
              <img
                src={userData.profilePicture || "/placeholder.svg"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">{userData.name.charAt(0)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync Dot - Green if connected, Red if disconnected */}
          <div 
            className={`w-3 h-3 rounded-full ${
              isSocketConnected ? "bg-green-500 animate-pulse-gentle" : "bg-red-500 animate-pulse"
            }`}
            title={isSocketConnected ? "Connected to server" : "Disconnected from server"}
          />
          <div className="relative">
            <Button variant="ghost" size="icon" className="touch-target" onClick={() => onNavigate("notifications")}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse-gentle">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Eco Limit Banner */}
      <div className="px-4 py-3">
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-3 flex items-center justify-between border border-blue-100 card-shadow-sm">
          <div>
            <span className="text-xs font-semibold text-gray-600 block">Eco Limit 1</span>
            <span className="text-xs text-gray-500">Standard tier</span>
          </div>
          <Button
            size="sm"
            className="gradient-accent text-black hover:opacity-90 touch-target font-medium"
            onClick={() => onNavigate("upgrade-limit")}
          >
            Upgrade
          </Button>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="px-4 mb-6">
        <Card className="gradient-primary text-white premium-shadow border-0 overflow-hidden relative">
          {/* Decorative background element */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/80 text-sm font-semibold">Ecobank</div>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-white/80 hover:text-white"
                onClick={() => onNavigate("transactions")}
              >
                Transaction history
              </Button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/80 text-sm">Available Balance</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-white/80 hover:text-white"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-4xl font-bold tracking-tight text-balance">{formatBalance(userData.balance)}</div>
            </div>

            <div className="border-t border-white/20 pt-4 flex justify-between text-sm">
              <div>
                <div className="text-white/70 text-xs">A/C Name</div>
                <div className="font-semibold">{userData.name}</div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-xs">A/C Number</div>
                <div className="font-semibold">****{userData.accountNumber.slice(4)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Transaction */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">QUICK TRANSACTION</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Add Money", icon: ArrowDownToLine, action: "add-money" },
            { label: "Send Money", icon: ArrowUpFromLine, action: "transfer-options" },
            { label: "Pay Bills", icon: Copy, action: "pay-bills" },
            { label: "More", icon: MoreHorizontal, action: "more" },
          ].map((item, idx) => (
            <div key={item.action} className="text-center">
              <Button
                size="icon"
                className="w-14 h-14 rounded-full mb-3 bg-[#004A9F] text-white hover:bg-[#003875] transition-all duration-200 shadow-md hover:shadow-lg touch-target mx-auto active:scale-95 flex items-center justify-center"
                onClick={() => handleQuickAction(item.action)}
              >
                <item.icon className="h-6 w-6" />
              </Button>
              <span className="text-xs font-semibold text-gray-800 block text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable More Section */}
      <AnimatePresence>
        {isMoreExpanded && (
          <motion.div
            className="px-4 mb-6"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              className="bg-white rounded-lg p-4 card-shadow border border-gray-100"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <h4 className="text-sm font-semibold mb-3 text-gray-900">Additional Services</h4>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Loans", icon: CreditCardIcon, action: "loans" },
                  { label: "Cards", icon: CreditCardIcon, action: "virtual-cards" },
                  { label: "POS", icon: Smartphone, action: "pos" },
                  { label: "Currency", icon: Globe, action: "currency" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.action}
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                  >
                    <Button
                      size="icon"
                      className="w-14 h-14 rounded-full mb-3 bg-[#004A9F] text-white hover:bg-[#003875] transition-all duration-200 shadow-md hover:shadow-lg touch-target mx-auto active:scale-95"
                      onClick={() => handleAdditionalService(item.action)}
                    >
                      <item.icon className="h-6 w-6" />
                    </Button>
                    <span className="text-xs font-semibold text-gray-800 block text-center">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 mb-24">
        {showRecentTransactions ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Button
                variant="link"
                className="text-[#004A9F] text-sm p-0 font-medium hover:text-[#0072C6]"
                onClick={() => onNavigate("transactions")}
              >
                See all
              </Button>
            </div>

            <div className="space-y-2">
              {transactions.map((transaction, idx) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg card-shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-200 touch-target"
                  onClick={() => onNavigate("transaction-detail", transaction.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        transaction.status === "Successful"
                          ? "bg-green-500"
                          : transaction.status === "Pending"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900">{transaction.type}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.date} {transaction.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${transaction.isDebit ? "text-red-600" : "text-green-600"}`}>
                      {transaction.isDebit ? "- " : "+ "}₦ {formatCurrency(transaction.amount)}
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        transaction.status === "Successful"
                          ? "text-green-600"
                          : transaction.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="bg-white rounded-lg p-4 card-shadow-sm cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-100 touch-target active:scale-95"
            onClick={() => {
              setShowRecentTransactions(true)
              setIsMoreExpanded(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <ChevronDown className="h-5 w-5 text-[#004A9F]" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg safe-area-inset-bottom z-40">
        <div className="flex justify-around items-center max-w-screen-sm mx-auto">
          {[
            { label: "Home", icon: HomeIcon, color: "#004A9F", isActive: true },
            { label: "Inbox", icon: InboxIcon, action: "notifications", notification: unreadCount, color: "#004A9F" },
            { label: "Cards", icon: CreditCardIcon, action: "virtual-cards", color: "#004A9F" },
            { label: "Beneficiaries", icon: UserIcon, action: "beneficiary-management", color: "#004A9F" },
            { label: "Settings", icon: CogIcon, action: "settings", color: "#004A9F" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-center justify-center gap-1 flex-1 cursor-pointer touch-target transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={() => item.action && onNavigate(item.action)}
              title={item.label}
            >
              <div className="relative">
                {item.icon && (
                  <item.icon
                    className="h-6 w-6 transition-colors duration-200"
                    style={item.isActive ? { color: item.color } : { color: "#9CA3AF" }}
                  />
                )}
                {item.notification && item.notification > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shadow-md">
                    {item.notification > 9 ? "9+" : item.notification}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-semibold transition-colors duration-200 whitespace-nowrap"
                style={item.isActive ? { color: item.color } : { color: "#9CA3AF" }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
