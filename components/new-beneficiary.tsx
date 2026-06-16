"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ChevronDown, Home, AlertCircle } from "@/components/ui/iconify-compat"
import { NIGERIAN_BANKS, getAllPaymentPlatforms } from "@/lib/banks-data"
import { BeneficiaryLookup } from "@/components/beneficiary-lookup"
import { dataStore } from "@/lib/data-store"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { accountNumberSchema, nameSchema, amountSchema, getErrorMessage } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"

interface NewBeneficiaryProps {
  onBack: () => void
  onNavigate: (screen: string, data?: any) => void
}

const beneficiarySchema = z.object({
  bank: z.string().min(1, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  beneficiaryName: nameSchema,
  amount: amountSchema,
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

export function NewBeneficiary({ onBack, onNavigate }: NewBeneficiaryProps) {
  const [activeTab, setActiveTab] = useState("New Beneficiary")
  const [formError, setFormError] = useState("")
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([])
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Load saved beneficiaries
  useEffect(() => {
    const beneficiaries = dataStore.getBeneficiaries()

    // Add 20 sample beneficiaries for testing
    const sampleBeneficiaries = Array.from({ length: 20 }, (_, i) => ({
      id: `sample-${i}`, // Ensure unique IDs for React key
      accountNumber: `123456789${i}`,
      bank: `Sample Bank ${i + 1}`,
      name: `Sample Beneficiary ${i + 1}`,
    }))

    setSavedBeneficiaries([...beneficiaries, ...sampleBeneficiaries])
  }, [])

  const methods = useValidatedForm(beneficiarySchema, {
    defaultValues: {
      accountNumber: "",
      bank: "",
      beneficiaryName: "",
      amount: "" as any, // Initialize as empty string for blank placeholder display
      remark: "",
      saveAsBeneficiary: true,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const accountNumber = watch("accountNumber")

  // Handler for selecting a saved beneficiary - populates form and focuses amount field
  const handleSelectBeneficiary = (beneficiary: any) => {
    // Populate form fields with beneficiary data
    setValue("bank", beneficiary.bank)
    setValue("accountNumber", beneficiary.accountNumber)
    setValue("beneficiaryName", beneficiary.name)
    clearErrors(["bank", "accountNumber", "beneficiaryName"] as any)
    
    // Switch to New Beneficiary tab to show the populated form
    setActiveTab("New Beneficiary")
    
    // Focus on amount input field after a short delay to allow tab switch
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 100)
  }

  const handleBeneficiaryFound = (info: { name: string; bank?: string; accountNumber?: string }) => {
    if (info.name) setValue("beneficiaryName", info.name)
    if (info.bank) setValue("bank", info.bank)
    if (info.accountNumber) setValue("accountNumber", info.accountNumber)
    clearErrors(["beneficiaryName", "bank", "accountNumber"] as any)
  }

  const onAccountNumberChange = (value: string) => {
    // keep digits only
    setValue("accountNumber", value.replace(/\D/g, ""))
    if ((formState.errors as any).accountNumber) clearErrors("accountNumber")
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const payload = {
        accountNumber: values.accountNumber.trim(),
        bank: values.bank,
        name: values.beneficiaryName.trim(), // FIXED: Added 'name' for dataStore
      }

      if (values.saveAsBeneficiary) {
        dataStore.addBeneficiary(payload) // FIXED: Payload now includes 'name'
      }

      toast({ title: "Transfer ready", description: "You can now complete the transfer." })

      // amountSchema transforms to number, but ensure we pass number
      const amount = typeof values.amount === "number" ? values.amount : Number(values.amount)

      onNavigate("transfer", {
        accountNumber: payload.accountNumber,
        bank: payload.bank,
        beneficiaryName: payload.name, // FIXED: Using 'name' for navigation
        amount,
        remark: values.remark,
      })
    } catch (err) {
      const msg = getErrorMessage(err)
      setFormError(msg)
      toast({ title: "Failed", description: msg, variant: "destructive" })
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Transfer</h1>
        <Button variant="ghost" size="icon">
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex gap-2">
          {["New Beneficiary", "Saved Beneficiary"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              className={"rounded-full px-6 " + (activeTab === tab ? "bg-[#A4D233] hover:bg-[#8BC220] text-black" : "text-gray-600")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "New Beneficiary" ? (
        <Form methods={methods} onSubmit={onContinue}>
            <div className="px-4 py-6 space-y-6">
              {/* Form-level Error Display */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{formError}</div>
                </div>
              )}

              {/* From Account */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">From account</label>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Savings account</div>
                    <div className="text-xs text-gray-600">{dataStore.getUserData().name}</div>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
              </div>

              {/* Bank */}
              <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Bank</label>
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

            {/* Account Number with Beneficiary Lookup */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Account Number</label>
              <BeneficiaryLookup
                accountNumber={accountNumber}
                onBeneficiaryFound={handleBeneficiaryFound}
                onAccountNumberChange={onAccountNumberChange}
              />
              <FormError name="accountNumber" />
            </div>

            {/* Beneficiary Name (can be edited if lookup fails) */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Beneficiary Name</label>
              <Input
                placeholder="Enter or confirm beneficiary name"
                {...methods.register("beneficiaryName")}
                className="bg-white"
              />
              <FormError name="beneficiaryName" />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Amount</label>
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
                      // Store in our ref for programmatic focus
                      amountInputRef.current = el
                      // Also call react-hook-form's ref
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

            {/* Remark */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Remark (optional)</label>
              <Input
                placeholder="Enter remark"
                {...methods.register("remark")}
                className="bg-white"
              />
            </div>

            {/* Save as Beneficiary */}
            <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Checkbox
                id="save-beneficiary"
                checked={watch("saveAsBeneficiary")}
                onCheckedChange={(checked) => setValue("saveAsBeneficiary", !!checked)}
                className="h-5 w-5"
              />
              <label htmlFor="save-beneficiary" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Save as beneficiary
              </label>
              <span className="text-xs text-blue-600 font-medium">Recommended</span>
            </div>

            {/* Continue Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#004A9F] hover:bg-[#003875] text-white py-3 rounded-full disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Continue"}
              </Button>
            </div>
            </div>
        </Form>
      ) : (
        // Saved Beneficiaries Tab
        <div className="px-4 py-6 pb-24">
          {savedBeneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <p className="text-gray-600 text-sm">No saved beneficiaries yet</p>
              <p className="text-gray-500 text-xs mt-1">Add a beneficiary to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedBeneficiaries.map((beneficiary) => (
                <Button
                  key={beneficiary.id}
                  variant="ghost"
                  className="w-full h-auto p-4 justify-start bg-white hover:bg-gray-50 border border-gray-200 rounded-lg"
                  onClick={() => handleSelectBeneficiary(beneficiary)}
                >
                  <div className="w-full text-left">
                    <div className="font-medium text-sm text-gray-900">{beneficiary.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{beneficiary.bank}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
