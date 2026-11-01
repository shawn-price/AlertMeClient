"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Smartphone,
  CreditCard,
  Check,
  Copy,
  Building2,
  Wallet,
  Star,
} from "@/components/ui/iconify-compat"
import { NIGERIAN_BANKS } from "@/lib/banks-data"
import { dataStore } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { StorageManager } from "@/lib/storage-manager"

interface SMSTemplate {
  id: string
  name: string
  bank: string
  content: string
  isDefault: boolean
  placeholders: string[]
  type: "bank" | "wallet"
}

interface BusinessCardData {
  sender: string
  accountNumber: string
  bank: string
  phone: string
  email: string
}

interface SMSTemplateComposerProps {
  onBack: () => void
}

const STORAGE_KEY = "ecobank_sms_templates"
const BUSINESS_CARD_KEY = "ecobank_business_card"

const generateBankTemplates = (): SMSTemplate[] => {
  const templates: SMSTemplate[] = []

  NIGERIAN_BANKS.forEach((bank, index) => {
    templates.push({
      id: `template_${bank.code}_${index}`,
      name: `${bank.name} Alert`,
      bank: bank.name,
      type: bank.type,
      content:
        bank.type === "bank"
          ? `${bank.name.toUpperCase()} ALERT\n━━━━━━━━━━━━━━━\nAcct: {account_number}\nAmt: NGN{amount}\n{transaction_type}: {beneficiary_name}\nDesc: {description}\nBal: NGN{balance}\nRef: {reference}\nDate: {date} {time}\n━━━━━━━━━━━━━━━`
          : `${bank.name.toUpperCase()} NOTIFICATION\n━━━━━━━━━━━━━━━\nWallet: {account_number}\nAmount: NGN{amount}\n{transaction_type} - {beneficiary_name}\nBalance: NGN{balance}\nRef: {reference}\nTime: {date} {time}\n━━━━━━━━━━━━━━━`,
      isDefault: bank.name === "Ecobank Nigeria",
      placeholders: [
        "account_number",
        "amount",
        "transaction_type",
        "beneficiary_name",
        "description",
        "balance",
        "reference",
        "date",
        "time",
      ],
    })
  })

  return templates
}

export function SMSTemplateComposer({ onBack }: SMSTemplateComposerProps) {
  const [templates, setTemplates] = useState<SMSTemplate[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<"all" | "bank" | "wallet">("all")
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<SMSTemplate | null>(null)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [beneficiaries] = useState(dataStore.getBeneficiaries())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("templates")

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    bank: "",
    content: "",
    type: "bank" as "bank" | "wallet",
  })

  const [businessCard, setBusinessCard] = useState<BusinessCardData>({
    sender: dataStore.getUserData().name,
    accountNumber: dataStore.getUserData().accountNumber,
    bank: "Ecobank Nigeria",
    phone: dataStore.getUserData().phone,
    email: dataStore.getUserData().email,
  })


  // Load templates from storage on mount
  useEffect(() => {
    const savedTemplates = StorageManager.loadSync<SMSTemplate[]>(STORAGE_KEY, [])
    if (savedTemplates.length === 0) {
      const defaultTemplates = generateBankTemplates()
      setTemplates(defaultTemplates)
      StorageManager.save(STORAGE_KEY, defaultTemplates)
    } else {
      setTemplates(savedTemplates)
    }

    const savedCard = StorageManager.loadSync<BusinessCardData>(BUSINESS_CARD_KEY, {
      sender: dataStore.getUserData().name,
      accountNumber: dataStore.getUserData().accountNumber,
      bank: "Ecobank Nigeria",
      phone: dataStore.getUserData().phone,
      email: dataStore.getUserData().email,
    })
    setBusinessCard(savedCard)
  }, [])

  // Save templates whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      StorageManager.save(STORAGE_KEY, templates)
    }
  }, [templates])

  // Save business card whenever it changes
  useEffect(() => {
    StorageManager.save(BUSINESS_CARD_KEY, businessCard)
  }, [businessCard])

  const placeholders = [
    { key: "beneficiary_name", label: "Beneficiary Name" },
    { key: "sender_name", label: "Sender Name" },
    { key: "amount", label: "Amount" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "account_number", label: "Account Number" },
    { key: "balance", label: "Balance" },
    { key: "reference", label: "Reference" },
    { key: "description", label: "Description" },
    { key: "bank_name", label: "Bank Name" },
    { key: "transaction_type", label: "Transaction Type" },
  ]

  const filteredTemplates = (Array.isArray(templates) && templates.length > 0)
    ? templates.filter((t) => {
        const bankMatch = selectedBank === "all" || t.bank === selectedBank
        const typeMatch = selectedType === "all" || t.type === selectedType
        return bankMatch && typeMatch
      })
    : []

  const banks = NIGERIAN_BANKS.filter((b) => b.type === "bank")
  const wallets = NIGERIAN_BANKS.filter((b) => b.type === "wallet")

  const insertPlaceholder = (placeholder: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      content: prev.content + `{${placeholder}}`,
    }))
  }

  const handleSaveTemplate = () => {
    if (newTemplate.name && newTemplate.bank && newTemplate.content) {
      const template: SMSTemplate = {
        id: editingTemplate?.id || Date.now().toString(),
        name: newTemplate.name,
        bank: newTemplate.bank,
        content: newTemplate.content,
        type: newTemplate.type,
        isDefault: editingTemplate?.isDefault || false,
        placeholders: extractPlaceholders(newTemplate.content),
      }

      if (editingTemplate) {
        setTemplates(templates.map((t) => (t.id === editingTemplate.id ? template : t)))
      } else {
        setTemplates([...templates, template])
      }

      resetForm()
      setShowTemplateModal(false)
    }
  }

  const extractPlaceholders = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g)
    return matches ? matches.map((match) => match.slice(1, -1)) : []
  }

  const resetForm = () => {
    setNewTemplate({ name: "", bank: "", content: "", type: "bank" })
    setEditingTemplate(null)
  }

  const handleEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      bank: template.bank,
      content: template.content,
      type: template.type,
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const handleSetDefault = (id: string) => {
    setTemplates(templates.map((t) => ({ ...t, isDefault: t.id === id })))
  }

  const handlePreview = (template: SMSTemplate) => {
    setPreviewTemplate(template)
    setSelectedBeneficiary("")
    setShowPreviewModal(true)
  }

  const generatePreviewText = (template: SMSTemplate, beneficiaryId?: string) => {
    let preview = template.content
    const userData = dataStore.getUserData()
    const beneficiary = beneficiaryId ? beneficiaries.find((b) => b.id === beneficiaryId) : beneficiaries[0]

    const sampleData: Record<string, string> = {
      beneficiary_name: beneficiary?.name || "John Doe",
      sender_name: userData.name,
      amount: "50,000.00",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      account_number: beneficiary?.accountNumber || "0123456789",
      balance: formatCurrency(userData.balance),
      reference: `TXN${Date.now().toString().slice(-9)}`,
      description: "Transfer",
      bank_name: template.bank,
      transaction_type: "Debit",
    }

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    })

    return preview
  }

  const handleCopyTemplate = (template: SMSTemplate) => {
    const text = generatePreviewText(template)
    navigator.clipboard.writeText(text)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#004A9F] to-[#0066cc] px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-white">SMS Templates</h1>
        <Button
          size="icon"
          className="bg-white/20 hover:bg-white/30 text-white"
          onClick={() => setShowTemplateModal(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-white border-b rounded-none h-12">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-[#004A9F]/10 data-[state=active]:text-[#004A9F]"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="business-card"
            className="data-[state=active]:bg-[#004A9F]/10 data-[state=active]:text-[#004A9F]"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Business Card
          </TabsTrigger>
        </TabsList>

        {/* Templates are for local editing and preview only. */}
        <TabsContent value="templates" className="px-4 py-4 space-y-4 mt-0">
          <p className="text-sm text-gray-500">Templates are saved on this device for preview and copying; automatic SMS alerts are unavailable.</p>
          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Type</Label>
                  <Select value={selectedType} onValueChange={(v) => setSelectedType(v as "all" | "bank" | "wallet")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bank">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" /> Banks
                        </span>
                      </SelectItem>
                      <SelectItem value="wallet">
                        <span className="flex items-center gap-2">
                          <Wallet className="h-3 w-3" /> Wallets
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Institution</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Institutions</SelectItem>
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Showing {filteredTemplates.length} of {templates.length} templates
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`overflow-hidden ${template.isDefault ? "ring-2 ring-[#004A9F]" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`p-1.5 rounded ${template.type === "bank" ? "bg-blue-100" : "bg-green-100"}`}>
                          {template.type === "bank" ? (
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.bank}</div>
                        </div>
                      </div>
                      {template.isDefault && (
                        <Badge className="bg-[#004A9F] text-white text-[10px] px-2">Default</Badge>
                      )}
                    </div>

                    <div className="text-xs bg-gray-50 p-2 rounded border font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {template.content}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(template)} className="h-8 px-2">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyTemplate(template)}
                          className="h-8 px-2"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 px-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!template.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(template.id)}
                          className="h-8 text-xs text-[#004A9F]"
                        >
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Business Card Tab */}
        <TabsContent value="business-card" className="px-4 py-4 space-y-4 mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#004A9F]" />
                Your Business Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender">Sender Name *</Label>
                <Input
                  id="sender"
                  value={businessCard.sender}
                  onChange={(e) => setBusinessCard({ ...businessCard, sender: e.target.value })}
                  placeholder="Your name or business name"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bc-bank">Bank</Label>
                  <Select
                    value={businessCard.bank}
                    onValueChange={(v) => setBusinessCard({ ...businessCard, bank: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bc-account">Account Number</Label>
                  <Input
                    id="bc-account"
                    value={businessCard.accountNumber}
                    onChange={(e) => setBusinessCard({ ...businessCard, accountNumber: e.target.value })}
                    placeholder="0123456789"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bc-phone">Phone</Label>
                  <Input
                    id="bc-phone"
                    value={businessCard.phone}
                    onChange={(e) => setBusinessCard({ ...businessCard, phone: e.target.value })}
                    placeholder="+234 xxx xxx xxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bc-email">Email</Label>
                  <Input
                    id="bc-email"
                    type="email"
                    value={businessCard.email}
                    onChange={(e) => setBusinessCard({ ...businessCard, email: e.target.value })}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-br from-[#004A9F] to-[#0066cc] p-4 rounded-lg text-white">
                <div className="text-xs opacity-70 mb-1">BUSINESS CARD PREVIEW</div>
                <div className="font-semibold text-lg">{businessCard.sender || "Your Name"}</div>
                <div className="text-sm opacity-90 mt-2 space-y-1">
                  <div>{businessCard.bank}</div>
                  {businessCard.accountNumber && <div>Acct: {businessCard.accountNumber}</div>}
                  {businessCard.phone && <div>{businessCard.phone}</div>}
                  {businessCard.email && <div>{businessCard.email}</div>}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500">Business card details are saved on this device. Automatic SMS sending is unavailable.</p>
        </TabsContent>
      </Tabs>

      {/* Template Editor Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900">
          <DialogHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 -m-6 mb-4 p-4 rounded-t-2xl border-b border-gray-200/50 dark:border-gray-700/50">
            <DialogTitle className="text-base font-semibold">{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value as "bank" | "wallet" })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Institution</Label>
                <Select
                  value={newTemplate.bank}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, bank: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {(newTemplate.type === "bank" ? banks : wallets).map((b) => (
                      <SelectItem key={b.code} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Enter SMS template content..."
                rows={5}
                className="mt-1 font-mono text-sm"
              />
            </div>

            {/* Placeholder Buttons */}
            <div>
              <Label className="text-xs text-gray-500">Insert Placeholders</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {placeholders.map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(p.key)}
                    className="text-xs h-7 px-2"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowTemplateModal(false)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} className="flex-1 bg-[#004A9F] hover:bg-[#003875]">
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-sm mx-auto bg-white dark:bg-gray-900">
          <DialogHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 -m-6 mb-4 p-6 rounded-t-2xl border-b border-gray-200/50 dark:border-gray-700/50">
            <DialogTitle className="text-base font-semibold">Template Preview</DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    previewTemplate.type === "bank" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }
                >
                  {previewTemplate.type === "bank" ? "Bank" : "Wallet"}
                </Badge>
                <span className="font-medium">{previewTemplate.name}</span>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Select Beneficiary for Preview</Label>
                <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Use sample data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sample">Use sample data</SelectItem>
                    {beneficiaries.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {generatePreviewText(previewTemplate, selectedBeneficiary)}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleCopyTemplate(previewTemplate)} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={() => setShowPreviewModal(false)} className="flex-1 bg-[#004A9F] hover:bg-[#003875]">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
