"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Sparkles, Shield, ChevronRight } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { z } from "zod"
import { emailSchema, nameSchema, accountNumberSchema, phoneSchema, pinSchema, getErrorMessage } from "@/lib/form-utils"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

interface RegistrationScreenProps {
  onRegister: () => void
  onBackToLogin: () => void
}

const registrationSchema = z
  .object({
    email: emailSchema,
    fullName: nameSchema,
    accountNumber: accountNumberSchema,
    phone: phoneSchema,
    pin: pinSchema,
    confirmPin: z.string(),
  })
  .refine((v) => v.pin === v.confirmPin, { message: "PINs do not match", path: ["confirmPin"] })

export function RegistrationScreen({ onRegister, onBackToLogin }: RegistrationScreenProps) {
  const [step, setStep] = useState<"email" | "details" | "pin">("email")
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const methods = useValidatedForm(registrationSchema, {
    defaultValues: {
      email: "",
      fullName: "",
      accountNumber: "",
      phone: "",
      pin: "",
      confirmPin: "",
    },
  })

  const { getValues, trigger, setValue } = methods

  const handleEmailSubmit = async () => {
    const ok = await trigger("email")
    if (ok) setStep("details")
  }

  const handleDetailsSubmit = async () => {
    const ok = await trigger(["fullName", "accountNumber", "phone"])
    if (ok) setStep("pin")
  }

  const handleRegister = async () => {
    setError("")
    const ok = await trigger()
    if (!ok) return

    setIsLoading(true)
    try {
      const values = getValues()
      // sanitize inputs
      const payload = {
        name: values.fullName.trim(),
        accountNumber: values.accountNumber.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        pin: values.pin,
      }
      dataStore.registerNewAccount(payload)
      toast({ title: "Account created", description: "Your account was created successfully." })
      onRegister()
    } catch (err) {
      console.error("Registration failed", err)
      const msg = getErrorMessage(err)
      setError(msg)
      toast({ title: "Registration failed", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, field: "pin" | "confirmPin") => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    setValue(field, value)
  }

  const handleInputChange = (name: string, value: string) => {
    setValue(name as any, value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[#0072C6] to-[#00B2A9] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="text-white text-4xl font-bold mb-3 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
              Ecobank
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <div className="text-white/90 text-base font-medium mb-2">The Pan African Bank</div>
          <div className="text-white/70 text-sm flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Create Your Account
          </div>
        </div>

        <Card className="bg-card/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
          <CardContent className="p-8 space-y-6 relative">
            <div className="flex gap-2 mb-6">
              {["email", "details", "pin"].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    (step === "email" && s === "email") ||
                    (step === "details" && (s === "email" || s === "details")) ||
                    (step === "pin" && ["email", "details", "pin"].includes(s))
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                ></div>
              ))}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {step === "email" && (
              <Form methods={methods} onSubmit={() => {}}>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Create Account</h2>
                  <p className="text-muted-foreground text-sm">Step 1 of 3: Email Address</p>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    {...methods.register("email")}
                    className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200"
                  />
                  <FormError name="email" />
                  <Button
                    type="button"
                    onClick={handleEmailSubmit}
                    className="w-full h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Form>
            )}

            {step === "details" && (
              <Form methods={methods} onSubmit={() => {}}>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Create Account</h2>
                  <p className="text-muted-foreground text-sm">Step 2 of 3: Account Details</p>
                  <Input
                    type="text"
                    placeholder="Enter full name"
                    {...methods.register("fullName")}
                    className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200"
                  />
                  <FormError name="fullName" />
                  <Input
                    type="text"
                    placeholder="Enter account number (10 digits)"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    {...methods.register("accountNumber")}
                    className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200"
                    onChange={(e) => methods.setValue("accountNumber", e.target.value.replace(/\D/g, "").slice(0,10))}
                  />
                  <FormError name="accountNumber" />
                  <Input
                    type="tel"
                    placeholder="+2348012345678"
                    inputMode="tel"
                    maxLength={14}
                    pattern="\+\d{13}"
                    {...methods.register("phone")}
                    className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200"
                    onChange={(e) => {
                      let val = e.target.value
                      if (!val.startsWith("+")) {
                        val = "+" + val.replace(/\D/g, "")
                      } else {
                        val = "+" + val.slice(1).replace(/\D/g, "")
                      }
                      methods.setValue("phone", val.slice(0,14))
                    }}
                  />
                  <FormError name="phone" />
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setStep("email")}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-2 border-border hover:border-primary/40"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDetailsSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            {step === "pin" && (
              <Form methods={methods} onSubmit={handleRegister}>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Create Account</h2>
                  <p className="text-muted-foreground text-sm">Step 3 of 3: Set Your PIN</p>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block">Create 4-Digit PIN</label>
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        placeholder="Enter PIN"
                        {...methods.register("pin")}
                        maxLength={4}
                        className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200 pr-12"
                        onChange={(e) => handlePinChange(e as any, "pin")}
                      />
                      <FormError name="pin" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block">Confirm PIN</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPin ? "text" : "password"}
                        placeholder="Confirm PIN"
                        {...methods.register("confirmPin")}
                        maxLength={4}
                        className="w-full h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-card/80 backdrop-blur-sm transition-all duration-200 pr-12"
                        onChange={(e) => handlePinChange(e as any, "confirmPin")}
                      />
                      <FormError name="confirmPin" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                      >
                        {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setStep("details")}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-2 border-border hover:border-primary/40"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            <div className="text-center pt-4 border-t border-border">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Button
                  variant="link"
                  onClick={onBackToLogin}
                  className="text-primary text-sm p-0 font-semibold hover:text-primary/80"
                >
                  Sign In
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-white/70 text-xs space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            <span>Secured by 256-bit SSL encryption</span>
          </div>
          <div>© 2025 Ecobank. All rights reserved.</div>
        </div>
      </div>
    </div>
  )
}
