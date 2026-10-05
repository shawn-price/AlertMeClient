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

/**
 * Ecobank Domestic Transfer Form - for transfers within Ecobank Nigeria
 * Ecobank to Ecobank transfers with no transfer fees
 */

const ecobankDomesticTransferSchema = z.object({
  bank: z.string().default("Ecobank"),
  accountNumber: accountNumberSchema,
  beneficiaryName: nameSchema,
  amount: amountSchema.refine((n) => n <= 10000000, {
    message: "Daily transfer limit is ₦10,000,000",
  }),
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

interface EcobankDomesticTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function EcobankDomesticTransferForm({ onSubmit, isLoading = false }: EcobankDomesticTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(ecobankDomesticTransferSchema, {
    defaultValues: {
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
      const transferFee = 0 // Ecobank to Ecobank has no fee
      const totalAmount = values.amount + transferFee
      
      // CRITICAL: Validate sufficient balance for transfer (no fee for Ecobank)
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()}. ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate daily transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && (t.type.includes("Ecobank") || t.type.includes("Domestic"))
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 10000000) {
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
        transferType: "ecobank-domestic",
        fee: 0, // Ecobank to Ecobank transfers have no fee
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
          <label className="text-sm font-medium text-foreground mb-2 block">From Account</label>
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div>
                <div className="text-sm font-medium">Ecobank Account</div>
                <div className="text-xs text-muted-foreground">{userData.accountNumber}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Bank - Disabled with Ecobank value */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Bank</label>
          <Input
            value="Ecobank"
            disabled
            className="bg-muted text-foreground cursor-not-allowed"
          />
          <div className="text-xs text-muted-foreground mt-1">Ecobank Nigeria</div>
        </div>

        {/* Account Number with Real-time Lookup */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Account Number (10 digits) *</label>
          <BeneficiaryLookup
            accountNumber={accountNumber}
            onBeneficiaryFound={handleBeneficiaryFound}
            onAccountNumberChange={onAccountNumberChange}
          />
          <FormError name="accountNumber" />
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Beneficiary Name *</label>
          <Input
            placeholder="Enter or confirm beneficiary name"
            {...methods.register("beneficiaryName")}
            className="bg-card"
          />
          <FormError name="beneficiaryName" />
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Amount (Max: ₦10,000,000) *</label>
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
          <div className="text-xs text-secondary mt-1">₦0 transfer fee for Ecobank to Ecobank</div>
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
        <div className="flex items-center space-x-3 bg-primary/10 p-3 rounded-lg border border-primary/20">
          <Checkbox
            id="save-beneficiary"
            checked={watch("saveAsBeneficiary")}
            onCheckedChange={(checked) => setValue("saveAsBeneficiary", !!checked)}
            className="h-5 w-5"
          />
          <label htmlFor="save-beneficiary" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            Save as beneficiary for future transfers
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
