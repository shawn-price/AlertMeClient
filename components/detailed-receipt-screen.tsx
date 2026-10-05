"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Share2, Copy, Check } from "@/components/ui/iconify-compat"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { useToast } from "@/hooks/use-toast"
import { ShareReceiptDialog } from "./share-receipt-dialog"
import { ReceiptShareData } from "@/lib/share-receipt"

interface DetailedReceiptScreenProps {
  onBack: () => void
  transferData: any
}

export function DetailedReceiptScreen({ onBack, transferData }: DetailedReceiptScreenProps) {
  const [receiptData, setReceiptData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareData, setShareData] = useState<ReceiptShareData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Generate detailed receipt data
    const userData = dataStore.getUserData()
    const currentDate = new Date()
    const receiptNumber = `RCP${Date.now()}`
    
    // Use fee from transfer data, or default to 30
    const transactionFee = transferData?.fee || 30.0
    const amount = Number.parseFloat(transferData?.amount || "0")
    const total = amount + transactionFee

    const receiptInfo = {
      receiptNumber,
      transactionRef: `TXN${Date.now()}`,
      date: currentDate.toLocaleDateString(),
      time: currentDate.toLocaleTimeString(),
      amount,
      fee: transactionFee,
      total,
      sender: {
        name: userData.name,
        account: userData.accountNumber,
        bank: "Ecobank Nigeria",
      },
      recipient: {
        name: transferData?.beneficiaryName,
        account: transferData?.accountNumber,
        bank: transferData?.bank,
      },
      remark: transferData?.remark || "Transfer",
      status: "Successful",
      channel: "Ecobank Mobile App",
    }

    setReceiptData(receiptInfo)

    // Set share data for the share dialog
    setShareData({
      receiptNumber,
      transactionRef: `TXN${Date.now()}`,
      date: currentDate.toLocaleDateString(),
      time: currentDate.toLocaleTimeString(),
      amount,
      fee: transactionFee,
      total,
      senderName: userData.name,
      senderAccount: userData.accountNumber,
      senderBank: "Ecobank Nigeria",
      recipientName: transferData?.beneficiaryName || "Unknown",
      recipientAccount: transferData?.accountNumber || "N/A",
      recipientBank: transferData?.bank || "N/A",
      remark: transferData?.remark || "Transfer",
      status: "Successful",
    })
  }, [transferData])

  const handleDownload = () => {
    // Simulate download
    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been saved to your downloads",
    })
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const copyReceiptNumber = () => {
    if (receiptData) {
      navigator.clipboard.writeText(receiptData.receiptNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied",
        description: "Receipt number copied to clipboard",
      })
    }
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Generating receipt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Transaction Receipt</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Receipt Card */}
        <Card className="bg-card shadow-lg">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b border-dashed">
              <div className="text-2xl font-bold text-primary mb-2">Ecobank Nigeria</div>
              <div className="text-sm text-muted-foreground">The Pan African Bank</div>
              <div className="text-xs text-muted-foreground mt-2">TRANSACTION RECEIPT</div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receipt No:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{receiptData.receiptNumber}</span>
                  <Button variant="ghost" size="sm" onClick={copyReceiptNumber}>
                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Transaction Ref:</span>
                <span className="font-mono text-sm">{receiptData.transactionRef}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date & Time:</span>
                <span className="text-sm">
                  {receiptData.date} {receiptData.time}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Channel:</span>
                <span className="text-sm">{receiptData.channel}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm text-success font-medium">{receiptData.status}</span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="border-t border-dashed pt-4 mb-6">
              <h3 className="font-semibold mb-4 text-center">TRANSACTION DETAILS</h3>

              <div className="space-y-4">
                {/* Sender Details */}
                <div className="bg-primary/5 rounded p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">FROM (SENDER)</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{receiptData.sender.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono text-xs">{receiptData.sender.account}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{receiptData.sender.bank}</span>
                    </div>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="bg-success/10 rounded p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">TO (RECIPIENT)</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{receiptData.recipient.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono text-xs">{receiptData.recipient.account || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{receiptData.recipient.bank || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Purpose */}
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">TRANSACTION PURPOSE</div>
                  <div className="text-sm bg-muted/50 p-2 rounded">{receiptData.remark}</div>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="border-t border-dashed pt-4 mb-6">
              <h3 className="font-semibold mb-4 text-center">AMOUNT BREAKDOWN</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Transfer Amount:</span>
                  <span className="text-sm">₦{formatCurrency(receiptData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Transaction Fee:</span>
                  <span className="text-sm">₦{receiptData.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total Debited:</span>
                  <span>₦{formatCurrency(receiptData.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-dashed pt-4 text-center">
              <div className="text-xs text-muted-foreground mb-2">
                This is a computer generated receipt and does not require signature
              </div>
              <div className="text-xs text-muted-foreground">
                Generated on {receiptData.date} at {receiptData.time}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                For enquiries, call 0700-ECOBANK or visit www.ecobank.com
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Button onClick={handleDownload} className="w-full bg-primary hover:bg-primary/90 text-white py-3">
            <Download className="h-4 w-4 mr-2" />
            Download PDF Receipt
          </Button>

          <Button onClick={handleShare} variant="outline" className="w-full py-3 bg-transparent">
            <Share2 className="h-4 w-4 mr-2" />
            Share Receipt
          </Button>
        </div>
      </div>

      {/* Share Receipt Dialog */}
      {shareData && (
        <ShareReceiptDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          receiptData={shareData}
        />
      )}
    </div>
  )
}
