"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ChevronDown } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { nameSchema, amountSchema, getErrorMessage } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * International Transfer Form - for cross-border transfers
 * CBN Compliance: SWIFT/IBAN validation, AML checks, purpose of transfer
 */

const swiftCodeSchema = z
  .string()
  .min(8, "SWIFT code must be at least 8 characters")
  .max(11, "SWIFT code must not exceed 11 characters")
  .regex(/^[A-Z0-9]{8,11}$/, "Invalid SWIFT code format")

const ibanSchema = z
  .string()
  .min(15, "IBAN must be at least 15 characters")
  .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, "Invalid IBAN format")

const internationalTransferSchema = z.object({
  country: z.string().min(1, "Please select destination country"),
  bankName: z.string().min(1, "Bank name is required"),
  swiftCode: swiftCodeSchema,
  iban: ibanSchema,
  beneficiaryName: nameSchema,
  beneficiaryAddress: z.string().min(5, "Please provide beneficiary address"),
  amount: amountSchema.refine((n) => n <= 100000, {
    message: "International transfer limit is ₦100,000 per transaction",
  }),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
  purposeOfTransfer: z.string().min(1, "Purpose of transfer is required"),
  saveAsBeneficiary: z.boolean().default(true),
})

interface InternationalTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

const COUNTRIES = [
  { name: "United States", code: "US", currency: "USD" },
  { name: "United Kingdom", code: "GB", currency: "GBP" },
  { name: "Canada", code: "CA", currency: "CAD" },
  { name: "Australia", code: "AU", currency: "AUD" },
  { name: "Germany", code: "DE", currency: "EUR" },
  { name: "France", code: "FR", currency: "EUR" },
  { name: "South Africa", code: "ZA", currency: "ZAR" },
  { name: "Kenya", code: "KE", currency: "KES" },
  { name: "Ghana", code: "GH", currency: "GHS" },
]

const TRANSFER_PURPOSES = [
  "Personal remittance",
  "Business payment",
  "Salary/Wages",
  "Education fees",
  "Investment",
  "Loan repayment",
  "Trade payment",
  "Other",
]

export function InternationalTransferForm({ onSubmit, isLoading = false }: InternationalTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(internationalTransferSchema, {
    defaultValues: {
      country: "",
      bankName: "",
      swiftCode: "",
      iban: "",
      beneficiaryName: "",
      beneficiaryAddress: "",
      amount: "" as any,
      currency: "USD",
      purposeOfTransfer: "",
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const selectedCountry = COUNTRIES.find((c) => c.name === watch("country"))

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const internationalFee = 500 // International transfers have ₦500 fee
      const totalAmount = values.amount + internationalFee
      
      // CRITICAL: Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${internationalFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // KYC Check - verify user BVN is available
      if (!userData.bvn) {
        setFormError("BVN verification required for international transfers. Please update your profile.")
        return
      }

      // Daily international transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && t.type.includes("International")
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 500000) {
        setFormError(`Daily international transfer limit is ₦500,000. Today's usage: ₦${dailyTotal.toLocaleString()}`)
        return
      }

      const payload = {
        country: values.country,
        bankName: values.bankName.trim(),
        swiftCode: values.swiftCode.trim().toUpperCase(),
        iban: values.iban.trim().toUpperCase(),
        name: values.beneficiaryName.trim(),
        address: values.beneficiaryAddress.trim(),
      }

      if (watch("saveAsBeneficiary")) {
        dataStore.addBeneficiary({
          accountNumber: values.iban,
          bank: values.bankName,
          name: payload.name,
          phone: values.country,
        })
      }

      onSubmit({
        country: values.country,
        bankName: payload.bankName,
        swiftCode: payload.swiftCode,
        iban: payload.iban,
        beneficiaryName: payload.name,
        beneficiaryAddress: payload.address,
        amount: values.amount,
        currency: values.currency,
        purposeOfTransfer: values.purposeOfTransfer,
        transferType: "international",
        fee: 500, // International transfer fee
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Main Account</div>
                <div className="text-xs text-muted-foreground">{userData.name}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Destination Country with search */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Destination Country *</label>
          <SearchableSelect
            options={COUNTRIES.map((country) => ({
              value: country.name,
              label: country.name,
            }))}
            value={watch("country")}
            onValueChange={(value) => {
              setValue("country", value)
              ;(formState.errors as any).country && clearErrors("country")
            }}
            placeholder="Type or select country"
            searchPlaceholder="Search countries..."
            className={"bg-card " + ((formState.errors as any).country ? "border-destructive" : "")}
          />
          <FormError name="country" />
        </div>

        {/* Bank Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Recipient Bank Name *</label>
          <Input
            placeholder="Enter bank name"
            {...methods.register("bankName")}
            className="bg-card"
          />
          <FormError name="bankName" />
        </div>

        {/* SWIFT Code */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">SWIFT Code *</label>
          <Input
            placeholder="e.g., CHASUS33"
            {...methods.register("swiftCode")}
            className="bg-card uppercase"
          />
          <FormError name="swiftCode" />
        </div>

        {/* IBAN */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">IBAN (International Bank Account Number) *</label>
          <Input
            placeholder="e.g., DE89370400440532013000"
            {...methods.register("iban")}
            className="bg-card uppercase"
          />
          <FormError name="iban" />
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Beneficiary Name *</label>
          <Input
            placeholder="Enter beneficiary full name"
            {...methods.register("beneficiaryName")}
            className="bg-card"
          />
          <FormError name="beneficiaryName" />
        </div>

        {/* Beneficiary Address */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Beneficiary Address *</label>
          <Input
            placeholder="Enter complete address"
            {...methods.register("beneficiaryAddress")}
            className="bg-card"
            maxLength={100}
          />
          <FormError name="beneficiaryAddress" />
        </div>

        {/* Currency */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Currency *</label>
          <Select value={watch("currency")} onValueChange={(value) => { setValue("currency", value as any) }}>
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "CAD", "AUD"].map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError name="currency" />
        </div>

        {/* Amount with international limit */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Amount in ₦ (Max: ₦100,000) *</label>
          {(() => {
            const { ref: registerRef, ...amountRegister } = methods.register("amount")
            return (
              <Input
                placeholder="Enter amount (e.g. 50000.00)"
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

        {/* Purpose of Transfer - CBN requirement */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Purpose of Transfer *</label>
          <Select value={watch("purposeOfTransfer")} onValueChange={(value) => { setValue("purposeOfTransfer", value) }}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_PURPOSES.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {purpose}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError name="purposeOfTransfer" />
        </div>

        {/* Save Beneficiary */}
        <div className="flex items-center space-x-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
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
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
