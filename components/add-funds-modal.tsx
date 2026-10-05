"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/form-utils"
import { dataStore } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

interface AddFundsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddFundsModal({ isOpen, onClose }: AddFundsModalProps) {
  const [amount, setAmount] = useState("")
  const [account, setAccount] = useState("")
  const [currentBalance, setCurrentBalance] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Update currentBalance whenever modal opens or dataStore changes
    if (isOpen) {
      setCurrentBalance(dataStore.getUserData().balance)
    }
  }, [isOpen])

  const handleAddFunds = async () => {
    const addAmount = Number(Number.parseFloat(amount).toFixed(2))
    if (addAmount > 0) {
      try {
        setIsProcessing(true)

        // Add transaction record (this automatically updates balance)
        await dataStore.addTransaction({
          type: "Account Funding",
          amount: addAmount,
          sender: "Fund Addition",
          status: "Successful",
          description: `Funds added to account`,
          isDebit: false,
          section: "Today",
          senderBank: "Internal",
        })

        // Get updated balance after transaction
        const updatedBalance = dataStore.getUserData().balance

        // Update local state with balance from dataStore
        setCurrentBalance(updatedBalance)
        
        toast({
          title: "Funds Added Successfully",
          description: `₦${formatCurrency(addAmount)} has been added to your account`,
        })

        setAmount("")
        setAccount("")
        setIsProcessing(false)
        onClose()
      } catch (error) {
        setIsProcessing(false)
        toast({
          title: "Error",
          description: "Failed to add funds. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card">
        <DialogHeader className="bg-gradient-to-r from-muted/50 to-card -m-6 mb-4 p-6 rounded-t-2xl border-b border-border/50">
          <DialogTitle className="text-base font-semibold">Add Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="bg-primary text-white p-4 rounded-lg text-center">
            <div className="text-sm opacity-80">Current Balance</div>
            <div className="text-2xl font-bold">₦ {formatCurrency(currentBalance)}</div>
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose account to credit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings Account - 0099348976</SelectItem>
                <SelectItem value="current">Current Account - 0099348977</SelectItem>
                <SelectItem value="domiciliary">Domiciliary Account - 0099348978</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Add</Label>
            <Input
              id="amount"
              inputMode="numeric"
              step="0.01"
              placeholder="Enter amount (e.g. 1000.00)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              onBlur={() => {
                if (!amount) return
                const n = Number(amount)
                setAmount(Number(n.toFixed(2)).toFixed(2))
              }}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[1000, 5000, 10000].map((quickAmount) => (
              <Button key={quickAmount} variant="outline" size="sm" onClick={() => setAmount(quickAmount.toFixed(2))}>
                ₦{formatCurrency(quickAmount)}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleAddFunds}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={!amount || !account || isProcessing}
            >
              {isProcessing ? "Processing..." : "Add Funds"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
