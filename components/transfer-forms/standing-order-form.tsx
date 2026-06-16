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
import { dataStore } from "@/lib/data-store"
import { getAllPaymentPlatforms } from "@/lib/banks-data"
import { BeneficiaryLookup } from "@/components/beneficiary-lookup"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * Standing Order Form - for recurring scheduled transfers
 * CBN Compliance: Recurring transaction limits, start/end date validation
 */

const standingOrderSchema = z.object({
  bank: z.string().min(1, "Please select a bank"),
  accountNumber: accountNumberSchema,
  beneficiaryName: nameSchema,
  amount: amountSchema.refine((n) => n <= 1000000, {
    message: "Standing order limit is ₦1,000,000 per transaction",
  }),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  remark: z.string().optional(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

interface StandingOrderFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function StandingOrderForm({ onSubmit, isLoading = false }: StandingOrderFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()

  const methods = useValidatedForm(standingOrderSchema, {
    defaultValues: {
      bank: "",
      accountNumber: "",
      beneficiaryName: "",
      amount: "" as any,
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      remark: "",
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const accountNumber = watch("accountNumber")
  const frequency = watch("frequency")

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

  const getFrequencyDescription = () => {
    const descriptions: Record<string, string> = {
      daily: "Every day",
      weekly: "Every week (7 days)",
      biweekly: "Every 2 weeks (14 days)",
      monthly: "Every month (30 days)",
      quarterly: "Every 3 months",
      yearly: "Every year (365 days)",
    }
    return descriptions[frequency] || ""
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const standingOrderFee = 0 // First transaction, recurring fee is deducted at each occurrence
      const totalAmount = values.amount + standingOrderFee
      
      // CRITICAL: Validate sufficient balance for first standing order transaction
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance for first transaction. You need ₦${totalAmount.toLocaleString()}. ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate date range
      const startDate = new Date(values.startDate)
      const endDate = new Date(values.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (startDate < today) {
        setFormError("Start date must be today or later")
        return
      }

      const daysRange = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysRange < 7) {
        setFormError("Standing order duration must be at least 7 days")
        return
      }

      if (daysRange > 1095) { // 3 years
        setFormError("Standing order duration cannot exceed 3 years")
        return
      }

      const payload = {
        accountNumber: values.accountNumber.trim(),
        bank: values.bank,
        name: values.beneficiaryName.trim(),
      }

      dataStore.addBeneficiary(payload)

      onSubmit({
        accountNumber: payload.accountNumber,
        bank: payload.bank,
        beneficiaryName: payload.name,
        amount: values.amount,
        frequency: values.frequency,
        startDate: values.startDate,
        endDate: values.endDate,
        remark: values.remark,
        transferType: "standing-order",
        fee: 0, // Recurring fee charged per occurrence, not here
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
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Main Account</div>
                <div className="text-xs text-gray-600">{userData.name}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Recipient Bank - All Nigerian banks and payment platforms with search */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Recipient Bank *</label>
          <SearchableSelect
            options={getAllPaymentPlatforms().map((bank) => ({
              value: bank.name,
              label: bank.name,
            }))}
            value={watch("bank")}
            onValueChange={(value) => {
              setValue("bank", value)
              ;(formState.errors as any).bank && clearErrors("bank")
            }}
            placeholder="Type or select bank"
            searchPlaceholder="Search banks..."
            className={"bg-white " + ((formState.errors as any).bank ? "border-red-500" : "")}
          />
          <FormError name="bank" />
        </div>

        {/* Account Number */}
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

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Amount (Max: ₦1,000,000) *</label>
          {(() => {
            const { ref: registerRef, ...amountRegister } = methods.register("amount")
            return (
              <Input
                placeholder="Enter amount (e.g. 10000.00)"
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

        {/* Frequency */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Transfer Frequency *</label>
          <Select value={frequency} onValueChange={(value) => { setValue("frequency", value as any) }}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly (Every 7 days)</SelectItem>
              <SelectItem value="biweekly">Biweekly (Every 14 days)</SelectItem>
              <SelectItem value="monthly">Monthly (Every 30 days)</SelectItem>
              <SelectItem value="quarterly">Quarterly (Every 90 days)</SelectItem>
              <SelectItem value="yearly">Yearly (Every 365 days)</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-blue-600 mt-2 font-medium">{getFrequencyDescription()}</div>
        </div>

        {/* Start Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date *</label>
          <Input
            type="date"
            {...methods.register("startDate")}
            className="bg-white"
            min={new Date().toISOString().split("T")[0]}
          />
          <FormError name="startDate" />
        </div>

        {/* End Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">End Date *</label>
          <Input
            type="date"
            {...methods.register("endDate")}
            className="bg-white"
            min={watch("startDate")}
          />
          <FormError name="endDate" />
          <div className="text-xs text-gray-500 mt-1">Duration: minimum 7 days, maximum 3 years</div>
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
