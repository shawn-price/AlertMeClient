"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ChevronDown, Mail, MessageSquare } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { nameSchema, amountSchema, getErrorMessage, emailSchema } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store"
import { generateToken } from "@/lib/utils"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * Generate a random token for claim links
 */

const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?234\d{10}$|^0\d{10}$/, "Phone number must be valid Nigerian number (e.g., 08012345678 or +2348012345678)")

const emailSmsTransferSchema = z.object({
  transferMethod: z.enum(["email", "sms"]),
  recipientEmail: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientName: nameSchema,
  amount: amountSchema.refine((n) => n <= 100000, {
    message: "Daily limit is ₦100,000 for Email/SMS transfers",
  }),
  remark: z.string().optional(),
  expiryDays: z.number().min(1).max(30).default(7),
}).refine((data) => {
  if (data.transferMethod === "email" && !data.recipientEmail) {
    return false
  }
  if (data.transferMethod === "sms" && !data.recipientPhone) {
    return false
  }
  return true
}, {
  message: "Recipient contact is required",
  path: ["recipientEmail", "recipientPhone"],
})

interface EmailSmsTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function EmailSmsTransferForm({ onSubmit, isLoading = false }: EmailSmsTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const userData = dataStore.getUserData()
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const methods = useValidatedForm(emailSmsTransferSchema, {
    defaultValues: {
      transferMethod: "sms",
      recipientEmail: "",
      recipientPhone: "",
      recipientName: "",
      amount: "" as any,
      remark: "",
      expiryDays: 7,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const transferMethod = watch("transferMethod")

  // Normalize phone number to +234 format
  const normalizePhone = (phone: string): string => {
    if (phone.startsWith("0")) {
      return "+234" + phone.slice(1)
    }
    if (!phone.startsWith("+234")) {
      return "+234" + phone
    }
    return phone
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    setGeneratedLink(null)
    
    try {
      const emailSmsFee = 10 // Email/SMS transfer fee
      const totalAmount = values.amount + emailSmsFee
      
      // CRITICAL: Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${emailSmsFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Validate daily transfer limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && t.type.includes("Email") || t.type.includes("SMS")
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 100000) {
        setFormError(`Daily limit exceeded. Today's usage: ₦${dailyTotal.toLocaleString()}`)
        return
      }

      // Generate unique claim token
      const claimToken = generateToken(8)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + values.expiryDays)

      const payload = {
        transferMethod: values.transferMethod,
        recipientEmail: values.recipientEmail?.toLowerCase().trim(),
        recipientPhone: values.recipientPhone ? normalizePhone(values.recipientPhone) : "",
        recipientName: values.recipientName.trim(),
        amount: values.amount,
        remark: values.remark,
        claimToken,
        expiryDate: expiryDate.toISOString(),
        transferType: values.transferMethod === "email" ? "email-transfer" : "sms-transfer",
      }

      // In a real app, this would send the notification
      if (values.transferMethod === "email") {
        console.log("Sending email to:", values.recipientEmail)
      } else {
        console.log("Sending SMS to:", values.recipientPhone ? normalizePhone(values.recipientPhone) : "")
      }

      onSubmit({ ...payload, fee: 10 }) // Email/SMS transfer fee
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

        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary">Transfer via Email or SMS</h4>
              <p className="text-xs text-primary mt-1">
                Send money to anyone, even without a bank account. The recipient will receive a link to claim funds.
              </p>
            </div>
          </div>
        </div>

        {/* Source Account */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">From Account</label>
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Ecobank Account</div>
                <div className="text-xs text-muted-foreground">{userData.accountNumber}</div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Transfer Method */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Transfer Method *</label>
          <Select 
            value={watch("transferMethod")} 
            onValueChange={(value) => { 
              setValue("transferMethod", value as "email" | "sms"); 
              clearErrors(["recipientEmail", "recipientPhone"])
            }}
          >
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS (Phone Number)</span>
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Contact - Phone or Email based on method */}
        {transferMethod === "sms" ? (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Recipient Phone Number *</label>
            <Input
              placeholder="e.g., 08012345678 or +2348012345678"
              {...methods.register("recipientPhone")}
              className="bg-card"
              type="tel"
            />
            <FormError name="recipientPhone" />
            <div className="text-xs text-muted-foreground mt-1">Must be valid Nigerian mobile number</div>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Recipient Email Address *</label>
            <Input
              placeholder="e.g., recipient@email.com"
              {...methods.register("recipientEmail")}
              className="bg-card"
              type="email"
            />
            <FormError name="recipientEmail" />
          </div>
        )}

        {/* Recipient Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Recipient Name *</label>
          <Input
            placeholder="Enter recipient's full name"
            {...methods.register("recipientName")}
            className="bg-card"
          />
          <FormError name="recipientName" />
          <div className="text-xs text-muted-foreground mt-1">Name that will be shown to recipient</div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Amount (Max: ₦100,000) *</label>
          {(() => {
            const { ref: registerRef, ...amountRegister } = methods.register("amount")
            return (
              <Input
                placeholder="Enter amount (e.g. 5000.00)"
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

        {/* Expiry Period */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Claim Link Expiry</label>
          <SearchableSelect
            options={[
              { value: "1", label: "1 day" },
              { value: "3", label: "3 days" },
              { value: "7", label: "7 days (default)" },
              { value: "14", label: "14 days" },
              { value: "30", label: "30 days" },
            ]}
            value={watch("expiryDays").toString()}
            onValueChange={(value) => setValue("expiryDays", parseInt(value))}
            placeholder="Select expiry"
            searchPlaceholder="Search days..."
            className="bg-card"
          />
          <div className="text-xs text-muted-foreground mt-1">Recipient can claim within this period</div>
        </div>

        {/* Remark (optional) */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Message to Recipient (Optional)</label>
          <Input
            placeholder="Enter a personal message"
            {...methods.register("remark")}
            className="bg-card"
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1">Max 100 characters</div>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Processing..." : "Send Transfer"}
          </Button>
        </div>
      </div>
    </Form>
  )
}
