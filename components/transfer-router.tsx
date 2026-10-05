"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "@/components/ui/iconify-compat"
import { EcobankDomesticTransferForm } from "@/components/transfer-forms/ecobank-domestic-transfer-form"
import { EcobankAfricaTransferForm } from "@/components/transfer-forms/ecobank-africa-transfer-form"
import { DomesticTransferForm } from "@/components/transfer-forms/domestic-transfer-form"
import { MobileMoneyTransferForm } from "@/components/transfer-forms/mobile-money-transfer-form"
import { InternationalTransferForm } from "@/components/transfer-forms/international-transfer-form"
import { StandingOrderForm } from "@/components/transfer-forms/standing-order-form"
import { VisaDirectTransferForm } from "@/components/transfer-forms/visa-direct-transfer-form"
import { EmailSmsTransferForm } from "@/components/transfer-forms/email-sms-transfer-form"

interface TransferRouterProps {
  transferType: string
  onBack: () => void
  onSubmit: (data: any) => void
}

/**
 * Transfer Router - Route to appropriate form based on transfer type
 */
export function TransferRouter({ transferType, onBack, onSubmit }: TransferRouterProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitleAndForm = () => {
    switch (transferType) {
      case "ecobank-domestic":
        return {
          title: "Ecobank Domestic Transfer",
          form: <EcobankDomesticTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "ecobank-africa":
        return {
          title: "Ecobank Africa Transfer",
          form: <EcobankAfricaTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "other-banks":
        return {
          title: "Domestic Bank Transfer",
          form: <DomesticTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "mobile-money":
        return {
          title: "Mobile Money Transfer",
          form: <MobileMoneyTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "international":
        return {
          title: "International Transfer",
          form: <InternationalTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "standing-order":
        return {
          title: "Standing Order (Recurring Transfer)",
          form: <StandingOrderForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "visa-direct":
        return {
          title: "Visa Direct (Card Transfer)",
          form: <VisaDirectTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      case "email-sms":
        return {
          title: "Transfer by Email or SMS",
          form: <EmailSmsTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
      default:
        return {
          title: "Transfer",
          form: <DomesticTransferForm onSubmit={handleSubmit} isLoading={isSubmitting} />,
        }
    }
  }

  const { title, form } = getTitleAndForm()

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="w-10"></div>
      </div>

      {/* Form Content */}
      {form}
    </div>
  )
}
