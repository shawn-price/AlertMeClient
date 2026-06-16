"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Mail,
  MessageSquare,
  Share,
  Copy,
  X,
} from "@/components/ui/iconify-compat"
import { shareReceipt, ReceiptShareData, isShareMethodAvailable } from "@/lib/share-receipt"
import { useToast } from "@/hooks/use-toast"

interface ShareReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptData: ReceiptShareData
}

export function ShareReceiptDialog({ open, onOpenChange, receiptData }: ShareReceiptDialogProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const shareOptions = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500",
      description: "Share via WhatsApp",
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "bg-blue-500",
      description: "Share via Email",
    },
    {
      id: "sms",
      name: "SMS",
      icon: MessageSquare,
      color: "bg-purple-500",
      description: "Share via SMS",
    },
    {
      id: "native",
      name: "More Options",
      icon: Share,
      color: "bg-gray-500",
      description: "Share using device options",
    },
  ]

  const handleShare = async (method: string) => {
    try {
      setIsSharing(true)

      if (method === "whatsapp") {
        shareReceipt(receiptData, "whatsapp")
        toast({
          title: "WhatsApp",
          description: "Opening WhatsApp to share receipt...",
        })
      } else if (method === "email") {
        shareReceipt(receiptData, "email")
        toast({
          title: "Email",
          description: "Opening email client to share receipt...",
        })
      } else if (method === "sms") {
        shareReceipt(receiptData, "sms")
        toast({
          title: "SMS",
          description: "Opening messaging app to share receipt...",
        })
      } else if (method === "native") {
        try {
          await shareReceipt(receiptData, "native")
          toast({
            title: "Shared",
            description: "Receipt shared successfully",
          })
        } catch (error: any) {
          toast({
            title: "Error",
            description: "Native sharing not supported on this device",
            variant: "destructive",
          })
        }
      }

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyReceipt = async () => {
    try {
      const receiptText = `
Receipt: ${receiptData.receiptNumber}
To: ${receiptData.recipientName} (${receiptData.recipientAccount})
Amount: ₦${receiptData.amount}
Status: ${receiptData.status}
      `.trim()

      await navigator.clipboard.writeText(receiptText)
      toast({
        title: "Copied",
        description: "Receipt details copied to clipboard",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy receipt",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-[#004A9F] to-[#003875] text-white p-6 -m-6 mb-0 rounded-t-2xl">
          <DialogTitle className="text-base font-semibold text-white">Share Receipt</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Receipt Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-600 mb-2">RECEIPT SUMMARY</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">To:</span>
                <span className="font-medium">{receiptData.recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-[#004A9F]">
                  ₦{receiptData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-xs">{receiptData.receiptNumber}</span>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Choose sharing method
            </div>

            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon as any
                const isAvailable = isShareMethodAvailable(option.id)

                return (
                  <Button
                    key={option.id}
                    onClick={() => handleShare(option.id)}
                    disabled={isSharing || !isAvailable}
                    variant="outline"
                    className="h-auto flex flex-col items-center justify-center py-4 gap-2 border border-gray-200 hover:border-[#004A9F] hover:bg-blue-50 disabled:opacity-50"
                  >
                    <div
                      className={`${option.color} p-2 rounded-full text-white`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-medium text-center">
                      {option.name}
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="border-t pt-4 space-y-2">
            <Button
              onClick={handleCopyReceipt}
              variant="outline"
              className="w-full justify-center"
              disabled={isSharing}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Receipt Details
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Tap any option above to share your receipt via that platform.
              Choose "More Options" for additional sharing methods available on your device.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
