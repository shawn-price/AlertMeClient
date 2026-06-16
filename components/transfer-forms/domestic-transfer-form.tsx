"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { accountNumberSchema, nameSchema, amountSchema, getErrorMessage } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { BeneficiaryLookup } from "@/components/beneficiary-lookup"
import { NIGERIAN_BANKS, getAllPaymentPlatforms } from "@/lib/banks-data"
import { dataStore } from "@/lib/data-store"
import { ChevronDown } from "@/components/ui/iconify-compat"

/**
 * Domestic Transfer Form - for transfers within Nigeria to other banks
 * CBN Compliance: Implements proper account validation, maximum transfer limits, and audit trails
 */

const domesticTransferSchema = z.object({
  bank: z.string().min(1, "Please select a bank"),
  accountNumber: accountNumberSchema,
  beneficiaryName: nameSchema,
  amount: amountSchema.refine((n) => n <= 5000000, {
    message: "Daily transfer limit is ₦5,000,000",
  }),
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

interface DomesticTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function DomesticTransferForm({ onSubmit, isLoading = false }: DomesticTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(domesticTransferSchema, {
    defaultValues: {
      accountNumber: "",
      bank: "",
      beneficiaryName: "",
      amount: "" as any,
      remark: "",
      saveAsBeneficiary: true,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const accountNumber = watch("accountNumber")

  const handleBeneficiaryFound = (info: { name: string; bank?: string; accountNumber?: string }) => {
    if (info.name) setValue("beneficiaryName", info.name)
    if (info.bank) setValue("bank", info.bank)
    if (info.accountNumber) setValue("accountNumber", info.accountNumber)
    clearErrors(["beneficiaryName", "bank", "accountNumber"] as any)
  }

  const onAccountNumberChange = (value: string) => {
    setValue("accountNumber", value.replace(/\D/g, ""))
    if ((formState.errors as any).accountNumber) clearErrors("accountNumber")
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const transferFee = 30.0
      const totalAmount = values.amount + transferFee
      
      // CRITICAL: Validate sufficient balance for transfer + fee
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${transferFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate daily transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit
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
        dataStore.addBeneficiary(payload)
      }

      onSubmit({
        accountNumber: payload.accountNumber,
        bank: payload.bank,
        beneficiaryName: payload.name,
        amount: values.amount,
        remark: values.remark,
        transferType: "domestic",
        fee: 30, // Domestic transfer fee
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
          <label className="text-sm font-medium text-gray-700 mb-2 block">Source Account</label>
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Main Account</div>
                <div className="text-xs text-gray-600">{userData.name}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Recipient Bank - All Nigerian banks and payment platforms */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Recipient Bank *</label>
          <Select value={watch("bank")} onValueChange={(value) => { setValue("bank", value); (formState.errors as any).bank && clearErrors("bank") }}>
            <SelectTrigger className={"bg-white " + ((formState.errors as any).bank ? "border-red-500" : "")}>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {getAllPaymentPlatforms().map((bank) => (
                <SelectItem key={bank.code} value={bank.name}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError name="bank" />
        </div>

        {/* Account Number with Real-time Lookup */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Account Number (10 digits) *</label>
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

        {/* Amount with CBN limit validation */}
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
        <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
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
            className="w-full bg-[#004A9F] hover:bg-[#003875] text-white py-3 rounded-full disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
