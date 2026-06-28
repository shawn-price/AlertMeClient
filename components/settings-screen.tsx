"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareDetailsModal } from "@/components/share-details-modal"
import { NetworkChatModal } from "@/components/network-chat-modal"
import { BankServiceStatus } from "@/components/bank-service-status"
import { AddFundsModal } from "@/components/add-funds-modal"
import { VartechSMSSettings } from "@/components/vartech-sms-settings"
import { ActionLogViewer } from "@/components/action-log-viewer"
import {
  ArrowLeft,
  Plus,
  Share2,
  Activity,
  ArrowDownToLine,
  PiggyBank,
  Network,
  Users,
  MessageSquare,
  CreditCard,
  Receipt,
  Palette,
  User,
  Wifi,
  HelpCircle,
  FileText,
  Archive,
} from "@/components/ui/iconify-compat"

// SMS Gateway icon
const Radio = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16c3.314-1.006 5-4.219 5-7.5 0-4.5-2.239-8-5-8s-5 3.5-5 8c0 3.281 1.686 6.494 5 7.5M8 16c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
  </svg>
)
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"

interface SettingsScreenProps {
  onNavigate: (screen: string) => void
  onBack: () => void
}

export function SettingsScreen({ onNavigate, onBack }: SettingsScreenProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [showServiceStatus, setShowServiceStatus] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showStorageModal, setShowStorageModal] = useState(false)
  const [showSMSGatewaySettings, setShowSMSGatewaySettings] = useState(false)
  const [showProcessLog, setShowProcessLog] = useState(false)
  const [storageContent, setStorageContent] = useState<string>("")
  const [storageStats, setStorageStats] = useState(() => dataStore.getStorageStats())
  const [userData, setUserData] = useState(dataStore.getUserData())

  // Subscribe to dataStore changes so UI updates when storage is cleared/modified
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setStorageStats(dataStore.getStorageStats())
      setUserData(dataStore.getUserData())
      // update preview if modal open
      if (showStorageModal) setStorageContent(dataStore.exportData())
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStorageModal])

  // Dynamic user statistics based on actual data
  const userStats = {
    balance: `₦ ${formatCurrency(userData.balance)}`,
    beneficiaries: dataStore.getBeneficiaries().length,
    recentTransactions: dataStore.getTransactions().slice(0, 10).length,
  }

  const quickActions = [
    {
      icon: Plus,
      label: "Add Funds",
      color: "bg-green-500",
      onClick: () => setShowAddFunds(true),
    },
    {
      icon: Share2,
      label: "Share Details",
      color: "bg-blue-500",
      onClick: () => setShowShareModal(true),
    },
    {
      icon: Activity,
      label: "Service Status",
      color: "bg-orange-500",
      onClick: () => setShowServiceStatus(true),
    },
    {
      icon: ArrowDownToLine,
      label: "Request Funds",
      color: "bg-purple-500",
      onClick: () => onNavigate("transfer-options"),
    },
    {
      icon: PiggyBank,
      label: "Savings",
      color: "bg-pink-500",
      onClick: () => console.log("Savings feature coming soon"),
    },
    {
      icon: Network,
      label: "Network",
      color: "bg-indigo-500",
      onClick: () => setShowNetworkModal(true),
    },
  ]

  const navigationItems = [
    {
      icon: Users,
      label: "Beneficiary Management",
      description: "Manage payment recipients",
      onClick: () => onNavigate("beneficiaries"),
    },
    {
      icon: MessageSquare,
      label: "SMS Templates",
      description: "Customize transaction alerts",
      onClick: () => onNavigate("sms-templates"),
    },
    {
      icon: Radio,
      label: "SMS Gateways",
      description: "Configure SMS providers and fallback",
      onClick: () => setShowSMSGatewaySettings(true),
    },
    {
      icon: CreditCard,
      label: "Business Card",
      description: "Share contact information",
      onClick: () => console.log("Business card feature coming soon"),
    },
    {
      icon: Receipt,
      label: "Receipt Generator",
      description: "Create and manage receipts",
      onClick: () => onNavigate("receipt-generator"),
    },
    {
      icon: User,
      label: "User Profile",
      description: "Manage account settings",
      onClick: () => onNavigate("profile"),
    },
    {
      icon: Palette,
      label: "Theme Settings",
      description: "Customize app appearance",
      onClick: () => onNavigate("themes"),
    },
  ]

  const systemItems = [
    {
      icon: Activity,
      label: "Process Log",
      description: "Track all app actions in real-time",
      onClick: () => setShowProcessLog(true),
    },
    {
      icon: Wifi,
      label: "Offline Mode",
      description: "Enable offline functionality",
      onClick: () => console.log("Offline mode coming soon"),
    },
    {
      icon: HelpCircle,
      label: "Support",
      description: "Get help and documentation",
      onClick: () => console.log("Support feature coming soon"),
    },
    {
      icon: Archive,
      label: "Storage",
      description: "Manage local app storage",
      onClick: () => setShowStorageModal(true),
    },
    {
      icon: FileText,
      label: "Documentation",
      description: "User guide and API docs",
      onClick: () => console.log("Documentation coming soon"),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-[#004A9F]">{userStats.balance}</div>
              <div className="text-xs text-gray-600">Current Balance</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-[#00B2A9]">{userStats.beneficiaries}</div>
              <div className="text-xs text-gray-600">Beneficiaries</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-[#A4D233]">{userStats.recentTransactions}</div>
              <div className="text-xs text-gray-600">Recent Transactions</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 border-gray-200 bg-transparent"
                    onClick={action.onClick}
                  >
                    <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs text-center">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={item.onClick}
                >
                  <IconComponent className="h-5 w-5 mr-3 text-[#004A9F]" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {/* System & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={item.onClick}
                >
                  <IconComponent className="h-5 w-5 mr-3 text-[#004A9F]" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                </Button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ShareDetailsModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} recipientPhone={userData?.phone} />
      <NetworkChatModal isOpen={showNetworkModal} onClose={() => setShowNetworkModal(false)} />
      <BankServiceStatus isOpen={showServiceStatus} onClose={() => setShowServiceStatus(false)} />
      <AddFundsModal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} />
      {showStorageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4">
          <div className="max-w-3xl w-full mt-12 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-[#004A9F]" />
                <h3 className="text-lg font-semibold">Storage Manager</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowStorageModal(false)}>Close</Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Storage Statistics</div>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  Total beneficiaries: {storageStats.totalBeneficiaries} • Transactions: {storageStats.totalTransactions}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={() => setStorageContent(dataStore.exportData())}>View Content</Button>
                  <Button
                    onClick={() => {
                      const json = dataStore.exportData()
                      const blob = new Blob([json], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "ecobank-data.json"
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Download JSON
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // confirm and clear
                      // eslint-disable-next-line no-restricted-globals
                      if (confirm("Are you sure you want to clear all local storage and reset app data? This cannot be undone.")) {
                        dataStore.clearAllData()
                        setStorageContent(dataStore.exportData())
                      }
                    }}
                  >
                    Clear Storage
                  </Button>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Content Preview</div>
                  <pre className="max-h-72 overflow-auto p-3 bg-gray-50 border rounded text-xs text-gray-700">{storageContent || "(No content loaded). Click 'View Content' to load."}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Gateway Settings Modal */}
      {showSMSGatewaySettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">SMS Gateway Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSMSGatewaySettings(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <VartechSMSSettings />
            </div>
          </div>
        </div>
      )}

      {/* Process Log Modal */}
      {showProcessLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Process Log - Real-Time Action Tracking</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProcessLog(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <ActionLogViewer maxVisible={50} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
