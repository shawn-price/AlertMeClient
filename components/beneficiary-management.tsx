"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Edit, Trash2, Search, AlertCircle } from "@/components/ui/iconify-compat"
import { formatCurrency } from "@/lib/form-utils"
import { dataStore } from "@/lib/data-store"
import { getAllPaymentPlatforms } from "@/lib/banks-data"
import { useToast } from "@/hooks/use-toast"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface BeneficiaryUIData {
  id: string
  name: string
  bank: string
  accountNumber: string
  phone?: string
  balance?: string
  type?: "Business" | "P2P"
  location?: string
}

interface BeneficiaryManagementProps {
  onBack: () => void
}

export function BeneficiaryManagement({ onBack }: BeneficiaryManagementProps) {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryUIData[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const { toast } = useToast()

  // Load beneficiaries from dataStore on mount
  useEffect(() => {
    const loadBeneficiaries = () => {
      const stored = dataStore.getBeneficiaries()
      setBeneficiaries(
        stored.map((b) => ({
          id: b.id,
          name: b.name,
          bank: b.bank,
          accountNumber: b.accountNumber,
          phone: b.phone || "",
          type: "P2P" as const,
          location: "Nigeria",
        })),
      )
    }

    loadBeneficiaries()

    // Subscribe to dataStore changes
    const unsubscribe = dataStore.subscribe(loadBeneficiaries)
    return () => unsubscribe()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<BeneficiaryUIData | null>(null)
  const [newBeneficiary, setNewBeneficiary] = useState<Partial<BeneficiaryUIData>>({
    name: "",
    bank: "",
    accountNumber: "",
    phone: "",
    balance: "",
    type: "P2P",
    location: "Nigeria",
  })

  const filteredBeneficiaries = beneficiaries.filter(
    (beneficiary) =>
      beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.accountNumber.includes(searchTerm),
  )

  const handleAddBeneficiary = () => {
    if (newBeneficiary.name && newBeneficiary.bank && newBeneficiary.accountNumber) {
      try {
        dataStore.addBeneficiary({
          name: newBeneficiary.name,
          bank: newBeneficiary.bank,
          accountNumber: newBeneficiary.accountNumber,
          phone: newBeneficiary.phone || "",
        })

        toast({
          title: "Success",
          description: `${newBeneficiary.name} added to beneficiaries`,
        })

        setNewBeneficiary({
          name: "",
          bank: "",
          accountNumber: "",
          phone: "",
          balance: "",
          type: "P2P",
          location: "Nigeria",
        })
        setShowAddModal(false)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to add beneficiary",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditBeneficiary = (beneficiary: BeneficiaryUIData) => {
    setEditingBeneficiary(beneficiary)
    setNewBeneficiary(beneficiary)
    setShowAddModal(true)
  }

  const handleUpdateBeneficiary = () => {
    if (editingBeneficiary && newBeneficiary.name && newBeneficiary.bank && newBeneficiary.accountNumber) {
      try {
        // Delete old beneficiary and add updated one
        dataStore.deleteBeneficiary(editingBeneficiary.id)
        dataStore.addBeneficiary({
          name: newBeneficiary.name,
          bank: newBeneficiary.bank,
          accountNumber: newBeneficiary.accountNumber,
          phone: newBeneficiary.phone || "",
        })

        toast({
          title: "Success",
          description: "Beneficiary updated",
        })

        setEditingBeneficiary(null)
        setNewBeneficiary({
          name: "",
          bank: "",
          accountNumber: "",
          phone: "",
          balance: "",
          type: "P2P",
          location: "Nigeria",
        })
        setShowAddModal(false)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update beneficiary",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteBeneficiary = (id: string, name: string) => {
    try {
      dataStore.deleteBeneficiary(id)
      toast({
        title: "Deleted",
        description: `${name} removed from beneficiaries`,
      })
      setShowDeleteConfirm(null)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete beneficiary",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col pb-24">
      {/* Header - Fixed */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b sticky top-0 z-10 md:px-6 md:py-5">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1 text-center md:text-xl">Beneficiary Management</h1>
        <Button
          size="icon"
          className="bg-primary hover:bg-primary/90 flex-shrink-0"
          onClick={() => {
            setEditingBeneficiary(null)
            setNewBeneficiary({
              name: "",
              bank: "",
              accountNumber: "",
              phone: "",
              balance: "",
              type: "P2P",
              location: "Nigeria",
            })
            setShowAddModal(true)
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 md:px-6 md:py-8">
        {/* Search */}
        <div className="relative sticky top-0 bg-muted/50 z-5 pb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search beneficiaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card md:pl-12"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          <Card className="text-center">
            <CardContent className="p-3 md:p-4">
              <div className="text-lg font-bold text-primary md:text-xl">{beneficiaries.length}</div>
              <div className="text-xs text-muted-foreground md:text-sm">Total</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3 md:p-4">
              <div className="text-lg font-bold text-secondary md:text-xl">
                {beneficiaries.filter((b) => b.type === "Business").length}
              </div>
              <div className="text-xs text-muted-foreground md:text-sm">Business</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3 md:p-4">
              <div className="text-lg font-bold text-accent md:text-xl">
                {beneficiaries.filter((b) => b.type === "P2P").length}
              </div>
              <div className="text-xs text-muted-foreground md:text-sm">P2P</div>
            </CardContent>
          </Card>
        </div>

        {/* Beneficiaries List */}
        <Card className="flex flex-col">
          <CardHeader className="border-b bg-card sticky top-0 z-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">All Beneficiaries</CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredBeneficiaries.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {filteredBeneficiaries.length === 0 ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No beneficiaries found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredBeneficiaries.map((beneficiary) => (
                  <div
                    key={beneficiary.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3 sm:mb-0 sm:flex-1">
                      <div className="w-10 h-10 bg-primary rounded-full flex flex-shrink-0 items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {beneficiary.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm md:text-base break-words">{beneficiary.name}</div>
                        <div className="text-xs text-muted-foreground md:text-sm break-all">
                          {beneficiary.bank} • {beneficiary.accountNumber}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            className={`text-xs ${
                              beneficiary.type === "Business"
                                ? "bg-primary/10 text-primary"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {beneficiary.type || "P2P"}
                          </Badge>
                          {beneficiary.phone && (
                            <span className="text-xs text-muted-foreground truncate">{beneficiary.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBeneficiary(beneficiary)}
                        className="text-xs md:text-sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(beneficiary.id)}
                        className="text-xs md:text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Beneficiary Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm mx-auto bg-card">
          <DialogHeader className="bg-gradient-to-r from-muted/50 to-card -m-6 mb-4 p-6 rounded-t-2xl border-b border-border/50">
            <DialogTitle className="text-base md:text-lg font-semibold">
              {editingBeneficiary ? "Edit Beneficiary" : "Add New Beneficiary"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newBeneficiary.name || ""}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                placeholder="Enter full name"
                className="bg-card"
              />
            </div>

            <div>
              <Label htmlFor="bank">Bank</Label>
              <SearchableSelect
                options={getAllPaymentPlatforms().map((bank) => ({
                  value: bank.name,
                  label: bank.name,
                }))}
                value={newBeneficiary.bank || ""}
                onValueChange={(value) => setNewBeneficiary({ ...newBeneficiary, bank: value })}
                placeholder="Type or select bank"
                searchPlaceholder="Search banks..."
                className="bg-card"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={newBeneficiary.accountNumber || ""}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, accountNumber: e.target.value })}
                placeholder="Enter account number"
                inputMode="numeric"
                className="bg-card"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newBeneficiary.phone || ""}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, phone: e.target.value })}
                placeholder="Enter phone number"
                className="bg-card"
              />
            </div>

            <div>
              <Label htmlFor="balance">Account Balance</Label>
              <Input
                id="balance"
                value={newBeneficiary.balance || ""}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, balance: e.target.value })}
                placeholder="Enter account balance"
                inputMode="numeric"
                className="bg-card"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingBeneficiary(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingBeneficiary ? handleUpdateBeneficiary : handleAddBeneficiary}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {editingBeneficiary ? "Update" : "Add"} Beneficiary
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm mx-auto bg-card">
          <DialogHeader className="bg-gradient-to-r from-destructive/10 to-destructive/5 -m-6 mb-4 p-6 rounded-t-2xl border-b border-destructive/15">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Beneficiary?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this beneficiary? This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const beneficiary = beneficiaries.find((b) => b.id === showDeleteConfirm)
                if (beneficiary) {
                  handleDeleteBeneficiary(showDeleteConfirm!, beneficiary.name)
                }
              }}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
