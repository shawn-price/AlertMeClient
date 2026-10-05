"use client"

import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  ArrowLeftRight, 
  Building2, 
  Globe, 
  CreditCard, 
  Smartphone, 
  Calendar, 
  Send,
  Wallet,
  Mail,
  ChevronRight
} from "@/components/ui/iconify-compat"

interface TransferOptionsProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function TransferOptions({ onBack, onNavigate }: TransferOptionsProps) {
  const transferOptions = [
    {
      id: "ecobank-domestic",
      title: "Ecobank Domestic",
      icon: ArrowLeftRight,
      bgColor: "bg-primary",
      screen: "ecobank-domestic",
      description: "Transfer to other Ecobank accounts in Nigeria",
      fee: "₦0",
    },
    {
      id: "other-banks",
      title: "Other Local Banks",
      icon: Building2,
      bgColor: "bg-muted-foreground",
      screen: "other-banks",
      description: "Transfer to other banks in Nigeria",
      fee: "₦30",
    },
    {
      id: "ecobank-africa",
      title: "Ecobank Africa",
      icon: Globe,
      bgColor: "bg-secondary",
      screen: "ecobank-africa",
      description: "Transfer to Ecobank accounts across Africa",
      fee: "₦50",
    },
    {
      id: "visa-direct",
      title: "Visa Direct",
      icon: CreditCard,
      bgColor: "bg-blue-600",
      screen: "visa-direct",
      description: "Card to card transfers worldwide",
      fee: "₦25",
    },
    {
      id: "mobile-money",
      title: "Mobile Money",
      icon: Wallet,
      bgColor: "bg-green-600",
      screen: "mobile-money",
      description: "Transfer to mobile money wallets",
      fee: "₦10",
    },
    {
      id: "standing-order",
      title: "Standing Order",
      icon: Calendar,
      bgColor: "bg-orange-600",
      screen: "standing-order",
      description: "Set up recurring automatic transfers",
      fee: "₦0",
    },
    {
      id: "international",
      title: "International Transfer",
      icon: Globe,
      bgColor: "bg-purple-600",
      screen: "international",
      description: "Send money to over 200 countries",
      fee: "₦500+",
    },
    {
      id: "email-sms",
      title: "Transfer by Email/SMS",
      icon: Mail,
      bgColor: "bg-indigo-600",
      screen: "email-sms",
      description: "Send money via email or SMS link",
      fee: "₦50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full transition-all duration-200" 
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Send Money</h1>
          <div className="w-10"></div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button className="bg-white/20 text-white px-6 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all duration-200 font-medium">
            Transfer
          </Button>
          <Button variant="ghost" className="text-white/70 px-6 py-2 rounded-full hover:bg-white/10 transition-all duration-200 font-medium">
            Request
          </Button>
        </div>
      </div>

      {/* Transfer Options */}
      <div className="px-4 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Choose Transfer Type</h2>
          <p className="text-sm text-muted-foreground">Select how you want to send money</p>
        </div>

        <div className="space-y-3">
          {transferOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <div
                key={option.id}
                className="group relative overflow-hidden"
              >
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 justify-between bg-card hover:bg-muted/50 border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  onClick={() => onNavigate(option.screen)}
                >
                  <div className="flex items-center gap-4 p-4 flex-1">
                    <div className={`${option.bgColor} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-base font-semibold text-foreground">{option.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                      <div className="text-xs text-secondary font-medium mt-1">Fee: {option.fee}</div>
                    </div>
                  </div>
                  <div className="pr-4">
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Help */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/15">
          <h3 className="text-sm font-semibold text-foreground mb-2">Need Help?</h3>
          <p className="text-xs text-muted-foreground">
            Contact our customer support for assistance with transfers. Available 24/7.
          </p>
          <Button variant="link" className="text-primary p-0 h-auto text-xs mt-2">
            Contact Support →
          </Button>
        </div>
      </div>
    </div>
  )
}
