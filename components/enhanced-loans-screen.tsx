"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Home, Plus, FileText, ClipboardList, Upload } from "@/components/ui/iconify-compat"
import { dataStore, type LoanApplication } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"
import { LoanDocumentUpload } from "@/components/loan-document-upload"

interface EnhancedLoansScreenProps {
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function EnhancedLoansScreen({ onBack, onNavigate }: EnhancedLoansScreenProps) {
  const [loanAmount, setLoanAmount] = useState("")
  const [loanTerm, setLoanTerm] = useState("")
  const [loanPurpose, setLoanPurpose] = useState("")
  const [selectedLoanType, setSelectedLoanType] = useState("")
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null)

  useEffect(() => {
    setLoanApplications(dataStore.getLoanApplications())

    const unsubscribe = dataStore.subscribe(() => {
      setLoanApplications(dataStore.getLoanApplications())
    })

    return unsubscribe
  }, [])

  const loanTypes = [
    {
      id: "quick",
      name: "Quick Loan",
      rate: 2.5,
      maxAmount: 500000,
      term: "1-6 months",
      description: "Instant loan approval within minutes",
    },
    {
      id: "personal",
      name: "Personal Loan",
      rate: 18,
      maxAmount: 2000000,
      term: "6-36 months",
      description: "Flexible personal financing solution",
    },
    {
      id: "business",
      name: "Business Loan",
      rate: 15,
      maxAmount: 10000000,
      term: "12-60 months",
      description: "Grow your business with our financing",
    },
  ]

  const activeLoans = loanApplications.filter((loan) => loan.status === "Approved")

  const calculateLoanDetails = () => {
    const principal = Number.parseFloat(loanAmount)
    const months = Number.parseInt(loanTerm)
    const selectedType = loanTypes.find((type) => type.id === selectedLoanType)

    if (principal && months && selectedType) {
      const monthlyRate = selectedType.rate / 100 / 12
      const monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      const totalRepayment = monthlyPayment * months
      const totalInterest = totalRepayment - principal

      return {
        monthlyPayment: monthlyPayment,
        totalRepayment: totalRepayment,
        totalInterest: totalInterest,
        interestRate: selectedType.rate,
      }
    }

    return null
  }

  const handleApplyForLoan = async () => {
    if (!selectedLoanType || !loanAmount || !loanTerm || !loanPurpose) {
      return
    }

    setIsSubmitting(true)

    const selectedType = loanTypes.find((type) => type.id === selectedLoanType)
    const loanDetails = calculateLoanDetails()

    if (selectedType && loanDetails) {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      dataStore.addLoanApplication({
        type: selectedType.name,
        amount: Number.parseFloat(loanAmount),
        term: Number.parseInt(loanTerm),
        purpose: loanPurpose,
        status: "Submitted",
        monthlyPayment: loanDetails.monthlyPayment,
        interestRate: loanDetails.interestRate,
        totalRepayment: loanDetails.totalRepayment,
      })

      // Reset form
      setLoanAmount("")
      setLoanTerm("")
      setLoanPurpose("")
      setSelectedLoanType("")
    }

    setIsSubmitting(false)
  }

  const loanDetails = calculateLoanDetails()

  if (selectedApplication) {
    return (
      <LoanDocumentUpload
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Loans</h1>
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        <Button
          onClick={() => onNavigate("loan-requirements")}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 flex items-center justify-center gap-2"
        >
          <ClipboardList className="h-4 w-4" />
          Review Loan Requirements
        </Button>

        {/* Loan Applications */}
        {loanApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Loan Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loanApplications.map((application) => (
                <div key={application.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{application.type}</div>
                    <Badge
                      className={`${
                        application.status === "Approved"
                          ? "bg-success/15 text-success"
                          : application.status === "Rejected"
                            ? "bg-destructive/15 text-destructive"
                            : application.status === "Under Review"
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/10 text-primary"
                      }`}
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-medium">₦{formatCurrency(application.amount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly Payment</div>
                      <div className="font-medium">₦{formatCurrency(application.monthlyPayment)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Term</div>
                      <div className="font-medium">{application.term} months</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Applied</div>
                      <div className="font-medium">{new Date(application.applicationDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(application.status === "Submitted" || application.status === "Under Review") && (
                      <Button
                        onClick={() => setSelectedApplication(application)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground py-2 text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Documents
                      </Button>
                    )}
                    {application.status === "Approved" && (
                      <Button
                        onClick={() => onNavigate("loan-agreement")}
                        className="bg-primary hover:bg-primary/90 text-white py-2 text-sm col-span-2"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View & Sign Agreement
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Loan Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Apply for New Loan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loan Type Selection */}
            <div>
              <Label>Loan Type</Label>
              <Select value={selectedLoanType} onValueChange={setSelectedLoanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {loanTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.rate}% APR
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount */}
            <div>
              <Label htmlFor="loan-amount">Loan Amount (₦)</Label>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter loan amount"
                max={selectedLoanType ? loanTypes.find((t) => t.id === selectedLoanType)?.maxAmount : undefined}
              />
              {selectedLoanType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: ₦{formatCurrency(loanTypes.find((t) => t.id === selectedLoanType)?.maxAmount || 0)}
                </p>
              )}
            </div>

            {/* Loan Term */}
            <div>
              <Label htmlFor="loan-term">Loan Term (months)</Label>
              <Select value={loanTerm} onValueChange={setLoanTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loan Purpose */}
            <div>
              <Label htmlFor="loan-purpose">Purpose of Loan</Label>
              <Select value={loanPurpose} onValueChange={setLoanPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Expansion</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="home">Home Improvement</SelectItem>
                  <SelectItem value="personal">Personal Use</SelectItem>
                  <SelectItem value="debt">Debt Consolidation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loan Calculator Results */}
            {loanDetails && (
              <div className="bg-primary text-white p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Loan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="opacity-80">Monthly Payment</div>
                    <div className="text-lg font-bold">₦{formatCurrency(loanDetails.monthlyPayment)}</div>
                  </div>
                  <div>
                    <div className="opacity-80">Total Repayment</div>
                    <div className="text-lg font-bold">₦{formatCurrency(loanDetails.totalRepayment)}</div>
                  </div>
                  <div>
                    <div className="opacity-80">Total Interest</div>
                    <div className="font-medium">₦{formatCurrency(loanDetails.totalInterest)}</div>
                  </div>
                  <div>
                    <div className="opacity-80">Interest Rate</div>
                    <div className="font-medium">{loanDetails.interestRate}% APR</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Loan Types Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Loan Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loanTypes.map((loan) => (
              <div
                key={loan.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedLoanType === loan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelectedLoanType(loan.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{loan.name}</div>
                  <Badge className="bg-accent text-accent-foreground">{loan.rate}% APR</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">{loan.description}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Max Amount</div>
                    <div className="font-medium">₦{formatCurrency(loan.maxAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Term</div>
                    <div className="font-medium">{loan.term}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Apply Button */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white py-3"
          disabled={!selectedLoanType || !loanAmount || !loanTerm || !loanPurpose || isSubmitting}
          onClick={handleApplyForLoan}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting Application...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Loan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
