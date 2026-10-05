"use client"

import { useState } from "react"
import { memo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Delete } from "@/components/ui/iconify-compat"

interface PinConfirmationProps {
  onBack: () => void
  onNavigate: (screen: string, data?: any) => void
  transferData?: any
}

function PinConfirmationComponent({ onBack, onNavigate, transferData }: PinConfirmationProps) {
  const [pin, setPin] = useState("")

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num)
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
  }

  const handleSubmit = () => {
    if (pin.length === 4) {
      onNavigate("transfer-processing", transferData)
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Review</h1>
        <div className="w-10"></div>
      </div>

      {/* From Account */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">From</span>
          <Button variant="link" className="text-destructive text-sm p-0" onClick={onBack}>
            Cancel
          </Button>
        </div>
        <div className="bg-muted rounded-lg p-3 flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
            <span className="text-sm">Savings account</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* PIN Entry */}
      <div className="px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Confirm Transfer</h2>
        <p className="text-sm text-muted-foreground mb-8">Please enter your 4-digit pin to proceed or complete transaction</p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 ${
                index < pin.length ? "bg-gray-400 border-gray-400" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={pin.length !== 4}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full mb-8 disabled:opacity-50"
        >
          Submit
        </Button>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-16 text-xl font-semibold bg-card"
              onClick={() => handleNumberPress(num.toString())}
            >
              {num}
            </Button>
          ))}
          <div></div>
          <Button
            variant="outline"
            className="h-16 text-xl font-semibold bg-card"
            onClick={() => handleNumberPress("0")}
          >
            0
          </Button>
          <Button variant="outline" className="h-16 bg-card" onClick={handleDelete}>
            <Delete className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const PinConfirmation = memo(PinConfirmationComponent)
