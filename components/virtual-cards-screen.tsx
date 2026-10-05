"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Plus, Eye, EyeOff, Copy, Settings, Trash2, Lock, Unlock, Home } from "@/components/ui/iconify-compat"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/form-utils"

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

interface VirtualCardsScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function VirtualCardsScreen({ onBack, onNavigate }: VirtualCardsScreenProps) {
  const [cards, setCards] = useState<VirtualCard[]>([
    {
      id: "1",
      name: "Online Shopping Card",
      cardNumber: "4532 1234 5678 9012",
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
      cardNumber: "5555 4444 3333 2222",
      expiryDate: "08/25",
      cvv: "456",
      balance: 5000,
      isActive: true,
      isLocked: true,
      type: "mastercard",
      color: "from-purple-500 to-purple-700",
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null)
  const [showCardDetails, setShowCardDetails] = useState<string | null>(null)
  const [newCardName, setNewCardName] = useState("")
  const [newCardBalance, setNewCardBalance] = useState("")
  const { toast } = useToast()

  const handleCreateCard = () => {
    if (!newCardName || !newCardBalance) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newCard: VirtualCard = {
      id: Date.now().toString(),
      name: newCardName,
      cardNumber: `4532 ${Math.random().toString().slice(2, 6)} ${Math.random().toString().slice(2, 6)} ${Math.random().toString().slice(2, 6)}`,
      expiryDate: "12/28",
      cvv: Math.random().toString().slice(2, 5),
      balance: Number.parseFloat(newCardBalance),
      isActive: true,
      isLocked: false,
      type: Math.random() > 0.5 ? "visa" : "mastercard",
      color: `from-${["green", "red", "indigo", "pink", "yellow"][Math.floor(Math.random() * 5)]}-500 to-${["green", "red", "indigo", "pink", "yellow"][Math.floor(Math.random() * 5)]}-700`,
    }

    setCards([...cards, newCard])
    setNewCardName("")
    setNewCardBalance("")
    setShowCreateModal(false)

    toast({
      title: "Card Created",
      description: "Your virtual card has been created successfully",
    })
  }

  const toggleCardLock = (cardId: string) => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, isLocked: !card.isLocked } : card)))

    const card = cards.find((c) => c.id === cardId)
    toast({
      title: card?.isLocked ? "Card Unlocked" : "Card Locked",
      description: `Your card has been ${card?.isLocked ? "unlocked" : "locked"}`,
    })
  }

  const deleteCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId))
    toast({
      title: "Card Deleted",
      description: "Your virtual card has been deleted",
    })
  }

  const copyCardNumber = (cardNumber: string) => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ""))
    toast({
      title: "Copied",
      description: "Card number copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Virtual Cards</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-primary">{cards.length}</div>
              <div className="text-xs text-muted-foreground">Total Cards</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-secondary">
                {cards.filter((c) => c.isActive && !c.isLocked).length}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-accent">
                ₦{formatCurrency(cards.reduce((sum, card) => sum + card.balance, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Total Balance</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Card Button */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Virtual Card
        </Button>

        {/* Cards List */}
        <div className="space-y-4">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Card Visual */}
                <div className={`bg-gradient-to-r ${card.color} p-6 text-white relative`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm opacity-80">{card.name}</div>
                      <div className="text-xs opacity-60">{card.type.toUpperCase()}</div>
                    </div>
                    <div className="flex gap-2">
                      {card.isLocked && <Lock className="h-4 w-4" />}
                      <Badge className={`${card.isActive ? "bg-success" : "bg-destructive"} text-white`}>
                        {card.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-lg font-mono tracking-wider">
                      {showCardDetails === card.id ? card.cardNumber : "•••• •••• •••• " + card.cardNumber.slice(-4)}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-60">EXPIRES</div>
                      <div className="text-sm">{card.expiryDate}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">CVV</div>
                      <div className="text-sm">{showCardDetails === card.id ? card.cvv : "•••"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-60">BALANCE</div>
                      <div className="text-lg font-bold">₦{formatCurrency(card.balance)}</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCardDetails(showCardDetails === card.id ? null : card.id)}
                      >
                        {showCardDetails === card.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyCardNumber(card.cardNumber)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCardLock(card.id)}
                        className={card.isLocked ? "text-destructive" : "text-success"}
                      >
                        {card.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteCard(card.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Virtual Cards</h3>
            <p className="text-muted-foreground mb-4">Create your first virtual card to get started</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
              Create Card
            </Button>
          </div>
        )}
      </div>

      {/* Create Card Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-sm mx-auto bg-card">
          <DialogHeader className="bg-gradient-to-r from-muted/50 to-card -m-6 mb-4 p-6 rounded-t-2xl border-b border-border/50">
            <DialogTitle className="text-base font-semibold">Create Virtual Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="card-name">Card Name</Label>
              <Input
                id="card-name"
                placeholder="e.g., Online Shopping Card"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="card-balance">Initial Balance (₦)</Label>
              <Input
                id="card-balance"
                type="number"
                placeholder="Enter amount"
                value={newCardBalance}
                onChange={(e) => setNewCardBalance(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateCard} className="flex-1 bg-primary hover:bg-primary/90">
                Create Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
