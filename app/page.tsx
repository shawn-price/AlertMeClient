"use client"

import { useState, useEffect } from "react"
import { useStorageInit } from "@/hooks/use-storage-init"
import { useThemeInit } from "@/hooks/use-theme-init"
import { SplashScreen } from "@/components/splash-screen"
import { LoginScreen } from "@/components/login-screen"
import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { TransactionHistory } from "@/components/transaction-history"
import { TransferOptions } from "@/components/transfer-options"
import { NewBeneficiary } from "@/components/new-beneficiary"
import { TransferScreen } from "@/components/transfer-screen"
import { PinConfirmation } from "@/components/pin-confirmation"
import { TransactionSuccess } from "@/components/transaction-success"
import { SettingsScreen } from "@/components/settings-screen"
import { EnhancedProfileScreen } from "@/components/enhanced-profile-screen"
import { BeneficiaryManagement } from "@/components/beneficiary-management"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { SMSTemplateComposer } from "@/components/sms-template-composer"
import { ReceiptGenerator } from "@/components/receipt-generator"
import { EnhancedLoansScreen } from "@/components/enhanced-loans-screen"
import { PayBillsScreen } from "@/components/pay-bills-screen"
import { POSScreen } from "@/components/pos-screen"
import { CurrencyScreen } from "@/components/currency-screen"
import { SideMenu } from "@/components/side-menu"
import { TransactionDetailScreen } from "@/components/transaction-detail-screen"
import { NotificationsScreen } from "@/components/notifications-screen"
import { AddMoneyScreen } from "@/components/add-money-screen"
import { VirtualCardsScreen } from "@/components/virtual-cards-screen"
import { TransferProcessingScreen } from "@/components/transfer-processing-screen"
import { DetailedReceiptScreen } from "@/components/detailed-receipt-screen"
import { UpgradeLimitScreen } from "@/components/upgrade-limit-screen"
import { TransferRouter } from "@/components/transfer-router"
import { Toaster } from "@/components/ui/toaster"
import { dataStore } from "@/lib/data-store"
import { LoanRequirementsChecklist } from "@/components/loan-requirements-checklist"
import { LoanAgreementPage } from "@/components/loan-agreement-page"
import { SecretNetworkPanel } from "@/components/secret-network-panel"
import { useNetworkTapDetector } from "@/hooks/use-network-tap-detector"
import { actionLogger } from "@/lib/action-logger"

export default function Home() {
  useStorageInit()
  useThemeInit()

  const [currentScreen, setCurrentScreen] = useState("splash")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [transferData, setTransferData] = useState<any>(null)
  const [screenHistory, setScreenHistory] = useState<string[]>([])
  const [isSecretPanelOpen, setIsSecretPanelOpen] = useState(false)

  const { handleNetworkIndicatorTap } = useNetworkTapDetector(() => {
    setIsSecretPanelOpen(true)
    if (actionLogger) {
      actionLogger.log("Secret Network Panel Opened", "system", "success", {
        trigger: "5-tap network indicator",
      })
    }
  })

  useEffect(() => {
    const hasAccount = dataStore.hasExistingAccount()
    if (!hasAccount) {
      setCurrentScreen("login")
    }
  }, [])

  const handleNavigate = (screen: string, data?: any) => {
    setScreenHistory([...screenHistory, currentScreen])
    setCurrentScreen(screen)
    if (data) {
      setTransferData(data)
    }
    setIsMenuOpen(false)

    // Log navigation action
    if (actionLogger) {
      actionLogger.logNavigation(screen, currentScreen)
    }
  }

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1]
      setScreenHistory(screenHistory.slice(0, -1))
      setCurrentScreen(previousScreen)
    } else {
      setCurrentScreen("dashboard")
    }
  }

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash":
        return <SplashScreen onComplete={() => setCurrentScreen("login")} />
      case "login":
        return <LoginScreen onLogin={() => setCurrentScreen("dashboard")} />
      case "dashboard":
        return <EnhancedDashboard onNavigate={handleNavigate} onMenuToggle={handleMenuToggle} onNetworkTap={() => setIsSecretPanelOpen(true)} />
      case "transactions":
        return <TransactionHistory onBack={handleBack} onNavigate={handleNavigate} />
      case "transfer-options":
        return <TransferOptions onBack={handleBack} onNavigate={handleNavigate} />
      case "new-beneficiary":
        return <NewBeneficiary onBack={handleBack} onNavigate={handleNavigate} />
      case "transfer":
        return <TransferScreen onBack={handleBack} onNavigate={handleNavigate} transferData={transferData} />
      case "pin-confirmation":
        return <PinConfirmation onBack={handleBack} onNavigate={handleNavigate} transferData={transferData} />
      case "transaction-success":
        return <TransactionSuccess onNavigate={handleNavigate} transferData={transferData} />
      case "settings":
        return <SettingsScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "profile":
        return <EnhancedProfileScreen onBack={handleBack} />
      case "beneficiary-management":
        return <BeneficiaryManagement onBack={handleBack} />
      case "themes":
        return <ThemeCustomizer onBack={handleBack} />
      case "sms-templates":
        return <SMSTemplateComposer onBack={handleBack} />
      case "receipt-generator":
        return <ReceiptGenerator onBack={handleBack} />
      case "loans":
        return <EnhancedLoansScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "loan-requirements":
        return <LoanRequirementsChecklist onBack={handleBack} />
      case "loan-agreement":
        return <LoanAgreementPage onBack={handleBack} loanApplicationId={transferData} />
      case "pay-bills":
        return <PayBillsScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "pos":
        return <POSScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "currency":
        return <CurrencyScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "transaction-detail":
        return <TransactionDetailScreen onBack={handleBack} transactionId={transferData} />
      case "notifications":
        return <NotificationsScreen onBack={handleBack} />
      case "add-money":
        return <AddMoneyScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "virtual-cards":
        return <VirtualCardsScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "transfer-processing":
        return <TransferProcessingScreen onNavigate={handleNavigate} transferData={transferData} />
      case "detailed-receipt":
        return <DetailedReceiptScreen onBack={handleBack} transactionId={transferData} />
      case "upgrade-limit":
        return <UpgradeLimitScreen onBack={handleBack} onNavigate={handleNavigate} />
      case "ecobank-domestic":
      case "ecobank-africa":
      case "other-banks":
      case "mobile-money":
      case "international":
      case "standing-order":
      case "visa-direct":
      case "email-sms":
        return <TransferRouter transferType={currentScreen} onBack={handleBack} onSubmit={(data) => handleNavigate("transfer", data)} />
      default:
        return <EnhancedDashboard onNavigate={handleNavigate} onMenuToggle={handleMenuToggle} />
    }
  }

  return (
    <div className="relative">
      {renderScreen()}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleNavigate} />
      <SecretNetworkPanel isOpen={isSecretPanelOpen} onClose={() => setIsSecretPanelOpen(false)} />
      <Toaster />
    </div>
  )
}
