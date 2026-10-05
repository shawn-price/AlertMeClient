"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Crown, Star, Zap, Shield, Globe, CheckCircle, Home } from "@/components/ui/iconify-compat"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/form-utils"

interface UpgradeLimitScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function UpgradeLimitScreen({ onBack, onNavigate }: UpgradeLimitScreenProps) {
  const [currentTier, setCurrentTier] = useState("Eco Limit 1")
  const [selectedTier, setSelectedTier] = useState("")
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { toast } = useToast()

  const tiers = [
    {
      id: "eco1",
      name: "Eco Limit 1",
      icon: Star,
      color: "from-muted-foreground/60 to-muted-foreground",
      current: true,
      dailyLimit: 50000,
      monthlyLimit: 200000,
      features: ["Basic transfers", "Bill payments", "Airtime purchase", "Basic customer support"],
      requirements: ["Valid phone number", "Basic KYC"],
      price: "Free",
    },
    {
      id: "eco2",
      name: "Eco Limit 2",
      icon: Zap,
      color: "from-primary to-primary/70",
      current: false,
      dailyLimit: 200000,
      monthlyLimit: 1000000,
      features: [
        "Higher transfer limits",
        "International transfers",
        "Virtual cards",
        "Priority support",
        "Investment options",
      ],
      requirements: ["Valid ID (NIN/Passport)", "Address verification", "Selfie verification"],
      price: "₦500/month",
    },
    {
      id: "eco3",
      name: "Eco Limit 3",
      icon: Crown,
      color: "from-purple-500 to-purple-700",
      current: false,
      dailyLimit: 1000000,
      monthlyLimit: 5000000,
      features: [
        "Unlimited transfers",
        "Premium virtual cards",
        "Forex trading",
        "Dedicated relationship manager",
        "Exclusive investment products",
        "Airport lounge access",
      ],
      requirements: ["Income verification", "Utility bill", "Bank statement", "Video call verification"],
      price: "₦2,000/month",
    },
    {
      id: "premium",
      name: "Premium Banking",
      icon: Globe,
      color: "from-warning to-warning/70",
      current: false,
      dailyLimit: 10000000,
      monthlyLimit: 50000000,
      features: [
        "Unlimited everything",
        "Global banking services",
        "Private banking",
        "Concierge services",
        "Exclusive events access",
        "Personal financial advisor",
      ],
      requirements: ["Minimum balance ₦5M", "Income proof ₦500K+", "In-person verification"],
      price: "₦10,000/month",
    },
  ]

  const handleUpgrade = async (tierId: string) => {
    setIsUpgrading(true)
    setSelectedTier(tierId)

    // Simulate upgrade process
    setTimeout(() => {
      const tier = tiers.find((t) => t.id === tierId)
      setCurrentTier(tier?.name || "")
      setIsUpgrading(false)

      toast({
        title: "Upgrade Successful!",
        description: `Your account has been upgraded to ${tier?.name}`,
      })

      // Navigate back after success
      setTimeout(() => {
        onNavigate("dashboard")
      }, 2000)
    }, 3000)
  }

  if (isUpgrading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Upgrading Account...</h2>
          <p className="text-muted-foreground">Please wait while we process your upgrade</p>
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
        <h1 className="text-lg font-semibold">Upgrade Account Limit</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Current Status */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm opacity-80">Current Tier</div>
                <div className="text-xl font-bold">{currentTier}</div>
              </div>
              <Shield className="h-8 w-8 opacity-80" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Limit Used</span>
                <span>₦25,000 / ₦50,000</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Available Tiers */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Upgrades</h2>

          {tiers.map((tier) => {
            const IconComponent = tier.icon
            return (
              <Card key={tier.id} className={`${tier.current ? "border-primary bg-primary/5" : "border-border"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tier.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">{tier.price}</div>
                      </div>
                    </div>
                    {tier.current && <Badge className="bg-primary text-white">Current</Badge>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Daily Limit</div>
                      <div className="font-semibold">₦{formatCurrency(tier.dailyLimit)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Monthly Limit</div>
                      <div className="font-semibold">₦{formatCurrency(tier.monthlyLimit)}</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="text-sm font-medium mb-2">Features:</div>
                    <div className="space-y-1">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="text-sm font-medium mb-2">Requirements:</div>
                    <div className="text-xs text-muted-foreground">{tier.requirements.join(" • ")}</div>
                  </div>

                  {/* Action Button */}
                  {!tier.current && (
                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Upgrade to {tier.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Benefits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why Upgrade?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-success/15 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="font-medium text-sm">Higher Transaction Limits</div>
                <div className="text-xs text-muted-foreground">Send and receive more money daily</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">International Services</div>
                <div className="text-xs text-muted-foreground">Access global banking features</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Premium Support</div>
                <div className="text-xs text-muted-foreground">Priority customer service</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
