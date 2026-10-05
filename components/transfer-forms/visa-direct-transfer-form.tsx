"use client"

import { useState, useRef } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ChevronDown, CreditCard } from "@/components/ui/iconify-compat"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { nameSchema, amountSchema, getErrorMessage } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { SearchableSelect } from "@/components/ui/searchable-select"

/**
 * Visa Direct Transfer Form - for card-to-card transfers
 * CBN Compliance: Card validation, fraud detection, daily limits
 */

// Virtual card interface
interface VirtualCard {
  id: string
  name: string
  cardNumber: string
  expiryDate: string
  cvv: string
  balance: number
  isActive: boolean
  isLocked: boolean
  type: "visa" | "mastercard"
  color: string
}

const cardNumberSchema = z
  .string()
  .min(1, "Card number is required")
  .regex(/^\d{16}$/, "Card number must be exactly 16 digits")

const visaDirectTransferSchema = z.object({
  fromCard: z.string().min(1, "Please select a source card"),
  cardNumber: cardNumberSchema,
  cardHolderName: nameSchema,
  amount: amountSchema.refine((n) => n <= 500000, {
    message: "Daily Visa Direct limit is ₦500,000",
  }),
  remark: z.string().optional(),
  saveAsBeneficiary: z.boolean().default(true),
})

interface VisaDirectTransferFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

// Mock virtual cards for demonstration
const MOCK_CARDS: VirtualCard[] = [
  {
    id: "1",
    name: "Online Shopping Card",
    cardNumber: "4532123456789012",
    expiryDate: "12/26",
    cvv: "123",
    balance: 25000,
    isActive: true,
    isLocked: false,
    type: "visa",
    color: "from-primary to-primary/70",
  },
  {
    id: "2",
    name: "Subscription Card",
    cardNumber: "5555444433332222",
    expiryDate: "08/25",
    cvv: "456",
    balance: 5000,
    isActive: true,
    isLocked: false,
    type: "mastercard",
    color: "from-purple-500 to-purple-700",
  },
  {
    id: "3",
    name: "Travel Card",
    cardNumber: "4111111111111111",
    expiryDate: "06/27",
    cvv: "789",
    balance: 100000,
    isActive: true,
    isLocked: false,
    type: "visa",
    color: "from-success to-success/70",
  },
]

export function VisaDirectTransferForm({ onSubmit, isLoading = false }: VisaDirectTransferFormProps) {
  const [formError, setFormError] = useState("")
  const { toast } = useToast()
  const amountInputRef = useRef<HTMLInputElement>(null)
  
  // In a real app, this would come from the data store
  const [availableCards] = useState<VirtualCard[]>(MOCK_CARDS)

  const methods = useValidatedForm(visaDirectTransferSchema, {
    defaultValues: {
      fromCard: "",
      cardNumber: "",
      cardHolderName: "",
      amount: "" as any,
      remark: "",
      saveAsBeneficiary: true,
    },
  })

  const { watch, setValue, handleSubmit, formState, clearErrors } = methods
  const { isSubmitting } = formState

  const cardNumber = watch("cardNumber")
  const selectedCardId = watch("fromCard")
  const selectedCard = availableCards.find((c) => c.id === selectedCardId)

  // Validate card expiry
  const isCardExpired = (expiryDate: string) => {
    const [month, year] = expiryDate.split("/")
    if (!month || !year) return false
    
    const expiry = new Date(parseInt("20" + year), parseInt(month) - 1)
    return expiry < new Date()
  }

  const onCardNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16)
    setValue("cardNumber", digitsOnly)
    if ((formState.errors as any).cardNumber) clearErrors("cardNumber")
  }

  const formatCardDisplay = (number: string) => {
    if (number.length < 4) return number
    return number.slice(0, 4) + " **** **** " + number.slice(-4)
  }

  const onContinue = handleSubmit(async (values) => {
    setFormError("")
    try {
      const userData = dataStore.getUserData()
      const visaDirectFee = 25 // Visa Direct transfers have ₦25 fee
      const totalAmount = values.amount + visaDirectFee
      
      // CRITICAL: Validate sufficient balance
      if (userData.balance < totalAmount) {
        setFormError(
          `Insufficient balance. You need ₦${totalAmount.toLocaleString()} (₦${values.amount.toLocaleString()} transfer + ₦${visaDirectFee} fee). ` +
          `Current balance: ₦${userData.balance.toLocaleString()}`
        )
        return
      }
      
      // Card expiry validation
      const targetCard = availableCards.find(c => c.cardNumber.replace(/\s/g, "") === values.cardNumber)
      if (targetCard && isCardExpired(targetCard.expiryDate)) {
        setFormError("Card has expired")
        return
      }

      // Daily Visa Direct limit
      const dailyTransactions = dataStore.getTransactions().filter((t) => {
        const txDate = new Date(t.date).toDateString()
        const today = new Date().toDateString()
        return txDate === today && t.isDebit && t.type.includes("Visa Direct")
      })
      
      const dailyTotal = dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      if (dailyTotal + values.amount > 500000) {
        setFormError(`Daily Visa Direct limit is ₦500,000. Today's usage: ₦${dailyTotal.toLocaleString()}`)
        return
      }

      // Luhn algorithm check
      if (!validateCardNumber(values.cardNumber)) {
        setFormError("Invalid card number")
        return
      }

      const cardDisplay = formatCardDisplay(values.cardNumber)
      
      if (values.saveAsBeneficiary) {
        dataStore.addBeneficiary({
          accountNumber: values.cardNumber,
          bank: "Visa Direct",
          name: values.cardHolderName.trim(),
          phone: `${values.cardNumber.slice(-4)}`,
        })
      }

      onSubmit({
        fromCard: values.fromCard,
        fromCardName: selectedCard?.name || "",
        cardNumber: values.cardNumber,
        cardHolderName: values.cardHolderName.trim(),
        amount: values.amount,
        remark: values.remark,
        transferType: "visa-direct",
        fee: 25, // Visa Direct transfer fee
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

        {/* From Card Selection with search */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">From Card *</label>
          <SearchableSelect
            options={availableCards
              .filter(card => card.isActive && !card.isLocked)
              .map((card) => ({
                value: card.id,
                label: `${card.name} - ₦${formatCurrency(card.balance)}`,
              }))}
            value={watch("fromCard")}
            onValueChange={(value) => {
              setValue("fromCard", value)
              ;(formState.errors as any).fromCard && clearErrors("fromCard")
            }}
            placeholder="Type or select card"
            searchPlaceholder="Search cards..."
            className={"bg-card " + ((formState.errors as any).fromCard ? "border-destructive" : "")}
          />
          {selectedCard && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-5 bg-gradient-to-r ${selectedCard.color} rounded flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{selectedCard.type.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{selectedCard.name}</div>
                    <div className="text-xs text-muted-foreground">{formatCardDisplay(selectedCard.cardNumber)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">₦{formatCurrency(selectedCard.balance)}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
            </div>
          )}
          <FormError name="fromCard" />
        </div>

        {/* Recipient Card Number */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Recipient Card Number (16 digits) *</label>
          <div className="relative">
            <Input
              placeholder="e.g., 4532123456789010"
              value={cardNumber}
              onChange={(e) => onCardNumberChange(e.target.value)}
              inputMode="numeric"
              maxLength={16}
              className="bg-card pr-10"
            />
            {cardNumber.length === 16 && (
              <div className="absolute right-3 top-3">
                <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            )}
          </div>
          <FormError name="cardNumber" />
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Cardholder Name *</label>
          <Input
            placeholder="Enter name on card"
            {...methods.register("cardHolderName")}
            className="bg-card uppercase"
          />
          <FormError name="cardHolderName" />
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Amount (Max: ₦500,000) *</label>
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

        {/* Save Card */}
        <div className="flex items-center space-x-3 bg-primary/5 p-3 rounded-lg border border-primary/20">
          <Checkbox
            id="save-beneficiary"
            checked={watch("saveAsBeneficiary")}
            onCheckedChange={(checked) => setValue("saveAsBeneficiary", !!checked)}
            className="h-5 w-5"
          />
          <label htmlFor="save-beneficiary" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            Save card for future transfers
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

/**
 * Luhn Algorithm - validates credit card numbers
 */
function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "")
  if (digits.length !== 16) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}
