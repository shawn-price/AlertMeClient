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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ backgroundImage: "url('/ecobank-background.jpg')" }}>
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 backdrop-blur-sm"></div>

      {/* Animated Background Accents */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-processing-float"></div>
      <div className="absolute bottom-32 right-8 w-24 h-24 bg-white/5 rounded-full blur-3xl animate-processing-float" style={{ animationDelay: "0.5s" }}></div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <div className="text-white text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-lg">
              AlertMe
            </div>
            <div className="absolute -top-3 -right-3">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-processing-spin drop-shadow-lg" />
            </div>
          </div>
          <div className="text-white/95 text-sm font-semibold tracking-wide">Powered by Ecobank | The Pan African Bank</div>
          <div className="text-white/70 text-sm flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Welcome to Ecobank Mobile!
          </div>
        </div>

        <Card className="bg-white/98 backdrop-blur-lg shadow-2xl border border-white/60 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>
          <CardContent className="p-8 space-y-6 relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">Sign In</h2>
              <p className="text-gray-600 text-sm leading-relaxed">Enter your account number and PIN to access AlertMe</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Form methods={methods} onSubmit={handleLogin}>
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 mb-2 block">Account Number</label>
                  <Input
                    type="text"
                    placeholder="Enter account number"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    {...methods.register("accountNumber")}
                    className="w-full h-13 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all duration-300 hover:border-gray-300 placeholder:text-gray-400 font-medium"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0,10)
                      methods.setValue("accountNumber", val)
                      setError("")
                    }}
                  />
                  <FormError name="accountNumber" />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 mb-2 block">4-Digit PIN</label>
                  <div className="relative">
                    <Input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter PIN"
                      {...methods.register("pin")}
                      onChange={handlePinChange}
                      maxLength={4}
                      className="w-full h-13 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all duration-300 hover:border-gray-300 pr-12 placeholder:text-gray-400 font-medium tracking-widest"
                    />
                    <FormError name="pin" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-lg transition-colors"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Demo: Account 1234567890 | PIN 1234</p>
                </div>
              </div>
            </Form>

            <Button
              onClick={methods.handleSubmit(handleLogin)}
              disabled={isLoading}
              className="w-full h-13 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <span className="text-base font-semibold">Sign In to AlertMe</span>
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
