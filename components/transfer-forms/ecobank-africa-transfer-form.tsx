"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ChevronDown } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { accountNumberSchema, nameSchema, amountSchema, getErrorMessage } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { BeneficiaryLookup } from "@/components/beneficiary-lookup"
import { dataStore } from "@/lib/data-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * Ecobank Africa Transfer Form - for transfers to Ecobank branches across Africa
 * Covers West Africa, Central Africa, East Africa, and Southern Africa
 */

// Comprehensive list of countries where Ecobank operates
const ECOBANK_AFRICA_COUNTRIES = [
  // West Africa
  { name: "Benin", code: "BJ", region: "West Africa" },
  { name: "Burkina Faso", code: "BF", region: "West Africa" },
  { name: "Cape Verde", code: "CV", region: "West Africa" },
  { name: "Côte d'Ivoire", code: "CI", region: "West Africa" },
  { name: "Gambia", code: "GM", region: "West Africa" },
  { name: "Ghana", code: "GH", region: "West Africa" },
  { name: "Guinea", code: "GN", region: "West Africa" },
  { name: "Guinea-Bissau", code: "GW", region: "West Africa" },
  { name: "Liberia", code: "LR", region: "West Africa" },
  { name: "Mali", code: "ML", region: "West Africa" },
  { name: "Niger", code: "NE", region: "West Africa" },
  { name: "Nigeria", code: "NG", region: "West Africa" },
  { name: "Senegal", code: "SN", region: "West Africa" },
  { name: "Sierra Leone", code: "SL", region: "West Africa" },
  { name: "Togo", code: "TG", region: "West Africa" },
  // Central Africa
  { name: "Cameroon", code: "CM", region: "Central Africa" },
  { name: "Central African Republic", code: "CF", region: "Central Africa" },
  { name: "Chad", code: "TD", region: "Central Africa" },
  { name: "Congo (Brazzaville)", code: "CG", region: "Central Africa" },
  { name: "Democratic Republic of Congo", code: "CD", region: "Central Africa" },
  { name: "Equatorial Guinea", code: "GQ", region: "Central Africa" },
  { name: "Gabon", code: "GA", region: "Central Africa" },
  { name: "Sao Tome & Principe", code: "ST", region: "Central Africa" },
  // East Africa
  { name: "Burundi", code: "BI", region: "East Africa" },
  { name: "Ethiopia", code: "ET", region: "East Africa" },
  { name: "Kenya", code: "KE", region: "East Africa" },
  { name: "Rwanda", code: "RW", region: "East Africa" },
  { name: "South Sudan", code: "SS", region: "East Africa" },
  { name: "Tanzania", code: "TZ", region: "East Africa" },
  { name: "Uganda", code: "UG", region: "East Africa" },
  // Southern Africa
  { name: "Angola", code: "AO", region: "Southern Africa" },
  { name: "Malawi", code: "MW", region: "Southern Africa" },
  { name: "Mozambique", code: "MZ", region: "Southern Africa" },
  { name: "South Africa", code: "ZA", region: "Southern Africa" },
  { name: "Zambia", code: "ZM", region: "Southern Africa" },
  { name: "Zimbabwe", code: "ZW", region: "Southern Africa" },
]

const ecobankAfricaTransferSchema = z.object({
  country: z.string().min(1, "Please select a destination country"),
  bank: z.string().default("Ecobank"),
  accountNumber: accountNumberSchema,
  beneficiaryName: nameSchema,
  amount: amountSchema.refine((n) => n <= 5000000, {
    message: "Daily transfer limit is ₦5,000,000",
  }),
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

interface EcobankAfricaTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function EcobankAfricaTransferForm({ onSubmit, isLoading = false }: EcobankAfricaTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(ecobankAfricaTransferSchema, {
    defaultValues: {
      country: "",
      bank: "Ecobank",
      accountNumber: "",
      beneficiaryName: "",
      amount: "" as any,
      remark: "",
      saveAsBeneficiary: true,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const accountNumber = watch("accountNumber")
  const selectedCountry = ECOBANK_AFRICA_COUNTRIES.find((c) => c.name === watch("country"))

  const handleBeneficiaryFound = (info: { name: string; bank?: string; accountNumber?: string }) => {
    if (info.name) setValue("beneficiaryName", info.name)
    if (info.accountNumber) setValue("accountNumber", info.accountNumber)
    clearErrors(["beneficiaryName", "accountNumber"] as any)
  }

  const onAccountNumberChange = (value: string) => {
    setValue("accountNumber", value.replace(/\D/g, ""))
    if ((formState.errors as any).accountNumber) clearErrors("accountNumber")
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const africaTransferFee = 100 // Ecobank Africa transfers have ₦100 fee
      const totalAmount = values.amount + africaTransferFee
      
      // CRITICAL: Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${africaTransferFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate daily transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && t.type.includes("Ecobank Africa")
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 5000000) {
        setFormError(`Daily limit exceeded. Today's usage: ₦${dailyTotal.toLocaleString()}`)
        return
      }

      const payload = {
        accountNumber: values.accountNumber.trim(),
        bank: values.bank,
        name: values.beneficiaryName.trim(),
      }

      if (values.saveAsBeneficiary) {
        dataStore.addBeneficiary({
          ...payload,
          phone: values.country,
        })
      }

      onSubmit({
        accountNumber: payload.accountNumber,
        bank: payload.bank,
        beneficiaryName: payload.name,
        amount: values.amount,
        country: values.country,
        region: selectedCountry?.region || "",
        remark: values.remark,
        transferType: "ecobank-africa",
        fee: 100, // Ecobank Africa transfer fee
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{formError}</div>
          </div>
        )}

        {/* Source Account */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">From Account</label>
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00B2A9] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div>
                <div className="text-sm font-medium">Ecobank Account</div>
                <div className="text-xs text-gray-600">{userData.accountNumber}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Country Dropdown with search */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Destination Country *</label>
          <SearchableSelect
            options={ECOBANK_AFRICA_COUNTRIES.map((country) => ({
              value: country.name,
              label: `${country.name} (${country.region})`,
            }))}
            value={watch("country")}
            onValueChange={(value) => {
              setValue("country", value)
              ;(formState.errors as any).country && clearErrors("country")
            }}
            placeholder="Type or select country"
            searchPlaceholder="Search countries..."
            className={"bg-white " + ((formState.errors as any).country ? "border-red-500" : "")}
            maxHeight="max-h-80"
          />
          {selectedCountry && (
            <div className="text-xs text-[#00B2A9] mt-1">{selectedCountry.region}</div>
          )}
          <FormError name="country" />
        </div>

        {/* Bank - Disabled with Ecobank value */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Bank</label>
          <Input
            value="Ecobank"
            disabled
            className="bg-gray-100 text-gray-700 cursor-not-allowed"
          />
          <div className="text-xs text-gray-500 mt-1">Ecobank {selectedCountry?.region || ""}</div>
        </div>

        {/* Account Number */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Account Number *</label>
          <BeneficiaryLookup
            accountNumber={accountNumber}
            onBeneficiaryFound={handleBeneficiaryFound}
            onAccountNumberChange={onAccountNumberChange}
          />
          <FormError name="accountNumber" />
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Beneficiary Name *</label>
          <Input
            placeholder="Enter or confirm beneficiary name"
            {...methods.register("beneficiaryName")}
            className="bg-white"
          />
          <FormError name="beneficiaryName" />
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Amount (Max: ₦5,000,000) *</label>
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
                className="bg-white"
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
          <label className="text-sm font-medium text-gray-700 mb-2 block">Remark (Optional)</label>
          <Input
            placeholder="Enter transaction remark"
            {...methods.register("remark")}
            className="bg-white"
            maxLength={100}
          />
          <div className="text-xs text-gray-500 mt-1">Max 100 characters</div>
        </div>

        {/* Save Beneficiary */}
        <div className="flex items-center space-x-3 bg-[#00B2A9]/10 p-3 rounded-lg border border-[#00B2A9]/20">
          <Checkbox
            id="save-beneficiary"
            checked={watch("saveAsBeneficiary")}
            onCheckedChange={(checked) => setValue("saveAsBeneficiary", !!checked)}
            className="h-5 w-5"
          />
          <label htmlFor="save-beneficiary" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
            Save as beneficiary for future transfers
          </label>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-[#00B2A9] hover:bg-[#009c93] text-white py-3 rounded-full disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
