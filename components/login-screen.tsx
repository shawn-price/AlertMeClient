"use client"

import type React from "react"
import { RegistrationScreen } from "./registration-screen"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Sparkles, Shield } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { z } from "zod"
import { accountNumberSchema, pinSchema, getErrorMessage } from "@/lib/form-utils"
import { useValidatedForm } from "@/hooks/use-validated-form"
import Form, { FormError } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

interface LoginScreenProps {
  onLogin: () => void
}

const loginSchema = z.object({
  accountNumber: accountNumberSchema,
  pin: pinSchema,
})

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const userData = dataStore.getUserData()
  const methods = useValidatedForm(loginSchema, {
    defaultValues: { accountNumber: userData.accountNumber, pin: "1234" },
  })

  const { getValues, trigger } = methods
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showRegistration, setShowRegistration] = useState(false)
  const { toast } = useToast()

  const handleLogin = async () => {
    setError("")
    const ok = await trigger()
    if (!ok) return

    setIsLoading(true)
    try {
      const values = getValues()
      const userData = dataStore.getUserData()

      const accountInput = values.accountNumber.trim()
      const pinInput = (values.pin || "").toString().trim()

      if (accountInput === userData.accountNumber && pinInput === "1234") {
        toast({ title: "Signed in", description: "Welcome back!" })
        // simulate network delay for demo
        setTimeout(() => {
          setIsLoading(false)
          onLogin()
        }, 800)
      } else {
        const msg = "Invalid account number or PIN"
        setError(msg)
        toast({ title: "Sign in failed", description: msg, variant: "destructive" })
        setIsLoading(false)
      }
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast({ title: "Sign in failed", description: msg, variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    methods.setValue("pin", value)
  }

  if (showRegistration) {
    return <RegistrationScreen onRegister={onLogin} onBackToLogin={() => setShowRegistration(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004A9F] via-[#0072C6] to-[#00B2A9] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-md animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-white/5 rounded-full blur-lg animate-bounce delay-500"></div>

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
        </div>

        <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
          <CardContent className="p-8 space-y-6 relative">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In</h2>
              <p className="text-gray-600 text-sm">Enter your account number and PIN</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Form methods={methods} onSubmit={handleLogin}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Account Number</label>
                  <Input
                    type="text"
                    placeholder="Enter account number"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    {...methods.register("accountNumber")}
                    className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-[#004A9F] focus:ring-0 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-300"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0,10)
                      methods.setValue("accountNumber", val)
                      setError("")
                    }}
                  />
                  <FormError name="accountNumber" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">4-Digit PIN</label>
                  <div className="relative">
                    <Input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter PIN"
                      {...methods.register("pin")}
                      onChange={handlePinChange}
                      maxLength={4}
                      className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-[#004A9F] focus:ring-0 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-300 pr-12"
                    />
                    <FormError name="pin" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700 rounded-lg"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Default PIN for demo: 1234</p>
                </div>
              </div>
            </Form>

            <Button
              onClick={methods.handleSubmit(handleLogin)}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#A4D233] to-[#8BC220] hover:from-[#8BC220] hover:to-[#7AB01F] text-black font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center space-y-4">
              <Button
                variant="link"
                className="text-[#004A9F] text-sm font-semibold hover:text-[#003875] transition-colors"
              >
                Forgot PIN?
              </Button>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => setShowRegistration(true)}
                  className="text-[#004A9F] text-xs p-0 font-semibold hover:text-[#003875] transition-colors"
                >
                  Register
                </Button>
              </div>
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
