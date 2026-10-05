"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ChevronDown } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { nameSchema, amountSchema, getErrorMessage, phoneSchema } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * Mobile Money Transfer Form - for transfers to mobile money wallets
 * CBN Compliance: Phone number validation, daily limits, and KYC requirements
 */

const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?234\d{10}$|^0\d{10}$/, "Phone number must be valid Nigerian number (e.g., 08012345678 or +2348012345678)")

const mobileMoneyTransferSchema = z.object({
  provider: z.string().min(1, "Please select a provider"),
  phoneNumber: phoneNumberSchema,
  beneficiaryName: nameSchema,
  amount: amountSchema.refine((n) => n <= 1000000, {
    message: "Daily mobile money limit is ₦1,000,000",
  }),
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

interface MobileMoneyTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

const MOBILE_MONEY_PROVIDERS = [
  { name: "Opay", code: "opay" },
  { name: "PalmPay", code: "palmpay" },
  { name: "Paga", code: "paga" },
  { name: "Kuda Bank", code: "kuda" },
  { name: "Fairmoney", code: "fairmoney" },
  { name: "MoMo PSB (MTN)", code: "momo" },
  { name: "MONIPOINT MFB", code: "monipoint" },
  { name: "NowNow Digital", code: "nownow" },
]

export function MobileMoneyTransferForm({ onSubmit, isLoading = false }: MobileMoneyTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(mobileMoneyTransferSchema, {
    defaultValues: {
      provider: "",
      phoneNumber: "",
      beneficiaryName: "",
      amount: "" as any,
      remark: "",
      saveAsBeneficiary: true,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const mobileFee = 50 // Mobile money transfers have ₦50 fee
      const totalAmount = values.amount + mobileFee
      
      // CRITICAL: Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${mobileFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate daily mobile money transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && t.type.includes("Mobile")
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 1000000) {
        setFormError(`Daily mobile money limit exceeded. Today's usage: ₦${dailyTotal.toLocaleString()}`)
        return
      }

      // Normalize phone number to +234 format
      let normalizedPhone = values.phoneNumber
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+234" + normalizedPhone.slice(1)
      } else if (!normalizedPhone.startsWith("+234")) {
        normalizedPhone = "+234" + normalizedPhone.slice(3)
      }

      const payload = {
        phoneNumber: normalizedPhone,
        provider: values.provider,
        name: values.beneficiaryName.trim(),
      }

      if (values.saveAsBeneficiary) {
        dataStore.addBeneficiary({
          accountNumber: normalizedPhone,
          bank: values.provider,
          name: payload.name,
          phone: normalizedPhone,
        })
      }

      onSubmit({
        phoneNumber: normalizedPhone,
        provider: values.provider,
        beneficiaryName: payload.name,
        amount: values.amount,
        remark: values.remark,
        transferType: "mobile-money",
        fee: 50, // Mobile money transfer fee
      })
    } catch (err) {
      const msg = getErrorMessage(err)
      setFormError(msg)
      toast({ title: "Failed", description: msg, variant: "destructive" })
    }
  })

  return (
    <Form methods={methods} onSubmit={onContinue}>
      <div className="px-4 py-6 space-y-6">
        {formError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{formError}</div>
          </div>
        )}

        {/* Source Account */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Source Account</label>
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-success to-success/70 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Main Account</div>
                <div className="text-xs text-muted-foreground">{userData.name}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Mobile Money Provider with search */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Mobile Money Provider *</label>
          <SearchableSelect
            options={MOBILE_MONEY_PROVIDERS.map((provider) => ({
              value: provider.name,
              label: provider.name,
            }))}
            value={watch("provider")}
            onValueChange={(value) => {
              setValue("provider", value)
              ;(formState.errors as any).provider && clearErrors("provider")
            }}
            placeholder="Type or select provider"
            searchPlaceholder="Search providers..."
            className={"bg-card " + ((formState.errors as any).provider ? "border-destructive" : "")}
          />
          <FormError name="provider" />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
          <Input
            placeholder="e.g., 08012345678 or +2348012345678"
            {...methods.register("phoneNumber")}
            className="bg-card"
            type="tel"
          />
          <FormError name="phoneNumber" />
          <div className="text-xs text-muted-foreground mt-1">Must be valid Nigerian mobile number</div>
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Recipient Name *</label>
          <Input
            placeholder="Enter recipient's name"
            {...methods.register("beneficiaryName")}
            className="bg-card"
          />
          <FormError name="beneficiaryName" />
        </div>

        {/* Amount with mobile money limit */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Amount (Max: ₦1,000,000) *</label>
          {(() => {
            const { ref: registerRef, ...amountRegister } = methods.register("amount")
            return (
              <Input
                placeholder="Enter amount (e.g. 1000.00)"
                inputMode="numeric"
                step="0.01"
                pattern="^\d+(\.\d{1,2})?$"
                {...amountRegister}
                ref={(el: HTMLInputElement | null) => {
                  amountInputRef.current = el
                  if (typeof registerRef === 'function') registerRef(el)
                }}
                className="bg-card"
                onBlur={(e) => {
                  const v = e.currentTarget.value
                  if (!v) return
                  const n = Number(v)
                  methods.setValue("amount", Number(n.toFixed(2)))
                }}
              />
            )
          })()}
          <FormError name="amount" />
        </div>

        {/* Remark (optional) */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Remark (Optional)</label>
          <Input
            placeholder="Enter transaction remark"
            {...methods.register("remark")}
            className="bg-card"
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1">Max 100 characters</div>
        </div>

        {/* Save Beneficiary */}
        <div className="flex items-center space-x-3 bg-success/10 p-3 rounded-lg border border-success/30">
          <Checkbox
            id="save-beneficiary"
            checked={watch("saveAsBeneficiary")}
            onCheckedChange={(checked) => setValue("saveAsBeneficiary", !!checked)}
            className="h-5 w-5"
          />
          <label htmlFor="save-beneficiary" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            Save for future transfers
          </label>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-secondary hover:bg-secondary/90 text-white py-3 rounded-full disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
