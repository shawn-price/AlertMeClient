"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, MessageSquare, Send } from "@/components/ui/iconify-compat"
import { NIGERIAN_BANKS } from "@/lib/banks-data"
import { dataStore } from "@/lib/data-store"

interface ShareDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  recipientPhone?: string
}

export function ShareDetailsModal({ isOpen, onClose, recipientPhone }: ShareDetailsModalProps) {
  const [selectedBank, setSelectedBank] = useState<string>("Ecobank Nigeria")
  const [recipientPhoneInput, setRecipientPhoneInput] = useState<string>(recipientPhone || "")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const userData = dataStore.getUserData()
  console.log('ShareDetailsModal userData:', userData)
  console.log('ShareDetailsModal selectedBank:', selectedBank)

  const cardPreviewData = {
    bank: selectedBank,
    email: userData?.email || "",
    phone: userData?.phone || "",
  }
  console.log('ShareDetailsModal cardPreviewData:', cardPreviewData)

  const handleSendViaSMS = async () => {
    if (!recipientPhoneInput.trim()) {
      setError("Please enter a recipient phone number")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      console.log('ShareDetailsModal sending SMS with data:', {
        to: recipientPhoneInput,
        bank: selectedBank,
        email: userData?.email || "",
        phone: userData?.phone || "",
        mediaUrl: `${window.location.origin}/api/vcard?bank=${encodeURIComponent(selectedBank)}&email=${encodeURIComponent(userData?.email || "")}&phone=${encodeURIComponent(userData?.phone || "")}`,
      })

      const response = await fetch("/api/sms/business-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientPhoneInput,
          bank: selectedBank,
          email: userData?.email || "",
          phone: userData?.phone || "",
          mediaUrl: `${window.location.origin}/api/vcard?bank=${encodeURIComponent(selectedBank)}&email=${encodeURIComponent(userData?.email || "")}&phone=${encodeURIComponent(userData?.phone || "")}`,
        }),
      })

      console.log('ShareDetailsModal SMS response status:', response.status)
      console.log('ShareDetailsModal SMS response:', response)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send business card")
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setRecipientPhoneInput("")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send business card")
    } finally {
      setIsSending(false)
    }
  }

  const handleShare = (platform: string) => {
    if (platform === "sms") {
      // SMS will be handled by the new logic
      return
    }

    const shareText = `Bank: ${selectedBank}\nEmail: ${userData?.email || ""}\nPhone: ${userData?.phone || ""}`
    const encodedText = encodeURIComponent(shareText)

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodedText}`, "_blank")
        break
      case "telegram":
        window.open(`https://t.me/share/url?text=${encodedText}`, "_blank")
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card">
        <DialogHeader className="bg-gradient-to-r from-muted/50 to-card -m-6 mb-4 p-6 rounded-t-2xl border-b border-border/50">
          <DialogTitle className="text-center text-base font-semibold">Send Business Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Bank:</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Recipient Phone:</label>
            <input
              type="tel"
              value={recipientPhoneInput}
              onChange={(e) => setRecipientPhoneInput(e.target.value)}
              placeholder="+234 801 234 5678 or 0801234567"
              className="w-full px-3 py-2 border border-input bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Business Card Preview */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl font-bold">📇</span>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-lg text-foreground">{cardPreviewData.bank}</div>
                  <div className="text-sm text-muted-foreground">
                    <div>📧 {cardPreviewData.email}</div>
                    <div>📱 {cardPreviewData.phone}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">{error}</div>}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-success/10 border border-success/30 text-success rounded-lg text-sm">
              Business card sent successfully!
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground text-center">Choose sharing method:</div>

            <Button
              onClick={() => handleShare("whatsapp")}
              className="w-full bg-success hover:bg-success/90 text-white flex items-center gap-3"
              disabled={isSending}
            >
              <MessageCircle className="h-5 w-5" />
              Share via WhatsApp
            </Button>

            <Button
              onClick={handleSendViaSMS}
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center gap-3 disabled:opacity-50"
              disabled={isSending || !recipientPhoneInput.trim()}
            >
              <MessageSquare className="h-5 w-5" />
              {isSending ? "Sending..." : "Send Business Card via SMS"}
            </Button>

            <Button
              onClick={() => handleShare("telegram")}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-3"
              disabled={isSending}
            >
              <Send className="h-5 w-5" />
              Share via Telegram
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
